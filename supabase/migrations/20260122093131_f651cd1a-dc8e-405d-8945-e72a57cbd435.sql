-- Create triggers that were missing

-- Trigger to validate order item prices
CREATE TRIGGER validate_order_item_price_trigger
BEFORE INSERT ON public.order_items
FOR EACH ROW
EXECUTE FUNCTION public.validate_order_item_price();

-- Trigger to recalculate order totals
CREATE TRIGGER recalculate_order_total_trigger
AFTER INSERT ON public.order_items
FOR EACH ROW
EXECUTE FUNCTION public.recalculate_order_total();