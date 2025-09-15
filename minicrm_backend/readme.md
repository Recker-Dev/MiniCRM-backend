# Core Backend Microservice (`minicrm_backend`)

## Overview

The **Core Backend** serves as the central hub for the MiniCRM system. It provides all the REST API endpoints required by the **Frontend** and other microservices, and is the **only service that communicates with Kafka**.  

Its main responsibilities include:

- Exposing REST endpoints for CRUD operations on **Customer**, **Campaign**, **Communication_Log**, and **User** tables.
- Parsing campaign rules, managing campaign execution, and interacting with Kafka for asynchronous processing.
- Coordinating AI services for segment interpretation and campaign summarization.
- Performing **bulk database updates** wherever possible to optimize performance.

---

## REST API Endpoints

The backend exposes endpoints to allow the following actions:

## REST API Endpoints

- **Customer Endpoints**:
  - `POST /customers` → Validate and update customers
  - `POST /customers/get` → Get old customers

- **Order Endpoints**:
  - `POST /orders` → Validate and update orders
  - `GET /orders` → Get old orders

- **Campaign Endpoints**:
  - `POST /campaigns` → Create and trigger campaigns
  - `POST /campaigns/get` → Preview campaigns / Retrieve campaign details and overall metrics

- **Communication_Log Endpoints**:
  - `GET /logs` → Get campaign communication outcomes 

- **Receipt Endpoint**:
  - `POST /receipts` → Process vendor delivery receipts asynchronously via Kafka

- **AI Endpoints**:
  - `POST /ai/campaign` → Generate personalized message suggestions
  - `POST /ai/dynamic` → Generate AI-assisted dynamic rule builder

- **Auth Endpoints**:
  - `POST /auth` → Authenticate user via UUID / OAuth
  - `GET /auth` → Fetch authenticated user info

---

## Campaign Trigger Workflow

1. **Campaign Request**
   - The frontend sends a **ruleGroup JSON body**.
   - Backend parses the JSON into a **valid Prisma `where` clause**.
   - AI interprets the **segment intent** and applies rules to select eligible customers.

2. **Kafka Integration**
   - Shortlisted customers are published to a **Kafka topic**.
   - A valid campaign record is created in the database.
   - HTTP request returns immediately with a **ticket/ID** for campaign tracking.

3. **Customer Delivery via Kafka**
   - A Kafka consumer takes **batches of campaign customers**.
   - Sends POST requests to the **External Vendor API** (final microservice).
   - Vendor attempts delivery with a **10% chance of failure**.
   - Vendor reports back to the **Receipt Backend Endpoint**.

4. **Receipt Handling**
   - Receipt endpoint quickly publishes the incoming vendor responses to Kafka.
   - **Receipt consumer** slowly processes each entry:
     - Updates `communication_log`
     - Updates customer delivery status (`sent` / `fail`) in the `campaign` table.
     - If it’s the **last entry** of the campaign:
       - Triggers AI services to summarize the campaign.
       - Updates the campaign summary in the database.

---

## Asynchronous & Batch Processing

- All campaign and communication processing occurs **asynchronously** wherever possible.
- **Bulk database updates** are used for:
  - Customer batches
  - Campaign customer updates
  - Communication logs
- This ensures high throughput and efficiency even under large volumes of campaign deliveries.

---

## Notes

- The backend serves as the **single source of truth** for the MiniCRM system.
- AI services are integrated for:
  - Interpreting campaign segment intents
  - Generating campaign summaries
  - Converting complex audience segments into human-readable formats
- Kafka is central to **decoupling services** and enabling asynchronous, fault-tolerant workflows.

---
