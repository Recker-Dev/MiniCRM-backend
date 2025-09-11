import express from "express";
const router = express.Router();
import { getCampaign, startCampaign } from "../controllers/campaignController.js";

router.post("/", startCampaign);
router.get("/", getCampaign);

export default router;
