import { Kafka } from "kafkajs";

const kafka = new Kafka({
    clientId: 'producer',
    brokers: ['localhost:9092']
})


const producer = kafka.producer();


export const connectProducer = async () => {
    try {
        await producer.connect();
        console.log('✅  Kafka producer connected successfully.');
    } catch (error) {
        console.error('Error connecting to Kafka producer:', error);
    }
};


export const disconnectProducer = async () => {
    try {
        await producer.disconnect();
        console.log('Kafka producer disconnected.');
    } catch (error) {
        console.error('Error disconnecting from Kafka producer:', error);
    }
};


export const sendMessage = async (topic, data) => {
    try {
        await producer.send({
            topic: topic,
            messages: [
                { value: JSON.stringify(data) },
            ],
        });
        // console.log(`Message sent to topic "${topic}":`, data);
    } catch (error) {
        console.error(`Error sending message to topic "${topic}":`, error);
    }
};



