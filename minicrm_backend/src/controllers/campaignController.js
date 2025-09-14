import { v4 as uuidv4 } from 'uuid';
import { PrismaClient } from "@prisma/client";
import { sendMessage } from "../event/kafkaProducer.js";
import { buildPrismaFilter } from "../helper/helper.js";
import { getIntent } from '../aiServices/aiService.js';
const prisma = new PrismaClient();

function personalizedMessage(template, customer) {
    return template
        .replace(/{{name}}/g, customer.name)
        .replace(/{{email}}/g, customer.email)
        .replace(/{{city}}/g, customer.city || "")
        .replace(/{{phone}}/g, customer.phone || "")
}



export async function startCampaign(req, res) {
    const { userId, name, ruleGroup, message } = req.body;
    try {

        // 1. Prisma filter
        const prismaFilter = ruleGroup ? buildPrismaFilter(ruleGroup) : {};
        // console.log(JSON.stringify(prismaFilter, null, 3));

        // 2. Fetch eligible customers
        const customers = await prisma.customer.findMany({
            where: prismaFilter,
        });

        // 3. Verify customer presence
        if (customers.length === 0) {
            return res.status(200).json({
                message: "No customers match this segment.",
            });
        }

        // 4. Get Intent of segment
        const intent = await getIntent(prismaFilter);
        // console.log(intent);

        // 3. Create campaign row
        const campaign = await prisma.campaign.create({
            data: {
                name,
                userId,
                segment: JSON.stringify(prismaFilter, null, 3),
                intent: intent,
                message,
                audience_size: customers.length,
                status: "RUNNING",
                pending_count: customers.length,
            },
        });

        // 3. Prepare Communication Logs
        const commLogs = customers.map((c) => ({
            id: uuidv4(),
            campaignId: campaign.id,
            customerId: c.id,
            customer_name: c.name,
            email: c.email,
            phone: c.phone,
            personalized_msg: personalizedMessage(message, c),
        }));

        // 4. Bulk log insert
        await prisma.communication_log.createMany({
            data: commLogs,
            skipDuplicates: true
        });

        // 5. Fire-and-forget Kafka
        commLogs.forEach(comm => {
            setImmediate(() => {
                sendMessage("campaign-deliveries", {
                    commId: comm.id, // now valid
                    campaignId: campaign.id,
                    customerId: comm.customerId,
                    name: comm.customer_name,
                    email: comm.email,
                    phone: comm.phone,
                    personalized_msg: comm.personalized_msg,
                }).catch(console.error);
            });
        });

        return res.status(201).json({
            message: "Campaign started successfully",
            campaignId: campaign.id,
            audience_size: customers.length,
            intent: intent
        });

    } catch (error) {
        console.error("Error starting campaign:", error);
        return res.status(500).json({ error: "Failed to start campaign" });
    }
}


export async function getCampaign(req, res) {
    try {
        const { userId } = req.body || {};

        if (!userId) {
            // No userId provided, return all campaigns
            const campaigns = await prisma.campaign.findMany();
            return res.json(campaigns || []);
        }

        // Fetch campaigns for the given user
        // console.log("Fetching campaigns for user:", userId);
        const campaigns = await prisma.campaign.findMany({
            where: { userId },
        });

        return res.json(campaigns || []);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}
