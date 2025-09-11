import { sendMessage } from "../event/kafkaProducer.js";


export async function receiptApi(req, res) {
    const receipts = req.body;
    try {
        // console.log(JSON.stringify(receipts,null,3));

        if (!Array.isArray(receipts) || receipts.length === 0) {
            return res.status(400).json({ error: "Invalid request. Expected an array of delivery objects." });
        }

        // Publish to Kafka
        await Promise.all(
            receipts.map((r) => sendMessage("deliveries-receipt", r))
        );

        // receipts.forEach((r)=> console.log(r));

        return res.status(201).json({
            message: "Receipts received successfully",
            count: receipts.length,
        });

    } catch (error) {
        console.error("Error in receiptApi:", error);
        return res.status(500).json({ error: "Failed to process receipts" });
    }
};