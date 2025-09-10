const axios = require('axios');
const { faker } = require('@faker-js/faker');

const GENERATION_INTERVAL_MS = 1500; // Generate a new customer every 2.5 seconds

const generateRandomCustomer = () => {
    // Generate realistic data using Faker
    const name = faker.person.fullName();
    const email = faker.internet.email({ firstName: name.split(' ')[0], lastName: name.split(' ')[1], provider: 'example.fakerjs.dev' });
    const phone = faker.string.numeric({ length: 10 });
    const city = faker.location.city();
    const visit = faker.number.int({ min: 0, max: 100 });

    return {
        name,
        email,
        phone,
        city,
        visit
    };
};

const postRandomCustomer = async () => {
    const customerData = generateRandomCustomer();
    try {
        const response = await axios.post('http://localhost:3000/customers', customerData);
        console.log(`[CUSTOMER GENERATOR] Response message:`, response.data.message);
    } catch (error) {
        if (error.response && error.response.data) {
            // Log the specific error message from the server
            console.error(`[CUSTOMER GENERATOR] Error posting customer: ${error.response.data.message}`);
        } else {
            // Log a generic error if the server response is not available
            console.error(`[CUSTOMER GENERATOR] Error posting customer: ${error.message}`);
        }
    }
};

let generatorIntervalId;

const startCustomerGenerator = () => {
    console.log(`[CUSTOMER GENERATOR] Starting customer generation service...`);
    generatorIntervalId = setInterval(postRandomCustomer, GENERATION_INTERVAL_MS);
};

const stopCustomerGenerator = () => {
    console.log(`[CUSTOMER GENERATOR] Stopping customer generation service.`);
    clearInterval(generatorIntervalId);
};

module.exports = {
    startCustomerGenerator,
    stopCustomerGenerator,
};
