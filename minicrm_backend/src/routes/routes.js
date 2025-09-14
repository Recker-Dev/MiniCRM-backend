import express from "express";
const router = express.Router();
import { createOrder, getOrders } from "../controllers/orderController.js";
import { createCustomer, getCustomers } from "../controllers/customerController.js"
import { getCampaign, startCampaign } from "../controllers/campaignController.js";
import { getCommunicationLog } from "../controllers/communicationLogController.js"
import { receiptApi } from "../controllers/deliveryReceiptController.js";
import { createPersonalizedMessages, createDynamicRules } from "../controllers/aiController.js";
import { authUser, getAuthedUser } from '../controllers/authController.js';


//  Order Routes
router.post("/orders", createOrder);
router.get("/orders", getOrders);

//  Customer Routes
router.post("/customers", createCustomer);
router.post("/customers/get", getCustomers);

//  Campaign Routes
router.post("/campaigns", startCampaign);
router.post("/campaigns/get", getCampaign);

//  Communication Logs Routes
router.get("/logs", getCommunicationLog);

//  Receipt Routes
router.post("/receipts", receiptApi);

//  AI Routes
router.post("/ai/campaign", createPersonalizedMessages);
router.post("/ai/dynamic", createDynamicRules);

// Auth Routes
router.post("/auth", authUser);
router.get("/auth", getAuthedUser);

export default router;
