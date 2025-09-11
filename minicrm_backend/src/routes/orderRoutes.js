import express from "express";
const router = express.Router();
import { createOrder, getOrders } from "../controllers/orderController.js";

router.post("/", createOrder);
router.get("/", getOrders);

export default router;
