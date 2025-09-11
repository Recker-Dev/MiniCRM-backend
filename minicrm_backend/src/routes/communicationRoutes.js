import express from "express";
import { getCommunicationLog } from "../controllers/communicationLogController.js"

const router = express.Router();

// router.post("/", communication.postCommunicationLog);
router.get("/", getCommunicationLog);

export default router;
