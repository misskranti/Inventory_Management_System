-- PostgreSQL Database Schema for Inventory Management System
-- This script initializes the database schema (database is already created by Docker)

-- Products table
CREATE TABLE products (
    product_id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255),
    description TEXT,
    current_quantity INTEGER DEFAULT 0,
    total_cost DECIMAL(15,2) DEFAULT 0,
    average_cost DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inventory batches table (for FIFO tracking)
CREATE TABLE inventory_batches (
    id SERIAL PRIMARY KEY,
    batch_id VARCHAR(50) UNIQUE NOT NULL,
    product_id VARCHAR(50) REFERENCES products(product_id),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    remaining_quantity INTEGER NOT NULL,
    purchase_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sales table
CREATE TABLE sales (
    id SERIAL PRIMARY KEY,
    sale_id VARCHAR(50) UNIQUE NOT NULL,
    product_id VARCHAR(50) REFERENCES products(product_id),
    quantity INTEGER NOT NULL,
    total_cost DECIMAL(15,2) NOT NULL,
    sale_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sale batch details (tracks which batches were consumed for each sale)
CREATE TABLE sale_batch_details (
    id SERIAL PRIMARY KEY,
    sale_id VARCHAR(50) REFERENCES sales(sale_id),
    batch_id VARCHAR(50) REFERENCES inventory_batches(batch_id),
    quantity_consumed INTEGER NOT NULL,
    unit_cost DECIMAL(10,2) NOT NULL,
    total_cost DECIMAL(15,2) NOT NULL
);

-- Transactions table (audit trail)
CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    transaction_id VARCHAR(50) UNIQUE NOT NULL,
    product_id VARCHAR(50) REFERENCES products(product_id),
    event_type VARCHAR(20) NOT NULL CHECK (event_type IN ('purchase', 'sale')),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2), -- NULL for sales (calculated via FIFO)
    total_cost DECIMAL(15,2) NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    kafka_offset BIGINT, -- For Kafka message tracking
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_inventory_batches_product_id ON inventory_batches(product_id);
CREATE INDEX idx_inventory_batches_purchase_date ON inventory_batches(purchase_date);
CREATE INDEX idx_sales_product_id ON sales(product_id);
CREATE INDEX idx_sales_sale_date ON sales(sale_date);
CREATE INDEX idx_transactions_product_id ON transactions(product_id);
CREATE INDEX idx_transactions_timestamp ON transactions(timestamp);
CREATE INDEX idx_transactions_event_type ON transactions(event_type);

-- Function to update product totals after inventory changes
CREATE OR REPLACE FUNCTION update_product_totals()
RETURNS TRIGGER AS $$
BEGIN
    -- Update product current_quantity and costs
    UPDATE products 
    SET 
        current_quantity = (
            SELECT COALESCE(SUM(remaining_quantity), 0) 
            FROM inventory_batches 
            WHERE product_id = NEW.product_id
        ),
        total_cost = (
            SELECT COALESCE(SUM(remaining_quantity * unit_price), 0) 
            FROM inventory_batches 
            WHERE product_id = NEW.product_id
        ),
        updated_at = CURRENT_TIMESTAMP
    WHERE product_id = NEW.product_id;
    
    -- Update average cost
    UPDATE products 
    SET average_cost = CASE 
        WHEN current_quantity > 0 THEN total_cost / current_quantity 
        ELSE 0 
    END
    WHERE product_id = NEW.product_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update product totals
CREATE TRIGGER trigger_update_product_totals
    AFTER INSERT OR UPDATE ON inventory_batches
    FOR EACH ROW
    EXECUTE FUNCTION update_product_totals();

-- Function for FIFO cost calculation
CREATE OR REPLACE FUNCTION calculate_fifo_cost(
    p_product_id VARCHAR(50),
    p_sale_quantity INTEGER
) RETURNS DECIMAL(15,2) AS $$
DECLARE
    batch_record RECORD;
    remaining_to_sell INTEGER := p_sale_quantity;
    total_cost DECIMAL(15,2) := 0;
    quantity_from_batch INTEGER;
BEGIN
    -- Loop through batches in FIFO order (oldest first)
    FOR batch_record IN 
        SELECT batch_id, remaining_quantity, unit_price
        FROM inventory_batches 
        WHERE product_id = p_product_id 
        AND remaining_quantity > 0
        ORDER BY purchase_date ASC
    LOOP
        EXIT WHEN remaining_to_sell <= 0;
        
        quantity_from_batch := LEAST(remaining_to_sell, batch_record.remaining_quantity);
        total_cost := total_cost + (quantity_from_batch * batch_record.unit_price);
        remaining_to_sell := remaining_to_sell - quantity_from_batch;
    END LOOP;
    
    RETURN total_cost;
END;
$$ LANGUAGE plpgsql;

-- Function to process sale with FIFO logic
CREATE OR REPLACE FUNCTION process_sale_fifo(
    p_product_id VARCHAR(50),
    p_sale_quantity INTEGER,
    p_sale_id VARCHAR(50)
) RETURNS DECIMAL(15,2) AS $$
DECLARE
    batch_record RECORD;
    remaining_to_sell INTEGER := p_sale_quantity;
    total_cost DECIMAL(15,2) := 0;
    quantity_from_batch INTEGER;
BEGIN
    -- Loop through batches in FIFO order and consume them
    FOR batch_record IN 
        SELECT batch_id, remaining_quantity, unit_price
        FROM inventory_batches 
        WHERE product_id = p_product_id 
        AND remaining_quantity > 0
        ORDER BY purchase_date ASC
        FOR UPDATE
    LOOP
        EXIT WHEN remaining_to_sell <= 0;
        
        quantity_from_batch := LEAST(remaining_to_sell, batch_record.remaining_quantity);
        
        -- Update batch remaining quantity
        UPDATE inventory_batches 
        SET remaining_quantity = remaining_quantity - quantity_from_batch
        WHERE batch_id = batch_record.batch_id;
        
        -- Record sale batch detail
        INSERT INTO sale_batch_details (sale_id, batch_id, quantity_consumed, unit_cost, total_cost)
        VALUES (p_sale_id, batch_record.batch_id, quantity_from_batch, 
                batch_record.unit_price, quantity_from_batch * batch_record.unit_price);
        
        total_cost := total_cost + (quantity_from_batch * batch_record.unit_price);
        remaining_to_sell := remaining_to_sell - quantity_from_batch;
    END LOOP;
    
    RETURN total_cost;
END;
$$ LANGUAGE plpgsql; 