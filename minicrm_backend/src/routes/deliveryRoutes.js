import express from "express";
import { receiptApi } from "../controllers/deliveryReceiptController.js";
const router = express.Router();


router.post("/", receiptApi);

export default router;
