-- Seed data for Inventory Management System

-- Clear existing data (optional - uncomment if you want to start fresh)
-- DELETE FROM transactions;
-- DELETE FROM inventory_batches;
-- DELETE FROM products;

-- Insert sample products
INSERT INTO products (product_id, name, description, created_at) VALUES
('PRD001', 'Laptop Dell XPS 13', 'High-performance laptop with Intel i7 processor', NOW()),
('PRD002', 'iPhone 15 Pro', 'Latest iPhone with A17 Pro chip', NOW()),
('PRD003', 'Samsung 4K TV 55"', 'Smart TV with HDR support', NOW()),
('PRD004', 'Nike Air Max 270', 'Comfortable running shoes', NOW()),
('PRD005', 'Coffee Maker', 'Automatic coffee machine with timer', NOW()),
('PRD006', 'Wireless Headphones', 'Bluetooth headphones with noise cancellation', NOW()),
('PRD007', 'Gaming Mouse', 'RGB gaming mouse with programmable buttons', NOW()),
('PRD008', 'Yoga Mat', 'Non-slip yoga mat for home workouts', NOW()),
('PRD009', 'Bluetooth Speaker', 'Portable speaker with 20-hour battery', NOW()),
('PRD010', 'Smart Watch', 'Fitness tracking smartwatch', NOW())
ON CONFLICT (product_id) DO NOTHING;

-- Insert sample inventory batches (purchases)
INSERT INTO inventory_batches (batch_id, product_id, quantity, unit_price, remaining_quantity, purchase_date) VALUES
('B001', 'PRD001', 50, 1200.00, 50, NOW() - INTERVAL '30 days'),
('B002', 'PRD002', 100, 950.00, 100, NOW() - INTERVAL '25 days'),
('B003', 'PRD003', 25, 750.00, 25, NOW() - INTERVAL '20 days'),
('B004', 'PRD004', 200, 120.00, 200, NOW() - INTERVAL '15 days'),
('B005', 'PRD005', 75, 85.00, 75, NOW() - INTERVAL '10 days'),
('B006', 'PRD006', 60, 180.00, 60, NOW() - INTERVAL '8 days'),
('B007', 'PRD007', 150, 70.00, 150, NOW() - INTERVAL '5 days'),
('B008', 'PRD008', 300, 25.00, 300, NOW() - INTERVAL '3 days'),
('B009', 'PRD009', 40, 140.00, 40, NOW() - INTERVAL '2 days'),
('B010', 'PRD010', 30, 280.00, 30, NOW() - INTERVAL '1 day')
ON CONFLICT (batch_id) DO NOTHING;

-- Insert sample transactions (mix of purchases and sales)
INSERT INTO transactions (transaction_id, product_id, event_type, quantity, unit_price, total_cost, timestamp) VALUES
-- Purchase transactions (matching the batches above)
('T001', 'PRD001', 'purchase', 50, 1200.00, 60000.00, NOW() - INTERVAL '30 days'),
('T002', 'PRD002', 'purchase', 100, 950.00, 95000.00, NOW() - INTERVAL '25 days'),
('T003', 'PRD003', 'purchase', 25, 750.00, 18750.00, NOW() - INTERVAL '20 days'),
('T004', 'PRD004', 'purchase', 200, 120.00, 24000.00, NOW() - INTERVAL '15 days'),
('T005', 'PRD005', 'purchase', 75, 85.00, 6375.00, NOW() - INTERVAL '10 days'),
('T006', 'PRD006', 'purchase', 60, 180.00, 10800.00, NOW() - INTERVAL '8 days'),
('T007', 'PRD007', 'purchase', 150, 70.00, 10500.00, NOW() - INTERVAL '5 days'),
('T008', 'PRD008', 'purchase', 300, 25.00, 7500.00, NOW() - INTERVAL '3 days'),
('T009', 'PRD009', 'purchase', 40, 140.00, 5600.00, NOW() - INTERVAL '2 days'),
('T010', 'PRD010', 'purchase', 30, 280.00, 8400.00, NOW() - INTERVAL '1 day'),

-- Sale transactions (these will trigger FIFO logic)
('T011', 'PRD001', 'sale', 10, NULL, 12999.90, NOW() - INTERVAL '28 days'),
('T012', 'PRD002', 'sale', 15, NULL, 14999.85, NOW() - INTERVAL '24 days'),
('T013', 'PRD003', 'sale', 5, NULL, 3999.95, NOW() - INTERVAL '18 days'),
('T014', 'PRD004', 'sale', 25, NULL, 3249.75, NOW() - INTERVAL '12 days'),
('T015', 'PRD005', 'sale', 10, NULL, 899.90, NOW() - INTERVAL '7 days'),
('T016', 'PRD006', 'sale', 8, NULL, 1599.92, NOW() - INTERVAL '5 days'),
('T017', 'PRD007', 'sale', 20, NULL, 1599.80, NOW() - INTERVAL '3 days'),
('T018', 'PRD008', 'sale', 50, NULL, 1499.50, NOW() - INTERVAL '2 days'),
('T019', 'PRD009', 'sale', 5, NULL, 749.95, NOW() - INTERVAL '1 day'),
('T020', 'PRD010', 'sale', 3, NULL, 899.97, NOW() - INTERVAL '12 hours')
ON CONFLICT (transaction_id) DO NOTHING;

-- Update remaining quantities in batches after sales
UPDATE inventory_batches SET remaining_quantity = 40 WHERE batch_id = 'B001'; -- PRD001: 50 - 10 = 40
UPDATE inventory_batches SET remaining_quantity = 85 WHERE batch_id = 'B002'; -- PRD002: 100 - 15 = 85
UPDATE inventory_batches SET remaining_quantity = 20 WHERE batch_id = 'B003'; -- PRD003: 25 - 5 = 20
UPDATE inventory_batches SET remaining_quantity = 175 WHERE batch_id = 'B004'; -- PRD004: 200 - 25 = 175
UPDATE inventory_batches SET remaining_quantity = 65 WHERE batch_id = 'B005'; -- PRD005: 75 - 10 = 65
UPDATE inventory_batches SET remaining_quantity = 52 WHERE batch_id = 'B006'; -- PRD006: 60 - 8 = 52
UPDATE inventory_batches SET remaining_quantity = 130 WHERE batch_id = 'B007'; -- PRD007: 150 - 20 = 130
UPDATE inventory_batches SET remaining_quantity = 250 WHERE batch_id = 'B008'; -- PRD008: 300 - 50 = 250
UPDATE inventory_batches SET remaining_quantity = 35 WHERE batch_id = 'B009'; -- PRD009: 40 - 5 = 35
UPDATE inventory_batches SET remaining_quantity = 27 WHERE batch_id = 'B010'; -- PRD010: 30 - 3 = 27

-- Display summary
SELECT 'Data seeding completed successfully!' as status;
SELECT COUNT(*) as total_products FROM products;
SELECT COUNT(*) as total_batches FROM inventory_batches;
SELECT COUNT(*) as total_transactions FROM transactions;
