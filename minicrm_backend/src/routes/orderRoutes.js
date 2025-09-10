const express = require("express");
const router = express.Router();
const customerController = require("../controllers/orderController");

router.post("/", customerController.createOrder);
router.get("/", customerController.getOrders);

module.exports = router;
