-- ============================================
-- MIGRATION: Site-Wide Access System
-- Replaces per-lesson purchases with site-wide access_status on users
-- ============================================

-- 1. Add access_status column to users
ALTER TABLE public.users
ADD COLUMN access_status text NOT NULL DEFAULT 'none'
CHECK (access_status IN ('none', 'pending', 'approved', 'rejected'));

-- 2. Migrate existing students with purchases to 'approved'
UPDATE public.users
SET access_status = 'approved'
WHERE role = 'student'
AND id IN (SELECT DISTINCT user_id FROM public.purchases);

-- 3. Update RLS on materials: check access_status instead of purchases
DROP POLICY IF EXISTS "Users can read materials for purchased/free lessons" ON public.materials;

CREATE POLICY "Users can read materials for accessible lessons"
  ON public.materials FOR SELECT
  USING (
    exists (
      select 1 from public.lessons l
      where l.id = lesson_id and l.is_free = true
    )
    OR
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.access_status = 'approved'
    )
    OR public.is_admin()
  );

-- 4. Update RLS on homework: check access_status instead of purchases for insert
DROP POLICY IF EXISTS "Students can submit homework" ON public.homework;

CREATE POLICY "Students can submit homework"
  ON public.homework FOR INSERT
  WITH CHECK (
    auth.uid() = student_id
    AND (
      exists (
        select 1 from public.lessons l
        where l.id = lesson_id and l.is_free = true
      )
      OR
      exists (
        select 1 from public.users u
        where u.id = auth.uid() and u.access_status = 'approved'
      )
    )
  );

-- 5. Add policy for admin to update user access_status
CREATE POLICY "Admin can update users"
  ON public.users FOR UPDATE
  USING (public.is_admin());
