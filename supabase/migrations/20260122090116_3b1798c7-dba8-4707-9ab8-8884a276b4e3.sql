-- Add length constraint to profiles table for full_name
ALTER TABLE profiles 
ADD CONSTRAINT profiles_full_name_length 
CHECK (char_length(full_name) <= 200 OR full_name IS NULL);

-- Update handle_new_user function with input validation and length limiting
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  safe_full_name TEXT;
BEGIN
  -- Extract full_name, limit to 200 characters, and trim whitespace
  safe_full_name := trim(substring(
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    1,
    200
  ));
  
  -- Insert profile with validated name (NULLIF converts empty string to NULL)
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, NULLIF(safe_full_name, ''));
  
  -- Assign default user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;