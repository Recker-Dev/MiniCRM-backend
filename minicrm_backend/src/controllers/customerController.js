import { PrismaClient } from "@prisma/client";
import { createCustomerEntryValidationService } from "../valServices/customerService.js";
import { sendMessage } from "../event/kafkaProducer.js"
import { buildPrismaFilter } from "../helper/helper.js";
const prisma = new PrismaClient();

export async function createCustomer(req, res) {
    try {
        // Step 1: Validate customer data
        const validationMessage = await createCustomerEntryValidationService(req.body);

        // Step 2: If validation fails
        if (validationMessage != "Validation passed") {
            return res.status(400).json({ message: validationMessage });
        }

        // Step 3: Validation passed, send the customer data to Kafka
        const customerData = req.body;
        const topic = 'customer-topic';

        // Publish the customer data to Kafka
        await sendMessage(topic, customerData);

        // Step 4: Respond with a task trigger success message
        res.status(202).json({
            message: "Customer data submitted for creation. It will be processed shortly."
        });

    } catch (err) {
        res.status(500).json({ message: `Internal server error,${err}` });
    }
}

export async function getCustomers(req, res) {
    try {
        let customers;

        if (!req.body || Object.keys(req.body).length === 0) {
            // no filters => return all
            customers = await prisma.customer.findMany();
        } else {
            // apply rule engine
            const prismaFilter = buildPrismaFilter(req.body);
            // console.log(prismaFilter);
            customers = await prisma.customer.findMany({
                where: prismaFilter,
            });
        }

        res.json(customers);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}