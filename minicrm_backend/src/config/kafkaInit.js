// config/kafkaInit.js
import { Kafka } from 'kafkajs';

const kafka = new Kafka({
  clientId: 'topic-manager',
  brokers: ['localhost:9092'],
});

const admin = kafka.admin();

export const createTopics = async () => {
  await admin.connect();

  await admin.createTopics({
    topics: [
      {topic: 'deliveries-receipt', numPartitions:1, replicationFactor: 1},
      { topic: 'customer-topic', numPartitions: 1, replicationFactor: 1 },
      { topic: 'order-topic', numPartitions: 1, replicationFactor: 1 },
      {topic: 'campaign-deliveries', numPartitions: 1, replicationFactor: 1},
    ],
  });

  console.log('✅ Topics ensured');
  await admin.disconnect();
};
