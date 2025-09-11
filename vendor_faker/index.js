// src/index.js
import express from "express";
import cors from "cors";

import vendorRoutes from './src/routes/vendorRoutes.js';


const app = express();
app.use(express.json());
app.use(cors());


// Routes
app.use("/vendor", vendorRoutes);

const PORT = 3500;

// Async function to manage the startup sequence
const startApp = async () => {
    try {
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
    process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
