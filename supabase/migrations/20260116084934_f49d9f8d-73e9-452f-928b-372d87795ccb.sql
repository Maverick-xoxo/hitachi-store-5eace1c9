-- Add CHECK constraints for price, stock, quantity, and total_amount validation

-- Products table constraints
ALTER TABLE products ADD CONSTRAINT products_price_positive CHECK (price >= 0);
ALTER TABLE products ADD CONSTRAINT products_stock_positive CHECK (stock >= 0);
ALTER TABLE products ADD CONSTRAINT products_name_length CHECK (char_length(name) <= 200);
ALTER TABLE products ADD CONSTRAINT products_description_length CHECK (char_length(description) <= 2000);

-- Order items table constraints
ALTER TABLE order_items ADD CONSTRAINT order_items_quantity_positive CHECK (quantity > 0);
ALTER TABLE order_items ADD CONSTRAINT order_items_unit_price_positive CHECK (unit_price >= 0);

-- Orders table constraints
ALTER TABLE orders ADD CONSTRAINT orders_total_amount_positive CHECK (total_amount >= 0);