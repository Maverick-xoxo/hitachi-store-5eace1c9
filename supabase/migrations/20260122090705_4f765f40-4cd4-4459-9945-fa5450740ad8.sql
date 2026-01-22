-- Create function to validate order_items prices match products table
CREATE OR REPLACE FUNCTION public.validate_order_item_price()
RETURNS TRIGGER AS $$
DECLARE
  actual_price DECIMAL(10,2);
BEGIN
  -- Get the actual price from products table
  SELECT price INTO actual_price FROM products WHERE id = NEW.product_id;
  
  -- If product exists and price doesn't match, raise exception
  IF actual_price IS NOT NULL AND NEW.unit_price != actual_price THEN
    RAISE EXCEPTION 'Price mismatch: submitted % vs actual %', NEW.unit_price, actual_price;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to validate item prices before insert
CREATE TRIGGER validate_item_price_before_insert
BEFORE INSERT ON order_items
FOR EACH ROW EXECUTE FUNCTION public.validate_order_item_price();

-- Create function to recalculate and update order total based on order items
CREATE OR REPLACE FUNCTION public.recalculate_order_total()
RETURNS TRIGGER AS $$
DECLARE
  calculated_total DECIMAL(10,2);
BEGIN
  -- Calculate the correct total from order items
  SELECT COALESCE(SUM(quantity * unit_price), 0)
  INTO calculated_total
  FROM order_items WHERE order_id = NEW.order_id;
  
  -- Update the order total to the calculated value (enforce server-side)
  UPDATE orders SET total_amount = calculated_total WHERE id = NEW.order_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to recalculate order total after items are inserted
CREATE TRIGGER recalculate_order_total_after_insert
AFTER INSERT ON order_items
FOR EACH ROW EXECUTE FUNCTION public.recalculate_order_total();