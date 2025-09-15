# Data Faker Microservice (`data_injestion_faker`)

## Overview

The **Data Ingestion Faker** microservice is responsible for generating artificial customer and order data to populate the main backend system. It is a separate service from the main project but is crucial for testing, validation, and batch processing workflows.

This service uses **Faker.js** to create random customer and order data, validates them via REST requests to the main backend, and leverages **Kafka** for asynchronous batch processing.

---

## Architecture & Flow

### 1. Customer Generator

1. **Data Generation**: Uses Faker.js to create random customer information:
   - `name`
   - `email`
   - `phone`
   - `city`
   - `number of visits`

2. **Backend Validation**: Sends a REST request to the main backend for validation.
   - Only valid entries are accepted.

3. **Kafka Integration**: 
   - The main backend publishes valid customer entries to a Kafka topic.

4. **Batch Processing**:
   - A Kafka consumer collects entries either when:
     - A **batch size** is reached, or
     - A **time threshold** is crossed.
   - Bulk updates the database with validated customer entries.

---

### 2. Order Generator

1. **Customer Selection**: Requests a subset of customers from the main backend and selects one at random.

2. **Order Creation**: Generates an artificial order for the chosen customer, including:
   - `order_date`
   - `amount`
   - `status` (default: PENDING)
   - `items` (array of `OrderItem` objects with `name`, `quantity`, `unitPrice`, `total`)

3. **Backend Validation**: Sends the order to the main backend for validation.
   - Valid orders are published to Kafka.

4. **Batch Processing**:
   - A Kafka consumer waits for a batch size or time threshold.
   - Bulk updates the database with validated orders.

---


