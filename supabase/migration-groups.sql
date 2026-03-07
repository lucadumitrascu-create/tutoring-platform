-- ============================================
-- MIGRATION: Group-Based Classroom System
-- Drops old lesson/material/purchase/homework tables
-- Creates groups, posts, assignments, meetings
-- ============================================

-- 1. Drop old tables (order matters due to FK dependencies)
DROP TABLE IF EXISTS public.homework CASCADE;
DROP TABLE IF EXISTS public.purchases CASCADE;
DROP TABLE IF EXISTS public.materials CASCADE;
DROP TABLE IF EXISTS public.lessons CASCADE;

-- 2. Helper function: check group membership
CREATE OR REPLACE FUNCTION public.is_group_member(gid uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = gid AND user_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- ============================================
-- GROUPS
-- ============================================
CREATE TABLE public.groups (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage groups"
  ON public.groups FOR ALL
  USING (public.is_admin());

CREATE POLICY "Students can read own groups"
  ON public.groups FOR SELECT
  USING (public.is_group_member(id));

-- ============================================
-- GROUP MEMBERS
-- ============================================
CREATE TABLE public.group_members (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id uuid REFERENCES public.groups(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(group_id, user_id)
);

ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage group members"
  ON public.group_members FOR ALL
  USING (public.is_admin());

CREATE POLICY "Students can read own memberships"
  ON public.group_members FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================
-- POSTS (Lessons/Content in a group)
-- ============================================
CREATE TABLE public.posts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id uuid REFERENCES public.groups(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage posts"
  ON public.posts FOR ALL
  USING (public.is_admin());

CREATE POLICY "Students can read posts in own groups"
  ON public.posts FOR SELECT
  USING (public.is_group_member(group_id));

-- ============================================
-- POST FILES (ordered attachments)
-- ============================================
CREATE TABLE public.post_files (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id uuid REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  file_url text NOT NULL,
  file_type text NOT NULL DEFAULT 'application/pdf',
  file_name text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.post_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage post files"
  ON public.post_files FOR ALL
  USING (public.is_admin());

CREATE POLICY "Students can read post files in own groups"
  ON public.post_files FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.posts p
      WHERE p.id = post_id AND public.is_group_member(p.group_id)
    )
  );

-- ============================================
-- ASSIGNMENTS (Homework with requirements)
-- ============================================
CREATE TABLE public.assignments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id uuid REFERENCES public.groups(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  deadline timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage assignments"
  ON public.assignments FOR ALL
  USING (public.is_admin());

CREATE POLICY "Students can read assignments in own groups"
  ON public.assignments FOR SELECT
  USING (public.is_group_member(group_id));

-- ============================================
-- ASSIGNMENT FILES (admin-attached reference files)
-- ============================================
CREATE TABLE public.assignment_files (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  assignment_id uuid REFERENCES public.assignments(id) ON DELETE CASCADE NOT NULL,
  file_url text NOT NULL,
  file_type text NOT NULL DEFAULT 'application/pdf',
  file_name text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.assignment_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage assignment files"
  ON public.assignment_files FOR ALL
  USING (public.is_admin());

CREATE POLICY "Students can read assignment files in own groups"
  ON public.assignment_files FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.assignments a
      WHERE a.id = assignment_id AND public.is_group_member(a.group_id)
    )
  );

-- ============================================
-- ASSIGNMENT SUBMISSIONS (student work)
-- ============================================
CREATE TABLE public.assignment_submissions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  assignment_id uuid REFERENCES public.assignments(id) ON DELETE CASCADE NOT NULL,
  student_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  file_url text NOT NULL,
  file_name text NOT NULL,
  status text NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'approved', 'rejected')),
  feedback text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(assignment_id, student_id)
);

ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage submissions"
  ON public.assignment_submissions FOR ALL
  USING (public.is_admin());

CREATE POLICY "Students can read own submissions"
  ON public.assignment_submissions FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Students can insert own submissions"
  ON public.assignment_submissions FOR INSERT
  WITH CHECK (
    auth.uid() = student_id
    AND EXISTS (
      SELECT 1 FROM public.assignments a
      WHERE a.id = assignment_id AND public.is_group_member(a.group_id)
    )
  );

CREATE POLICY "Students can update own submissions"
  ON public.assignment_submissions FOR UPDATE
  USING (auth.uid() = student_id)
  WITH CHECK (auth.uid() = student_id);

-- ============================================
-- MEETINGS (Google Meet per group)
-- ============================================
CREATE TABLE public.meetings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id uuid REFERENCES public.groups(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  meet_link text NOT NULL,
  scheduled_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage meetings"
  ON public.meetings FOR ALL
  USING (public.is_admin());

CREATE POLICY "Students can read meetings in own groups"
  ON public.meetings FOR SELECT
  USING (public.is_group_member(group_id));
