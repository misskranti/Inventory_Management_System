const { Kafka } = require('kafkajs');

// Kafka configuration
const kafka = new Kafka({
  clientId: 'test-producer',
  brokers: ['kafka:29092']
});

const producer = kafka.producer();

// Test events
const testEvents = [
  {
    product_id: "PRD001",
    event_type: "purchase",
    quantity: 50,
    unit_price: 100.0,
    timestamp: new Date().toISOString(),
  },
  {
    product_id: "PRD001",
    event_type: "sale",
    quantity: 20,
    timestamp: new Date().toISOString(),
  },
  {
    product_id: "PRD002",
    event_type: "purchase",
    quantity: 30,
    unit_price: 150.0,
    timestamp: new Date().toISOString(),
  }
];

async function sendTestEvents() {
  try {
    console.log("🚀 Starting Kafka Test Producer...");
    
    await producer.connect();
    console.log("✅ Connected to Kafka");

    for (let i = 0; i < testEvents.length; i++) {
      const event = testEvents[i];
      
      console.log(`📤 Sending Test Event ${i + 1}:`);
      console.log(JSON.stringify(event, null, 2));

      await producer.send({
        topic: 'inventory-events',
        messages: [{ 
          value: JSON.stringify(event),
          timestamp: Date.now()
        }]
      });

      console.log("✅ Test event sent successfully");
      console.log("");

      // Wait 1 second between events
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log("🎉 All test events sent successfully!");
    
  } catch (error) {
    console.error("❌ Error sending test events:", error);
  } finally {
    await producer.disconnect();
    console.log("🔌 Disconnected from Kafka");
  }
}

sendTestEvents().catch(console.error); 