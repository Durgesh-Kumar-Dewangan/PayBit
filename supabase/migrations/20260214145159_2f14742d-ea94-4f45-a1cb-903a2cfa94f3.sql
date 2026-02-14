
-- Add daily balance columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN daily_balance numeric NOT NULL DEFAULT 200,
ADD COLUMN last_daily_reset date NOT NULL DEFAULT CURRENT_DATE;

-- Function to check and refresh daily balance
CREATE OR REPLACE FUNCTION public.refresh_daily_balance(p_user_id uuid)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_daily_balance numeric;
  v_last_reset date;
BEGIN
  SELECT daily_balance, last_daily_reset INTO v_daily_balance, v_last_reset
  FROM profiles WHERE user_id = p_user_id FOR UPDATE;

  -- If last reset was before today, refresh to 200
  IF v_last_reset < CURRENT_DATE THEN
    UPDATE profiles 
    SET daily_balance = 200, last_daily_reset = CURRENT_DATE 
    WHERE user_id = p_user_id;
    RETURN 200;
  END IF;

  RETURN v_daily_balance;
END;
$$;

-- Update transfer_money to use daily_balance instead of main balance
CREATE OR REPLACE FUNCTION public.transfer_money(
  p_recipient_email text DEFAULT NULL,
  p_recipient_upi text DEFAULT NULL,
  p_recipient_wallet_id text DEFAULT NULL,
  p_amount numeric DEFAULT 0,
  p_method text DEFAULT 'bank'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_sender_id uuid;
  v_recipient_profile record;
  v_available_balance numeric;
BEGIN
  v_sender_id := auth.uid();
  IF v_sender_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  IF p_amount <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Amount must be positive');
  END IF;

  IF p_recipient_email IS NULL AND p_recipient_upi IS NULL AND p_recipient_wallet_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Provide recipient email, UPI ID, or Wallet ID');
  END IF;

  -- Find recipient
  IF p_recipient_wallet_id IS NOT NULL THEN
    SELECT * INTO v_recipient_profile FROM profiles WHERE wallet_id = p_recipient_wallet_id LIMIT 1;
  ELSIF p_recipient_email IS NOT NULL THEN
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

  -- Refresh daily balance if new day, then check
  v_available_balance := public.refresh_daily_balance(v_sender_id);

  IF v_available_balance < p_amount THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient daily balance. You have ₹' || v_available_balance::text || ' remaining today.');
  END IF;

  -- Debit sender daily balance
  UPDATE profiles SET daily_balance = daily_balance - p_amount WHERE user_id = v_sender_id;

  -- Credit recipient daily balance
  UPDATE profiles SET daily_balance = daily_balance + p_amount WHERE user_id = v_recipient_profile.user_id;

  -- Record transactions
  INSERT INTO transactions (user_id, type, method, amount, currency, recipient_name, recipient_address, status)
  VALUES (v_sender_id, 'sent', p_method, '₹' || p_amount::text, 'INR', v_recipient_profile.display_name,
    COALESCE(p_recipient_wallet_id, p_recipient_email, p_recipient_upi), 'completed');

  INSERT INTO transactions (user_id, type, method, amount, currency, recipient_name, recipient_address, status)
  VALUES (v_recipient_profile.user_id, 'received', p_method, '₹' || p_amount::text, 'INR',
    (SELECT display_name FROM profiles WHERE user_id = v_sender_id),
    (SELECT COALESCE(wallet_id, email) FROM profiles WHERE user_id = v_sender_id), 'completed');

  RETURN jsonb_build_object('success', true, 'recipient_name', v_recipient_profile.display_name, 'remaining_balance', (v_available_balance - p_amount));
END;
$$;
