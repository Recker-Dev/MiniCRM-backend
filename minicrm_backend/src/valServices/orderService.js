const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const validStatuses = ["PENDING", "COMPLETED", "CANCELLED", "REFUNDED"];

async function createOrderEntryValidation(orderData) {
    const { id, customerId, amount, status, items } = orderData;

    if (!id || typeof id !== "string") {
        return "No OrderId given"
    }

    // Validate id
    const existingOrder = await prisma.order.findFirst({
        where: { id: id },
    });
    if (existingOrder) {
        return "OrderId exist";
    }

    // Validate customer
    if (!customerId || typeof customerId !== "string") {
        return "Invalid customerId";
    }
    const existingCustomer = await prisma.customer.findFirst({
        where: { id: customerId },
    });
    if (!existingCustomer) {
        return "Customer does not exist";
    }

    // Validate amount
    if (typeof amount !== "number" || isNaN(amount) || amount < 0) {
        return "Invalid amount. Must be a non-negative number";
    }

    // Validate status
    if (!status || !validStatuses.includes(status)) {
        return `Invalid status. Must be one of: ${validStatuses.join(", ")}`;
    }

    // Validate items
    if (!Array.isArray(items) || items.length === 0) {
        return "Items must be a non-empty array";
    }

    for (const [index, item] of items.entries()) {
        const { name, quantity, unitPrice, total } = item;

        if (!name || typeof name !== "string" || name.trim().length < 1) {
            return `Item ${index + 1}: invalid name`;
        }
        if (
            typeof quantity !== "number" ||
            !Number.isInteger(quantity) ||
            quantity <= 0
        ) {
            return `Item ${index + 1}: quantity must be a positive integer`;
        }
        if (typeof unitPrice !== "number" || unitPrice < 0) {
            return `Item ${index + 1}: unitPrice must be a non-negative number`;
        }
        if (typeof total !== "number" || total !== quantity * unitPrice) {
            return `Item ${index + 1}: total must equal quantity * unitPrice`;
        }
    }

    return "Validation passed";
}

module.exports = {
    createOrderEntryValidation
};
