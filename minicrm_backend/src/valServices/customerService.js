// services/customerValidationService.js
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Regex Validators
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
// 10-digit number without a country code
const isValidPhone = (phone) => /^\d{10}$/.test(phone);

async function createCustomerEntryValidationService(customerData) {
    const { name, email, phone } = customerData;

    // Base validation
    if (!name || typeof name !== "string" || name.trim().length < 2) {
        return "Invalid name";
    }

    if (!email || !isValidEmail(email)) {
        return "Invalid email";
    }

    if (phone && !isValidPhone(phone)) {
        return "Invalid phone number";
    }

    // Uniqueness checks
    const existingCustomer = await prisma.customer.findFirst({
        where: {
            OR: [
                { email: email },
                phone ? { phone: phone } : undefined,
            ].filter(Boolean), // .filter removed the undefined
        },
    });

    if (existingCustomer) {
        if (existingCustomer.email === email && existingCustomer.phone === phone) {
            return "Customer with this email and phone already exists";
        } else if (existingCustomer.email === email) {
            return "Email already in use";
        } else if (existingCustomer.phone === phone) {
            return "Phone already in use";
        }
    }

    return "Validation passed";
}

module.exports = {
    createCustomerEntryValidationService,
};
