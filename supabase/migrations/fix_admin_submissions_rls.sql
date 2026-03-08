-- Fix: Replace the single FOR ALL policy with explicit per-operation policies
-- This resolves issues where Supabase RLS FOR ALL policies may not correctly
-- apply the USING clause as a WITH CHECK for INSERT/UPDATE operations.

DROP POLICY IF EXISTS "Admin can manage submissions" ON public.assignment_submissions;

CREATE POLICY "Admin can read all submissions"
  ON public.assignment_submissions FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admin can update submissions"
  ON public.assignment_submissions FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Admin can delete submissions"
  ON public.assignment_submissions FOR DELETE
  USING (public.is_admin());
