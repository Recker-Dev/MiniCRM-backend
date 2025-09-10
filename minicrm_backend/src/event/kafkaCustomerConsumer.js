const { Kafka } = require("kafkajs");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();


// For DB BATCH updation
const BATCH_SIZE = 5;

// Using a Map to automatically handle duplicate messages in the buffer
const batchBuffer = new Map();

const kafka = new Kafka({
    clientId: 'customer-consumer-group',
    brokers: ["localhost:9092"],
})

const consumer = kafka.consumer({ groupId: 'customer-creation-group' });

const processBatch = async () => {
    if (batchBuffer.size > 0) {
        console.log(`Processing batch of ${batchBuffer.size} unique customers...`);
        const customersToCreate = Array.from(batchBuffer.values())
        try {

            //Collect all emails and phones from current batch
            const emails = customersToCreate.map(c => c.email);
            const phones = customersToCreate.filter(c => c.phone).map(c => c.phone);

            //Perform a batch query
            const existingCustomers = await prisma.customer.findMany({
                where: {
                    OR: [
                        { email: { in: emails } },
                        { phone: { in: phones } }
                    ]
                }
            });

            // Filter customers that already in DB
            const newCustomers = customersToCreate.filter(customer => {
                const alreadyExists = existingCustomers.some(existing =>
                    existing.email === customer.email || existing.phone === customer.phone
                );
                return !alreadyExists;
            });

            if (newCustomers.length > 0) {
                await prisma.customer.createMany({
                    data: newCustomers,
                    skipDuplicates: true
                });
                console.log(`Batch insertion successful for ${newCustomers.length} new customers.`);
            } else {
                console.log("All customers in the batch already exist. No new records created.");
            }

            batchBuffer.clear();
        } catch (error) {
            console.error('Error during batch insertion:', error);
        }

    }
};

const runCustomerConsumer = async () => {
    try {
        await consumer.connect();
        console.log('✅  Kafka customer consumer connected successfully.');
    } catch (error) {
        console.error('Error connecting to Kafka producer:', error);
    }

    await consumer.subscribe({ topic: 'customer-topic', fromBeginning: false });

    await consumer.run({
        eachMessage: async ({ message }) => {
            const customerData = JSON.parse(message.value.toString());
            console.log(`Received message for customer: ${customerData.name}`);

            // The Map automatically handles duplicates based on the key
            batchBuffer.set(customerData.email, customerData);

            // Check if the batch size has been reached
            if (batchBuffer.size >= BATCH_SIZE) {
                await processBatch();
            }
        }
    });
};

// Add a timer to process any remaining messages in the buffer
setInterval(processBatch, 15000); // Process every 15 seconds even if batch size isn't met



// Gracefully handle consumer shutdown
const disconnectCustomerConsumer = async () => {
    await consumer.disconnect();
    console.log('Kafka customer consumer disconnected.');
};


module.exports = {
    runCustomerConsumer,
    disconnectCustomerConsumer
}