import { runCustomerConsumer, disconnectCustomerConsumer } from "./src/event/kafkaCustomerConsumer.js";
import { runOrderConsumer, disconnectOrderConsumer } from './src/event/kafkaOrderConsumer.js';
import { runCampaignConsumer, disconnectCampaignConsumer } from "./src/event/kafkaCampaignConsumer.js";
import { runDeliveryConsumer, disconnectDeliveryConsumer } from "./src/event/kafkaReceiptConsumer.js";


async function main() {
    console.log("🚀 Kafka consumers starting...");

    await Promise.all([
        runCustomerConsumer(),
        runOrderConsumer(),
        runCampaignConsumer(),
        runDeliveryConsumer(),
    ])

    // Keep the process alive
    process.stdin.resume();
}

// Graceful shutdown
const shutdown = async () => {
    console.log("\n🛑 Shutting down consumers...");

    try {
        await Promise.all([
            disconnectCustomerConsumer(),
            disconnectOrderConsumer(),
            disconnectCampaignConsumer(),
            disconnectDeliveryConsumer(),
        ]);

        console.log("✅ Clean shutdown complete.");
    } catch (err) {
        console.error("❌ Error during shutdown:", err);
    } finally {
        process.exit(0);
    }
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

main().catch(err => {
    console.error("❌ Consumer process crashed:", err);
    process.exit(1);
});