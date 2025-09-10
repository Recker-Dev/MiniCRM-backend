const axios = require('axios');
const { faker } = require('@faker-js/faker');

const GENERATION_INTERVAL_MS = 1500; // Generate a new order every 1.5 seconds

const generateRandomOrder = async () => {
    try {
        // Step 1: Get a list of all customers
        const response = await axios.get('http://localhost:3000/customers');
        const customers = response.data;

        if (!customers || customers.length === 0) {
            console.warn('[ORDER GENERATOR] No customers found in the database. Cannot generate an order.');
            return null;
        }

        // Step 2: Pick a random customer from the list
        const randomCustomer = faker.helpers.arrayElement(customers);
        const customerId = randomCustomer.id;

        // Step 3: Generate random order items
        const numItems = faker.number.int({ min: 1, max: 5 });
        const items = [];
        let totalAmount = 0;

        for (let i = 0; i < numItems; i++) {
            const unitPrice = faker.number.float({ min: 10, max: 500, precision: 0.01, fractionDigits: 2 });
            const quantity = faker.number.int({ min: 1, max: 10 });
            const itemTotal = unitPrice * quantity;

            items.push({
                name: faker.commerce.productName(),
                quantity,
                unitPrice,
                total: itemTotal
            });
            totalAmount += itemTotal;
        }

        // Step 4: Generate a unique ID for the order
        const id = faker.string.uuid();

        const orderData = {
            id,
            order_date: new Date(),
            customerId: customerId,
            amount: totalAmount,
            status: faker.helpers.arrayElement(["PENDING", "COMPLETED", "CANCELLED", "REFUNDED"]),
            items: items,
        };

        return orderData;

    } catch (error) {
        console.error(`[ORDER GENERATOR] Error fetching customer data: ${error.message}`);
        return null;
    }
};

const postRandomOrder = async () => {
    const orderData = await generateRandomOrder();

    if (!orderData) {
        return;
    }

    try {
        // console.log(`[ORDER GENERATOR] Posting new order for customer: ${orderData.customerId}`);
        const response = await axios.post('http://localhost:3000/orders', orderData);
        console.log(`[ORDER GENERATOR] Response message:`, response.data.message);
    } catch (error) {
        if (error.response && error.response.data) {
            console.error(`[ORDER GENERATOR] Error posting order: ${error.response.data.message}`);
        } else {
            console.error(`[ORDER GENERATOR] Error posting order: ${error.message}`);
        }
    }
};

let generatorIntervalId;

const startOrderGenerator = () => {
    console.log(`[ORDER GENERATOR] Starting order generation service...`);
    generatorIntervalId = setInterval(postRandomOrder, GENERATION_INTERVAL_MS);
};

const stopOrderGenerator = () => {
    console.log(`[ORDER GENERATOR] Stopping order generation service.`);
    clearInterval(generatorIntervalId);
};

module.exports = {
    startOrderGenerator,
    stopOrderGenerator
};
