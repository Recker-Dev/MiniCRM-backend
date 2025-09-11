import { Kafka } from "kafkajs";
import axios from "axios";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// For DB BATCH updation
const BATCH_SIZE = 5;

// Buffer to hold messages until batch size or timer
const batchBuffer = new Map();

const kafka = new Kafka({
  clientId: "campaign-consumer",
  brokers: ["localhost:9092"],
});

const consumer = kafka.consumer({ groupId: "campaign-creation-group" });

const processBatch = async () => {
  if (batchBuffer.size === 0) return;

  const campaignList = Array.from(batchBuffer.values());

  try {
    await axios.post("http://localhost:3500/vendor", campaignList, {
      timeout: 5000,
    });
    console.log(`📬 Sent ${campaignList.length} requests to vendor.`);
    batchBuffer.clear();
  } catch (error) {
    console.error("❌ Failed to call Vendor API:", error.message);
    batchBuffer.clear(); // flush even if error 
  }
};

export const runCampaignConsumer = async () => {
  try {
    await consumer.connect();
    console.log("✅ Kafka campaign consumer connected successfully.");
  } catch (error) {
    console.error("❌ Error connecting to Kafka consumer:", error);
  }

  await consumer.subscribe({
    topic: "campaign-deliveries",
    fromBeginning: false,
  });

  await consumer.run({
    eachMessage: async ({ message }) => {
      const campaignData = JSON.parse(message.value.toString());
      // console.log(
      //   `📥 Received message for campaign delivery: ${JSON.stringify(
      //     campaignData
      //   )}`
      // );

      // Use commId as unique key
      batchBuffer.set(campaignData.commId, campaignData);

      // Trigger immediate batch if size reached
      if (batchBuffer.size >= BATCH_SIZE) {
        await processBatch();
      }
    },
  });
};

// Process leftovers every 15s
setInterval(processBatch, 15000);

// Graceful shutdown
export const disconnectCampaignConsumer = async () => {
  await consumer.disconnect();
  console.log("👋 Kafka campaign consumer disconnected.");
};
