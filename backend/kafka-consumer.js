const { Kafka } = require('kafkajs');
const { Pool } = require('pg');

// PostgreSQL connection
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'postgres',
  database: process.env.DB_NAME || 'inventory_management',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
  ssl: false
});

// Kafka configuration - Use environment variable or default to correct Docker port
const kafka = new Kafka({
  clientId: 'inventory-consumer',
  brokers: [process.env.KAFKA_BROKER_URL || 'kafka:29092'] // Use Docker internal port
});

const consumer = kafka.consumer({ groupId: 'inventory-group' });

// FIFO Logic Functions
const processPurchaseEvent = async (event) => {
  const { product_id, quantity, unit_price, timestamp } = event;
  
  try {
    // Start transaction
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Create new inventory batch
      const batchResult = await client.query(`
        INSERT INTO inventory_batches (batch_id, product_id, quantity, unit_price, remaining_quantity, purchase_date)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id
      `, [
        `B${Date.now()}`,
        product_id,
        quantity,
        unit_price,
        quantity,
        timestamp || new Date().toISOString()
      ]);
      
      // Insert transaction record
      await client.query(`
        INSERT INTO transactions (transaction_id, product_id, event_type, quantity, unit_price, total_cost, timestamp)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        `T${Date.now()}`,
        product_id,
        'purchase',
        quantity,
        unit_price,
        quantity * unit_price,
        timestamp || new Date().toISOString()
      ]);
      
      // Update or create product
      const productResult = await client.query(`
        SELECT * FROM products WHERE product_id = $1
      `, [product_id]);
      
      if (productResult.rows.length > 0) {
        // Update existing product
        const product = productResult.rows[0];
        const newQuantity = product.current_quantity + quantity;
        const newTotalCost = product.total_cost + (quantity * unit_price);
        
        await client.query(`
          UPDATE products 
          SET current_quantity = $1, total_cost = $2, average_cost = $3, updated_at = NOW()
          WHERE product_id = $4
        `, [newQuantity, newTotalCost, newTotalCost / newQuantity, product_id]);
      } else {
        // Create new product
        await client.query(`
          INSERT INTO products (product_id, name, description, current_quantity, total_cost, average_cost)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [
          product_id,
          `Product ${product_id}`,
          `Description for ${product_id}`,
          quantity,
          quantity * unit_price,
          unit_price
        ]);
      }
      
      await client.query('COMMIT');
      console.log(`✅ Purchase processed: ${product_id} - ${quantity} units @ $${unit_price}`);
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('❌ Error processing purchase event:', error);
    throw error;
  }
};

const processSaleEvent = async (event) => {
  const { product_id, quantity, timestamp } = event;
  
  try {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Get available batches for this product (FIFO order)
      const batchesResult = await client.query(`
        SELECT * FROM inventory_batches 
        WHERE product_id = $1 AND remaining_quantity > 0 
        ORDER BY purchase_date ASC
      `, [product_id]);
      
      if (batchesResult.rows.length === 0) {
        throw new Error(`No inventory available for product ${product_id}`);
      }
      
      let remainingToSell = quantity;
      let totalCost = 0;
      const consumedBatches = [];
      
      // Consume batches in FIFO order
      for (const batch of batchesResult.rows) {
        if (remainingToSell <= 0) break;
        
        const quantityFromBatch = Math.min(remainingToSell, batch.remaining_quantity);
        const costFromBatch = quantityFromBatch * batch.unit_price;
        
        totalCost += costFromBatch;
        remainingToSell -= quantityFromBatch;
        
        // Update batch remaining quantity
        await client.query(`
          UPDATE inventory_batches 
          SET remaining_quantity = remaining_quantity - $1
          WHERE id = $2
        `, [quantityFromBatch, batch.id]);
        
        consumedBatches.push({
          batchId: batch.batch_id,
          quantity: quantityFromBatch,
          unitPrice: batch.unit_price,
          cost: costFromBatch
        });
      }
      
      if (remainingToSell > 0) {
        throw new Error(`Insufficient inventory for product ${product_id}. Requested: ${quantity}, Available: ${quantity - remainingToSell}`);
      }
      
      // Insert sale record
      await client.query(`
        INSERT INTO sales (sale_id, product_id, quantity, total_cost, sale_date)
        VALUES ($1, $2, $3, $4, $5)
      `, [
        `S${Date.now()}`,
        product_id,
        quantity,
        totalCost,
        timestamp || new Date().toISOString()
      ]);
      
      // Insert transaction record
      await client.query(`
        INSERT INTO transactions (transaction_id, product_id, event_type, quantity, unit_price, total_cost, timestamp)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        `T${Date.now()}`,
        product_id,
        'sale',
        quantity,
        null, // unit_price is null for sales (calculated via FIFO)
        totalCost,
        timestamp || new Date().toISOString()
      ]);
      
      // Update product quantities and costs
      const productResult = await client.query(`
        SELECT * FROM products WHERE product_id = $1
      `, [product_id]);
      
      if (productResult.rows.length > 0) {
        const product = productResult.rows[0];
        const newQuantity = product.current_quantity - quantity;
        const newTotalCost = product.total_cost - totalCost;
        
        await client.query(`
          UPDATE products 
          SET current_quantity = $1, total_cost = $2, average_cost = $3, updated_at = NOW()
          WHERE product_id = $4
        `, [
          newQuantity,
          newTotalCost,
          newQuantity > 0 ? newTotalCost / newQuantity : 0,
          product_id
        ]);
      }
      
      await client.query('COMMIT');
      console.log(`✅ Sale processed: ${product_id} - ${quantity} units, Total Cost: $${totalCost.toFixed(2)}`);
      console.log(`📊 Consumed batches:`, consumedBatches);
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('❌ Error processing sale event:', error);
    throw error;
  }
};

// Main consumer function
const runConsumer = async () => {
  try {
    await consumer.connect();
    await consumer.subscribe({ topic: 'inventory-events', fromBeginning: false });
    
    console.log('🚀 Kafka consumer started. Listening for inventory events...');
    
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const event = JSON.parse(message.value.toString());
          console.log(`📨 Received event:`, event);
          
          if (event.event_type === 'purchase') {
            await processPurchaseEvent(event);
          } else if (event.event_type === 'sale') {
            await processSaleEvent(event);
          } else {
            console.warn(`⚠️ Unknown event type: ${event.event_type}`);
          }
          
        } catch (error) {
          console.error('❌ Error processing message:', error);
        }
      },
    });
    
  } catch (error) {
    console.error('❌ Kafka consumer error:', error);
    process.exit(1);
  }
};

// Graceful shutdown
const gracefulShutdown = async () => {
  console.log('🛑 Shutting down Kafka consumer...');
  await consumer.disconnect();
  await pool.end();
  process.exit(0);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

module.exports = { runConsumer }; 