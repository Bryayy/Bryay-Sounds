-- ============================================
-- STRIPE CHECKOUT SETUP
-- Run this in Supabase SQL Editor
-- ============================================

-- Add stripe_price_id columns to track which prices users are on
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS stripe_price_id text;

-- Create a table to store pending checkout sessions
CREATE TABLE IF NOT EXISTS public.checkout_sessions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  stripe_session_id text,
  plan text NOT NULL CHECK (plan IN ('basic', 'premium')),
  billing_cycle text NOT NULL CHECK (billing_cycle IN ('monthly', 'annual')),
  price_id text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'expired')),
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.checkout_sessions ENABLE ROW LEVEL SECURITY;

-- Users can view and create their own checkout sessions
CREATE POLICY "Users can view own checkout sessions"
  ON public.checkout_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own checkout sessions"
  ON public.checkout_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create a function to activate a subscription after payment
-- This will be called by the webhook or manually for testing
CREATE OR REPLACE FUNCTION public.activate_subscription(
  p_user_id uuid,
  p_plan text,
  p_billing_cycle text,
  p_stripe_customer_id text DEFAULT NULL,
  p_stripe_subscription_id text DEFAULT NULL
)
RETURNS void AS $$
DECLARE
  v_credits integer;
  v_reset_date timestamp with time zone;
BEGIN
  -- Set credits based on plan
  IF p_plan = 'basic' THEN
    v_credits := 5;
  ELSIF p_plan = 'premium' THEN
    v_credits := 8;
  ELSE
    RAISE EXCEPTION 'Invalid plan: %', p_plan;
  END IF;

  -- Set reset date to 30 days from now
  v_reset_date := now() + interval '30 days';

  -- Update the user's profile
  UPDATE public.profiles
  SET 
    plan = p_plan,
    billing_cycle = p_billing_cycle,
    credits_remaining = v_credits,
    credits_reset_date = v_reset_date,
    stripe_customer_id = COALESCE(p_stripe_customer_id, stripe_customer_id),
    stripe_subscription_id = COALESCE(p_stripe_subscription_id, stripe_subscription_id),
    updated_at = now()
  WHERE id = p_user_id;

  -- Record the transaction
  INSERT INTO public.transactions (user_id, type, amount, description)
  VALUES (
    p_user_id,
    'subscription',
    CASE 
      WHEN p_plan = 'basic' AND p_billing_cycle = 'monthly' THEN 9.99
      WHEN p_plan = 'basic' AND p_billing_cycle = 'annual' THEN 99.00
      WHEN p_plan = 'premium' AND p_billing_cycle = 'monthly' THEN 19.99
      WHEN p_plan = 'premium' AND p_billing_cycle = 'annual' THEN 179.00
    END,
    p_plan || ' ' || p_billing_cycle || ' subscription activated'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
