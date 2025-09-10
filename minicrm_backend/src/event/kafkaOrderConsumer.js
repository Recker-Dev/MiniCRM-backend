const { Kafka } = require("kafkajs");
const { PrismaClient } = require("@prisma/client");
const { stringifyAndSort, createChecksum } = require('../helper/helper')

const prisma = new PrismaClient();

// For DB BATCH updation
const BATCH_SIZE = 5;

// Using a Map to automatically handle duplicate messages in the buffer
const batchBuffer = new Map();

const kafka = new Kafka({
    clientId: 'order-consumer-group',
    brokers: ["localhost:9092"],
})

const consumer = kafka.consumer({ groupId: 'order-creation-group' });

const processBatch = async () => {
    if (batchBuffer.size > 0) {
        console.log(`Processing batch of ${batchBuffer.size} unique orders...`);
        const ordersToCreate = Array.from(batchBuffer.values())

        // BATCH LEVEL OPS
        // Group orders by customers to batch update 
        const customerUpdateMap = ordersToCreate.reduce((acc, order) => {
            const { customerId, amount, status, order_date } = order;
            if (!acc[customerId]) {
                acc[customerId] = { totalAmount: 0, orderCount: 0 };
            }

            if (status === 'COMPLETED') { // Complete increases spend and visits
                acc[customerId].totalAmount += amount;
                acc[customerId].orderCount += 1;

                // track the latest order_date for completed orders
                if (!acc[customerId].order_date || new Date(order_date) > new Date(acc[customerId].order_date)) {
                    acc[customerId].order_date = order_date;
                }

            } else if (status === 'REFUNDED') {  // Refund reduces spend but not visits
                acc[customerId].totalAmount -= amount;
                acc[customerId].orderCount += 1;
            } else if (status === "CANCELLED") { // Cancelled still increases visits
                acc[customerId].orderCount += 1;
            }

            return acc;
        }, {}); // Output[Dict] of: {customerId: {totalAmount: XX, orderCount: XX}}


        try {

            await prisma.$transaction(async (tx) => {
                // 1. Create all orders in the batch 
                const orderQueries = ordersToCreate.map(order => {
                    const { id, customerId, amount, status, items } = order;
                    return tx.order.create({
                        data: {
                            id: id,
                            customerId: customerId,
                            amount: amount,
                            status: status,
                            items: {
                                createMany: {
                                    data: items,
                                    skipDuplicates: true
                                }
                            }
                        }
                    });

                });

                await Promise.all(orderQueries);

                // 2. Fetch current customer data for all affected customers
                const customersToUpdate = await tx.customer.findMany({
                    where: { id: { in: Object.keys(customerUpdateMap) } },
                });

                // 3. Update customers with new values
                const customerUpdateQueries = customersToUpdate.map(customer => {
                    const updates = customerUpdateMap[customer.id];

                    if (!updates) return null; // safeguard

                    const newSpend = customer.total_spend + updates.totalAmount;
                    const newVist = customer.visit + updates.orderCount;

                    return tx.customer.update({
                        where: { id: customer.id },
                        data: {
                            total_spend: Math.max(0, newSpend),
                            visit: Math.max(0, newVist),
                            last_order_date: updates.order_date
                                ? new Date(updates.order_date)
                                : customer.last_order_date,  // keep old one if no valid new
                        },
                    });
                }).filter(Boolean);

                await Promise.all(customerUpdateQueries);
            })
            console.log(`Batch insertion and customer updates successful for ${ordersToCreate.length} orders.`);
            batchBuffer.clear();
        } catch (error) {
            console.error('❌ Error during batch insertion and updates:', error);

            // --- Error Handling Strategy ---
            try {
                await prisma.failedBatch.create({
                    data: {
                        payload: JSON.stringify(ordersToCreate),
                        error_message: error.message,
                        created_at: new Date(),
                    }
                });
                console.log("⚠️ Failed batch logged for retry.");
            } catch (logErr) {
                console.error("❌ Failed to log failed batch:", logErr);
            }

            // 2. Keep buffer intact (optional: backoff retry)
            // For now, clear to avoid duplicate processing
            batchBuffer.clear();
        }

    }
};


const runOrderConsumer = async () => {
    try {
        await consumer.connect();
        console.log('✅  Kafka order consumer connected successfully.');
    } catch (error) {
        console.error('Error connecting to Kafka producer:', error);
    }

    await consumer.subscribe({ topic: 'order-topic', fromBeginning: false });

    await consumer.run({
        eachMessage: async ({ message }) => {
            const orderData = JSON.parse(message.value.toString());
            console.log(`Received message for order for customer: ${orderData.customerId}, amount: ${orderData.amount}`);


            // We trust the `id` from the producer to handle de-duplication
            batchBuffer.set(orderData.id, orderData);

            // Check if the batch size has been reached
            if (batchBuffer.size >= BATCH_SIZE) {
                await processBatch();
            }
        }
    })
};


// Add a timer to process any remaining messages in the buffer
setInterval(processBatch, 10000); // Process every 10 seconds even if batch size isn't met

// Gracefully handle consumer shutdown
const disconnectOrderConsumer = async () => {
    await consumer.disconnect();
    console.log('Kafka order consumer disconnected.');
};


module.exports = {
    runOrderConsumer,
    disconnectOrderConsumer
};