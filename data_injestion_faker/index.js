const { startCustomerGenerator, stopCustomerGenerator } = require('./src/customerGenerator');
const { startOrderGenerator, stopOrderGenerator } = require("./src/orderGenerator")

console.log('Starting customer and/or order generator. Press Ctrl+C to stop.');

// Start the customer generator
// startCustomerGenerator();
startOrderGenerator();

// Handle graceful shutdown by listening for termination signals
const shutdown = () => {
    console.log('\nShutting down...');
    // stopCustomerGenerator();
    stopOrderGenerator();
    process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
