const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

// Import Kafka consumer
const { runConsumer } = require('./kafka-consumer');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false // Disable SSL for local Docker environment
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Get all products
app.get('/api/products', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Get all transactions
app.get('/api/transactions', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM transactions ORDER BY timestamp DESC LIMIT 100');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// Get all inventory batches
app.get('/api/batches', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM inventory_batches ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching batches:', error);
    res.status(500).json({ error: 'Failed to fetch batches' });
  }
});

// Process inventory event (purchase or sale) - This is now handled by Kafka consumer
app.post('/api/inventory', async (req, res) => {
  const { product_id, event_type, quantity, unit_price, timestamp } = req.body;
  
  try {
    if (event_type === 'purchase') {
      // Create new inventory batch
      const batchId = `B${Date.now()}`;
      await pool.query(
        'INSERT INTO inventory_batches (batch_id, product_id, quantity, unit_price, remaining_quantity) VALUES ($1, $2, $3, $4, $5)',
        [batchId, product_id, quantity, unit_price, quantity]
      );

      // Add transaction
      await pool.query(
        'INSERT INTO transactions (transaction_id, product_id, event_type, quantity, unit_price, total_cost, timestamp) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [`T${Date.now()}`, product_id, event_type, quantity, unit_price, quantity * unit_price, timestamp || new Date().toISOString()]
      );

      res.json({ success: true, message: 'Purchase processed successfully' });
    } else if (event_type === 'sale') {
      // Create sale record first
      const saleId = `S${Date.now()}`;
      await pool.query(
        'INSERT INTO sales (sale_id, product_id, quantity, total_cost, sale_date) VALUES ($1, $2, $3, $4, $5)',
        [saleId, product_id, quantity, 0, timestamp || new Date().toISOString()]
      );

      // Use FIFO logic to process sale
      const result = await pool.query(
        'SELECT process_sale_fifo($1, $2, $3) as total_cost',
        [product_id, quantity, saleId]
      );

      const totalCost = result.rows[0].total_cost;

      // Update sale with actual total cost
      await pool.query(
        'UPDATE sales SET total_cost = $1 WHERE sale_id = $2',
        [totalCost, saleId]
      );

      // Add transaction
      await pool.query(
        'INSERT INTO transactions (transaction_id, product_id, event_type, quantity, total_cost, timestamp) VALUES ($1, $2, $3, $4, $5, $6)',
        [`T${Date.now()}`, product_id, event_type, quantity, totalCost, timestamp || new Date().toISOString()]
      );

      res.json({ success: true, message: 'Sale processed successfully', total_cost: totalCost });
    } else {
      res.status(400).json({ error: 'Invalid event type' });
    }
  } catch (error) {
    console.error('Error processing inventory event:', error);
    res.status(500).json({ error: 'Failed to process inventory event' });
  }
});

// Get current inventory state
app.get('/api/inventory', async (req, res) => {
  try {
    const [products, transactions, batches] = await Promise.all([
      pool.query('SELECT * FROM products ORDER BY created_at DESC'),
      pool.query('SELECT * FROM transactions ORDER BY timestamp DESC LIMIT 50'),
      pool.query('SELECT * FROM inventory_batches ORDER BY created_at DESC')
    ]);

    res.json({
      products: products.rows,
      transactions: transactions.rows,
      batches: batches.rows
    });
  } catch (error) {
    console.error('Error fetching inventory state:', error);
    res.status(500).json({ error: 'Failed to fetch inventory state' });
  }
});

// Start server and Kafka consumer
const startServer = async () => {
  try {
    // Start the Express server
    app.listen(PORT, () => {
      console.log(`🚀 Backend server running on port ${PORT}`);
    });

    // Start the Kafka consumer
    await runConsumer();
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer(); 