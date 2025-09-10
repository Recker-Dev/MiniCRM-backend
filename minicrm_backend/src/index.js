// src/index.js
const express = require("express");
const cors = require("cors");
const customerRoutes = require("./routes/customerRoutes");
const orderRoutes = require("./routes/orderRoutes");

const { createTopics } = require("./config/kafkaInit");
const { connectProducer, disconnectProducer } = require("./event/kafkaProducer");
const { runCustomerConsumer, disconnectCustomerConsumer } = require("./event/kafkaCustomerConsumer");
const { runOrderConsumer, disconnectOrderConsumer } = require('./event/kafkaOrderConsumer');

const app = express();
app.use(express.json());
app.use(cors());


// Routes
app.use("/customers", customerRoutes);
app.use("/orders", orderRoutes);

const PORT = 3000;

// Async function to manage the startup sequence
const startApp = async () => {
    try {
        // Await the topic existence/creation
        await createTopics().catch(console.error);

        // Await the producer connection.
        await connectProducer().catch(console.error);

        // Await the customer consumer connection and group joining.
        await runCustomerConsumer().catch(console.error);

        // Await the order consumer connection and group joining.
        await runOrderConsumer().catch(console.error);

        // Start the http server.
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
            console.log("✅ ALL INITIALIZATIONS DONE. READY FOR OPERATIONS!")
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
    await disconnectCustomerConsumer();
    await disconnectOrderConsumer();
    process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
