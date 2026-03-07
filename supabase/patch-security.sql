-- ============================================
-- SECURITY PATCH - Run in Supabase SQL Editor
-- Adds missing RLS policies
-- ============================================

-- Students can resubmit homework (update their own)
create policy "Students can update own homework"
  on public.homework for update
  using (auth.uid() = student_id)
  with check (auth.uid() = student_id);

-- Admin can delete homework (for lesson deletion cascade)
create policy "Admin can delete homework"
  on public.homework for delete
  using (
    exists (
      select 1 from public.users
      where id = auth.uid() and role = 'admin'
    )
  );

-- Admin can delete purchases (for lesson deletion cascade)
create policy "Admin can delete purchases"
  on public.purchases for delete
  using (
    exists (
      select 1 from public.users
      where id = auth.uid() and role = 'admin'
    )
  );
