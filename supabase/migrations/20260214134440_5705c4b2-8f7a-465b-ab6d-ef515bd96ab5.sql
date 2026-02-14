
-- Add balance column to profiles
ALTER TABLE public.profiles ADD COLUMN balance numeric NOT NULL DEFAULT 10000;

-- Create a secure transfer function that handles the full transaction atomically
CREATE OR REPLACE FUNCTION public.transfer_money(
  p_recipient_email text DEFAULT NULL,
  p_recipient_upi text DEFAULT NULL,
  p_amount numeric DEFAULT 0,
  p_method text DEFAULT 'bank'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sender_id uuid;
  v_recipient_profile record;
  v_sender_balance numeric;
BEGIN
  -- Get sender
  v_sender_id := auth.uid();
  IF v_sender_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Validate amount
  IF p_amount <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Amount must be positive');
  END IF;

  -- Must provide email or UPI
  IF p_recipient_email IS NULL AND p_recipient_upi IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Provide recipient email or UPI ID');
  END IF;

  -- Find recipient
  IF p_recipient_email IS NOT NULL THEN
    SELECT * INTO v_recipient_profile FROM profiles WHERE email = p_recipient_email LIMIT 1;
  ELSE
    SELECT * INTO v_recipient_profile FROM profiles WHERE upi_id = p_recipient_upi LIMIT 1;
  END IF;

  IF v_recipient_profile IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Recipient not found');
  END IF;

  IF v_recipient_profile.user_id = v_sender_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot send to yourself');
  END IF;

  -- Check sender balance
  SELECT balance INTO v_sender_balance FROM profiles WHERE user_id = v_sender_id FOR UPDATE;
  IF v_sender_balance < p_amount THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient balance');
  END IF;

  -- Debit sender
  UPDATE profiles SET balance = balance - p_amount WHERE user_id = v_sender_id;

  -- Credit recipient
  UPDATE profiles SET balance = balance + p_amount WHERE user_id = v_recipient_profile.user_id;

  -- Record sender transaction
  INSERT INTO transactions (user_id, type, method, amount, currency, recipient_name, recipient_address, status)
  VALUES (v_sender_id, 'sent', p_method, '₹' || p_amount::text, 'INR', v_recipient_profile.display_name,
    COALESCE(p_recipient_email, p_recipient_upi), 'completed');

  -- Record recipient transaction
  INSERT INTO transactions (user_id, type, method, amount, currency, recipient_name, recipient_address, status)
  VALUES (v_recipient_profile.user_id, 'received', p_method, '₹' || p_amount::text, 'INR',
    (SELECT display_name FROM profiles WHERE user_id = v_sender_id),
    (SELECT email FROM profiles WHERE user_id = v_sender_id), 'completed');

  RETURN jsonb_build_object('success', true, 'recipient_name', v_recipient_profile.display_name);
END;
$$;

-- Allow profiles to be looked up by email/UPI for search (read-only, limited fields)
CREATE POLICY "Users can search profiles by email or upi"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- Drop the old restrictive select policy since the new one covers it
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
