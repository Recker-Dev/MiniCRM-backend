import { PrismaClient } from "@prisma/client";
import { sendMessage } from "../event/kafkaProducer.js"
const prisma = new PrismaClient();



export async function getCommunicationLog(req, res) {
    try {
        const logs = await prisma.communication_log.findMany();
        res.json(logs);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}
