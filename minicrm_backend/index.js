// src/index.js
import express from "express";
import cors from "cors";

import customerRoutes from "./src/routes/customerRoutes.js";
import orderRoutes from "./src/routes/orderRoutes.js";
import communicationRoutes from './src/routes/communicationRoutes.js';
import campaignRoutes from './src/routes/campaignRoutes.js';
import deliveryRoutes from './src/routes/deliveryRoutes.js';

import { createTopics } from "./src/config/kafkaInit.js";
import { connectProducer, disconnectProducer } from "./src/event/kafkaProducer.js";

const app = express();
app.use(express.json());
app.use(cors());


// Routes
app.use("/customers", customerRoutes);
app.use("/orders", orderRoutes);
app.use("/communications", communicationRoutes);
app.use("/campaigns", campaignRoutes);
app.use("/receipts", deliveryRoutes);

const PORT = 3000;

// Async function to manage the startup sequence
const startApp = async () => {
    try {
        // Await the topic existence/creation
        await createTopics().catch(console.error);

        // Await the producer connection.
        await connectProducer().catch(console.error);

        // Start the http server.
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });

    } catch (error) {
        console.error('Failed to start application:', error);
        process.exit(1); // Exit if critical services fail to connect
    }
};

// Start the application
startApp();

// Handle graceful shutdown by listening for termination signals
const shutdown = async () => {
    console.log('\nShutting down...');
    await disconnectProducer();
    process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
