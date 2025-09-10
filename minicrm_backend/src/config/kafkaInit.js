const { Kafka } = require('kafkajs');

const kafka = new Kafka({
    clientId: 'topic-manager',
    brokers: ['localhost:9092'],
});

const admin = kafka.admin();

exports.createTopics = async () => {
    await admin.connect();

    await admin.createTopics({
        topics: [
            {
                topic: 'customer-topic',
                numPartitions: 1,
                replicationFactor: 1,
            },
            {
                topic: 'order-topic',
                numPartitions: 1,
                replicationFactor: 1,
            },
        ],
    });

    console.log('✅ Topics ensured');
    await admin.disconnect();
}

