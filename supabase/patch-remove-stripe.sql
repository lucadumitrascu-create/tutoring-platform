-- ============================================
-- MIGRATION: Remove Stripe, add manual access
-- Run in Supabase SQL Editor
-- ============================================

-- Remove stripe_session_id column from purchases
ALTER TABLE public.purchases ALTER COLUMN stripe_session_id DROP NOT NULL;
ALTER TABLE public.purchases DROP COLUMN IF EXISTS stripe_session_id;

-- Add granted_by column (which admin granted access)
ALTER TABLE public.purchases ADD COLUMN IF NOT EXISTS granted_by uuid REFERENCES public.users(id);

-- Drop the old insert policy (was for Stripe webhook)
DROP POLICY IF EXISTS "Service role can insert purchases" ON public.purchases;

-- Add admin insert policy
CREATE POLICY "Admin can insert purchases"
  ON public.purchases FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
