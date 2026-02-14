
-- Add wallet_id column
ALTER TABLE public.profiles ADD COLUMN wallet_id text UNIQUE;

-- Function to generate unique wallet ID like "WLT-XXXXXX"
CREATE OR REPLACE FUNCTION public.generate_wallet_id()
RETURNS text
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  new_id text;
  exists_already boolean;
BEGIN
  LOOP
    new_id := 'WLT-' || upper(substr(md5(gen_random_uuid()::text), 1, 8));
    SELECT EXISTS(SELECT 1 FROM profiles WHERE wallet_id = new_id) INTO exists_already;
    EXIT WHEN NOT exists_already;
  END LOOP;
  RETURN new_id;
END;
$$;

-- Update handle_new_user to assign wallet_id on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, email, wallet_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    NEW.email,
    public.generate_wallet_id()
  );
  RETURN NEW;
END;
$$;

-- Backfill existing profiles with wallet IDs
UPDATE public.profiles SET wallet_id = public.generate_wallet_id() WHERE wallet_id IS NULL;

-- Make wallet_id NOT NULL after backfill
ALTER TABLE public.profiles ALTER COLUMN wallet_id SET NOT NULL;
ALTER TABLE public.profiles ALTER COLUMN wallet_id SET DEFAULT public.generate_wallet_id();

-- Update transfer_money to also support wallet_id lookup
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
  v_sender_balance numeric;
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

  -- Find recipient by wallet_id, email, or upi
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

  SELECT balance INTO v_sender_balance FROM profiles WHERE user_id = v_sender_id FOR UPDATE;
  IF v_sender_balance < p_amount THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient balance');
  END IF;

  UPDATE profiles SET balance = balance - p_amount WHERE user_id = v_sender_id;
  UPDATE profiles SET balance = balance + p_amount WHERE user_id = v_recipient_profile.user_id;

  INSERT INTO transactions (user_id, type, method, amount, currency, recipient_name, recipient_address, status)
  VALUES (v_sender_id, 'sent', p_method, '₹' || p_amount::text, 'INR', v_recipient_profile.display_name,
    COALESCE(p_recipient_wallet_id, p_recipient_email, p_recipient_upi), 'completed');

  INSERT INTO transactions (user_id, type, method, amount, currency, recipient_name, recipient_address, status)
  VALUES (v_recipient_profile.user_id, 'received', p_method, '₹' || p_amount::text, 'INR',
    (SELECT display_name FROM profiles WHERE user_id = v_sender_id),
    (SELECT COALESCE(wallet_id, email) FROM profiles WHERE user_id = v_sender_id), 'completed');

  RETURN jsonb_build_object('success', true, 'recipient_name', v_recipient_profile.display_name);
END;
$$;
