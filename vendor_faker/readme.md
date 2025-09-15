# Vendor Faker Microservice (`vendor_faker`)

## Overview

The **Vendor Faker** microservice simulates an external delivery/vendor system. It receives batches of campaign customers from the backend, emulates real-world delivery outcomes, and reports back to the backend for processing.

---

## Workflow

1. **Receive Customer Batch**
   - Accepts a bulk of campaign customers via POST request from the backend.

2. **Delivery Simulation**
   - Uses a **randomizer** to determine delivery outcome:
     - `Sent` (successful delivery)
     - `Fail` (10% chance of failure)
   - Logs the outcome using `console.log`.

3. **Receipt Reporting**
   - Sends a POST request to the backend's **Receipt Endpoint** (`/receipts`) for each delivery outcome.
   - The backend then updates `communication_log` and campaign status accordingly.

---

## Notes

- The service is **stateless** and purely for simulation/testing purposes.
- Ensures realistic testing of **asynchronous batch processing** and campaign delivery workflows.
