import axios from "axios";

// Vendor sends delivery receipts back to CRM
async function deliveryApi(results) {
    try {
        const response = await axios.post("http://localhost:3000/receipts", results, {
            headers: { "Content-Type": "application/json" }
        });

        console.log(`📬 Sent ${results.length} delivery receipts back to CRM`);
        // console.log(response.data);
    } catch (error) {
        console.error("[Vendor] Failed to call Delivery Receipt API:", error.message);
    }
}


export async function vendorController(req, res) {
    const deliveries = req.body;
    try {

        if (!Array.isArray(deliveries) || deliveries.length === 0) {
            return res.status(400).json({ error: "Invalid request. Expected an array of delivery objects." });
        }


        // Trigger delivery mechanism
        const results = deliveries.map((d) => {
            const success = Math.random() < 0.9;
            const status = success ? "SENT" : "FAILED";

            if (success) {
                console.log(
                    `✅ [Vendor] Delivered to ${d.customer_name} (${d.email || d.phone}): "${d.personalized_msg}"`
                );
            } else {
                console.log(
                    `❌ [Vendor] FAILED delivery to ${d.customer_name} (${d.email || d.phone})`
                );
            }
            return {
                commId: d.commId,
                campaignId: d.campaignId,
                customerId: d.customerId,
                status
            };
        });


        // Fire-and-forget async task
        setImmediate(async () => {
            try {
                await deliveryApi(results);
            } catch (err) {
                console.error("[Vendor] Async deliveryApi failed:", err);
            }
        });

        // Respond immediately (ack)
        return res.status(202).json({
            message: "Delivery task triggered, receipts will follow shortly",
            count: deliveries.length,
        });

    } catch (err) {
        console.error("[Vendor] Error handling request:", err);
        return res.status(500).json({ error: "Vendor processing error" });
    }
}


