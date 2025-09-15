# MiniCRM Prototype

## Overview

This repository contains the **technical prototype** of a lightweight CRM system built on a microservices architecture. It demonstrates **data ingestion**, **audience segmentation**, **campaign execution**, **Kafka-based asynchronous processing**, and **AI-assisted features**.  

The system is composed of the following services:

- **Data Ingestion Faker** → Generates artificial `Customer` and `Order` data.
- **MiniCRM Backend** → Core backend handling REST APIs, campaigns, and Kafka producers/consumers.
- **Vendor Faker** → Simulates external delivery vendors with randomized outcomes.
- **Frontend** → User interface for campaign management, segmentation, and history tracking.

---

## Setup Instructions

To run the system, **4 terminals** are required.

### 1. Data Ingestion Faker
```bash
cd data_injestion_faker
npm install
node index.js
```
- Comment/uncomment the appropriate start functions in index.js to switch between:

  - Customer Generator

  - Order Generator

### 2. Vendor Backend
```bash
cd vendor_faker
npm install
node index.js
```
- Runs on port 3500.

- Simulates vendor delivery attempts and reports results back to the backend via receipts.

### 3. MiniCRM Backend
Two terminals are needed:
#### Terminal A – Start HTTP Server & Kafka Producer
```bash
cd minicrm_backend
npm install
node index.js
```
- Runs on port 3000.

#### Terminal B – Start Kafka Consumers
```bash
node consumer.js
```
- Handles background processing for campaign deliveries and receipts.


## Kafka

Kafka is the backbone of this system, enabling asynchronous communication between microservices. The topics are initialized in `config/kafkaInit.js`.

### Defined Topics
- **`customer-topic`**  
  Carries validated customer data from the **Data Ingestion Faker** before bulk insertion into the database.

- **`order-topic`**  
  Carries validated order data from the **Data Ingestion Faker** before bulk insertion into the database.

- **`campaign-deliveries`**  
  Holds campaign-triggered customer batches that are queued for delivery via the **Vendor Faker**.

- **`deliveries-receipt`**  
  Receives vendor delivery outcomes (`success` / `fail`) which are then processed into the **Communication Log** and campaign status updates.

---

## Database and  Schema

The system uses **PostgreSQL** as the primary database. Prisma ORM is used for schema management and queries.  
The schema models represent the CRM domain: customers, orders, campaigns, communications, and users.

---

### Customer
Represents an individual customer in the CRM.

```prisma
model Customer {
  id                String              @id @default(uuid())
  name              String
  email             String              @unique
  phone             String?             @unique
  city              String?
  total_spend       Float               @default(0)
  visit             Int                 @default(0)
  last_order_date   DateTime?
  createdAt         DateTime            @default(now())
  orders            Order[]
  communication_log Communication_log[]
}
```

### Order
Represents a customer order.

```prisma
model Order {
  id         String      @id @default(uuid())
  customer   Customer    @relation(fields: [customerId], references: [id], onDelete: Cascade)
  customerId String
  order_date DateTime    @default(now())
  amount     Float
  status     OrderStatus @default(PENDING)
  items      OrderItem[]
}
```

### Campaign
Represents a marketing campaign targeting specific customer segments.

```prisma
model Campaign {
  id                String              @id @default(uuid())
  name              String
  userId            String
  intent            String
  segment           Json
  summary           String?
  audience_size     Int
  message           String
  status            CampaignStatus      @default(RUNNING)
  pending_count     Int                 @default(0)
  sent_count        Int                 @default(0)
  failed_count      Int                 @default(0)
  createdAt         DateTime            @default(now())
  communication_log Communication_log[]
}
```
### Campaign
Tracks message delivery status for each customer in a campaign.

```prisma
model Communication_log {
  id         String   @id @default(uuid())
  campaign   Campaign @relation(fields: [campaignId], references: [id], onDelete: Cascade)
  campaignId String
  customer   Customer @relation(fields: [customerId], references: [id], onDelete: Cascade)
  customerId String

  customer_name    String
  email            String
  phone            String?
  personalized_msg String

  status DeliveryStatus @default(PENDING)

  delivered_at DateTime?
  createdAt    DateTime  @default(now())
}
```
### User
Represents a CRM user authenticated via Google OAuth.

```prisma
model User {
  id        String   @id @default(dbgenerated("concat('user_', replace(cast(gen_random_uuid() as text), '-', ''))"))
  googleId  String?  @unique
  email     String?  @unique
  name      String?
  avatar    String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

```

## Notes

- **Kafka & Zookeeper** must be running locally before starting any services.  
- **PostgreSQL** must be installed and properly configured as the primary database.  
- All inter-service communication related to **customers**, **orders**, and **campaign execution** happens through Kafka topics.  
- Consumers are designed for **batch processing** and **asynchronous updates**, ensuring high throughput.  
- Use `consumer.js` in the backend to listen and process messages from the above topics.  
