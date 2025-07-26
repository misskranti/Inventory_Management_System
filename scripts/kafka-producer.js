const { Kafka } = require('kafkajs');

// Kafka configuration - Use correct Docker port
const kafka = new Kafka({
  clientId: 'inventory-producer',
  brokers: ['kafka:29092'] // Use Docker internal port
});

const producer = kafka.producer();

// Sample inventory events
const events = [
  {
    product_id: "PRD001",
    event_type: "purchase",
    quantity: 100,
    unit_price: 95.0,
    timestamp: new Date().toISOString(),
  },
  {
    product_id: "PRD001",
    event_type: "sale",
    quantity: 30,
    timestamp: new Date().toISOString(),
  },
  {
    product_id: "PRD002",
    event_type: "purchase",
    quantity: 50,
    unit_price: 130.0,
    timestamp: new Date().toISOString(),
  },
  {
    product_id: "PRD002",
    event_type: "sale",
    quantity: 20,
    timestamp: new Date().toISOString(),
  },
  {
    product_id: "PRD003",
    event_type: "purchase",
    quantity: 75,
    unit_price: 45.0,
    timestamp: new Date().toISOString(),
  },
  {
    product_id: "PRD001",
    event_type: "purchase",
    quantity: 80,
    unit_price: 105.0,
    timestamp: new Date().toISOString(),
  },
  {
    product_id: "PRD001",
    event_type: "sale",
    quantity: 50,
    timestamp: new Date().toISOString(),
  },
  {
    product_id: "PRD003",
    event_type: "sale",
    quantity: 25,
    timestamp: new Date().toISOString(),
  },
];

// Send events to Kafka topic 'inventory-events'
async function sendKafkaEvents() {
  try {
    console.log("🚀 Starting Kafka Producer...");
    console.log("📡 Connecting to Kafka brokers...");
    
    await producer.connect();
    console.log("✅ Connected to Kafka");
    console.log("📤 Topic: inventory-events");
    console.log("");

    for (let i = 0; i < events.length; i++) {
      const event = events[i];

      console.log(`📤 Sending Event ${i + 1}:`);
      console.log(JSON.stringify(event, null, 2));

      // Send event to Kafka topic
      await producer.send({
        topic: 'inventory-events',
        messages: [{ 
          value: JSON.stringify(event),
          timestamp: Date.now()
        }]
      });

      console.log("✅ Event sent to Kafka successfully");
      console.log("");

      // Wait 2 seconds between events
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    console.log("🎉 All events sent to Kafka successfully!");
    
  } catch (error) {
    console.error("❌ Error sending events to Kafka:", error);
  } finally {
    await producer.disconnect();
    console.log("🔌 Disconnected from Kafka");
  }
}

// Generate random inventory events
function generateRandomEvent() {
  const productIds = ["PRD001", "PRD002", "PRD003", "PRD004", "PRD005"];
  const eventTypes = ["purchase", "sale"];
  const randomProductId = productIds[Math.floor(Math.random() * productIds.length)];
  const randomEventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
  const randomQuantity = Math.floor(Math.random() * 50) + 10;
  const randomPrice = Math.floor(Math.random() * 100) + 50;

  const event = {
    product_id: randomProductId,
    event_type: randomEventType,
    quantity: randomQuantity,
    timestamp: new Date().toISOString(),
  };

  // Add unit_price only for purchase events
  if (randomEventType === "purchase") {
    event.unit_price = randomPrice;
  }

  return event;
}

// Send random events continuously
async function sendRandomEvents(intervalMs = 3000) {
  try {
    console.log("🚀 Starting Random Kafka Producer...");
    console.log(`📡 Sending random events every ${intervalMs/1000} seconds`);
    
    await producer.connect();
    console.log("✅ Connected to Kafka");

    let eventCount = 0;
    
    const interval = setInterval(async () => {
      try {
        const event = generateRandomEvent();
        eventCount++;

        console.log(`📤 Sending Random Event ${eventCount}:`);
        console.log(JSON.stringify(event, null, 2));

        await producer.send({
          topic: 'inventory-events',
          messages: [{ 
            value: JSON.stringify(event),
            timestamp: Date.now()
          }]
        });

        console.log("✅ Random event sent to Kafka successfully");
        console.log("");

      } catch (error) {
        console.error("❌ Error sending random event:", error);
      }
    }, intervalMs);

    // Stop after 30 seconds (10 events)
    setTimeout(() => {
      clearInterval(interval);
      console.log("🛑 Stopping random event generation");
      producer.disconnect();
    }, 30000);

  } catch (error) {
    console.error("❌ Error in random event generator:", error);
  }
}

// Run the simulation
if (process.argv.includes('--random')) {
  sendRandomEvents().catch(console.error);
} else {
  sendKafkaEvents().catch(console.error);
}

// Export for use in other modules
module.exports = { sendKafkaEvents, sendRandomEvents, generateRandomEvent, events };
