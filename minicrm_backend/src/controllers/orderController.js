import { PrismaClient } from "@prisma/client";
import { createOrderEntryValidation } from "../valServices/orderService.js";
import { sendMessage } from "../event/kafkaProducer.js";
const prisma = new PrismaClient();



export async function createOrder(req, res) {
  try {

    // Step 1: Validate customer data
    const validationMessage = await createOrderEntryValidation(req.body);

    // Step 2: If validation fails
    if (validationMessage != "Validation passed") {
      return res.status(400).json({ message: validationMessage });
    }

    // Step 3: Validation passed, send the customer data to Kafka
    const orderData = req.body;
    const topic = 'order-topic';

    // Publish the customer data to Kafka
    await sendMessage(topic, orderData);

    // Step 4: Respond with a task trigger success message
    res.status(202).json({
      message: "Order data submitted. It will be processed shortly."
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}


export async function getOrders(req, res) {
  try {
    const orders = await prisma.order.findMany();
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
