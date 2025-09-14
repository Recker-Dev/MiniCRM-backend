import { Kafka } from 'kafkajs';
import { PrismaClient } from '@prisma/client';
import { getCampaignSummary } from '../aiServices/aiService.js';
const prisma = new PrismaClient();


// For DB BATCH updation
const BATCH_SIZE = 5;

// Using a Map to automatically handle duplicate messages in the buffer
const batchBuffer = new Map();

const kafka = new Kafka({
    clientId: 'delivery-consumer-group',
    brokers: ["localhost:9092"],
})

const consumer = kafka.consumer({ groupId: 'delivery-resolution-group' });

const processBatch = async () => {
    const receipts = Array.from(batchBuffer.values());
    batchBuffer.clear();

    if (receipts.length === 0) return;

    try {
        // --- 0️⃣ Compute campaign stats outside the transaction ---
        const campaignStats = receipts.reduce((acc, r) => {
            if (!acc[r.campaignId]) acc[r.campaignId] = { sent: 0, failed: 0 };
            if (r.status === "SENT") acc[r.campaignId].sent++;
            else if (r.status === "FAILED") acc[r.campaignId].failed++;
            return acc;
        }, {});

        // --- 1. Transaction: update communication logs + campaign counts ---
        const updatedCampaigns = await prisma.$transaction(async (tx) => {
            // Update communication logs
            await Promise.all(
                receipts.map(r =>
                    tx.communication_log.update({
                        where: { id: r.commId },
                        data: { status: r.status, delivered_at: new Date() },
                    })
                )
            );

            // Update campaigns counts
            const campaigns = await Promise.all(
                Object.entries(campaignStats).map(([campaignId, stats]) =>
                    tx.campaign.update({
                        where: { id: campaignId },
                        data: {
                            sent_count: { increment: stats.sent },
                            failed_count: { increment: stats.failed },
                            pending_count: { decrement: stats.sent + stats.failed },
                        },
                    })
                )
            );

            return campaigns.filter(c => c.pending_count <= 0); // completed campaigns
        });

        // --- 2️⃣ Generate summaries outside the transaction ---
        const summaries = await Promise.all(
            updatedCampaigns.map(c =>
                getCampaignSummary(
                    c.name,
                    c.intent,
                    c.segment,
                    c.audience_size,
                    c.sent_count,
                    c.failed_count
                )
            )
        );

        // --- 3️⃣ Update completed campaigns with summaries ---
        await prisma.$transaction(
            updatedCampaigns.map((c, index) =>
                prisma.campaign.update({
                    where: { id: c.id },
                    data: { status: "COMPLETED", summary: summaries[index] },
                })
            )
        );

        console.log(`✅ Processed batch of ${receipts.length} receipts`);
    } catch (err) {
        console.error("❌ Error processing batch:", err);
    }
};


export const runDeliveryConsumer = async () => {
    try {
        await consumer.connect();
        console.log('✅  Kafka delivery consumer connected successfully.');
    } catch (error) {
        console.error('Error connecting to Kafka producer:', error);
    }

    await consumer.subscribe({ topic: 'deliveries-receipt', fromBeginning: false });

    await consumer.run({
        eachMessage: async ({ message }) => {
            const receiptData = JSON.parse(message.value.toString());
            // console.log(`Received message for DB log:`, receiptData);

            // The Map automatically handles duplicates based on the key
            batchBuffer.set(receiptData.commId, receiptData);

            // // Check if the batch size has been reached
            if (batchBuffer.size >= BATCH_SIZE) {
                await processBatch();
            }
        }
    });
};

// Add a timer to process any remaining messages in the buffer
setInterval(processBatch, 15000); // Process every 15 seconds even if batch size isn't met



// Gracefully handle consumer shutdown
export const disconnectDeliveryConsumer = async () => {
    await consumer.disconnect();
    console.log('Kafka campaign consumer disconnected.');
};


