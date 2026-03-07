-- ============================================
-- TUTORING PLATFORM - DATABASE SCHEMA
-- Run this in your Supabase SQL Editor
-- ============================================

-- Helper function to check admin role (avoids RLS recursion)
create or replace function public.is_admin()
returns boolean as $$
  select exists (
    select 1 from public.users
    where id = auth.uid() and role = 'admin'
  );
$$ language sql security definer;


-- 1. USERS TABLE
-- Extends Supabase auth.users with role and profile info
create table public.users (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  role text not null default 'student' check (role in ('admin', 'student')),
  full_name text not null default '',
  access_status text not null default 'none' check (access_status in ('none', 'pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

alter table public.users enable row level security;

-- Anyone can read their own profile
create policy "Users can read own profile"
  on public.users for select
  using (auth.uid() = id);

-- Admin can read all users
create policy "Admin can read all users"
  on public.users for select
  using (public.is_admin());

-- Users can update their own profile (not role)
create policy "Users can update own profile"
  on public.users for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Admin can update any user (for access_status management)
create policy "Admin can update users"
  on public.users for update
  using (public.is_admin());

-- Allow insert during registration (triggered by function)
create policy "Allow insert for authenticated users"
  on public.users for insert
  with check (auth.uid() = id);


-- 2. LESSONS TABLE
create table public.lessons (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text not null default '',
  price numeric(10,2) not null default 0,
  is_free boolean not null default false,
  meet_link text,
  scheduled_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.lessons enable row level security;

-- Everyone (even anonymous) can read lessons for browsing
create policy "Anyone can read lessons"
  on public.lessons for select
  using (true);

-- Only admin can insert/update/delete lessons
create policy "Admin can insert lessons"
  on public.lessons for insert
  with check (public.is_admin());

create policy "Admin can update lessons"
  on public.lessons for update
  using (public.is_admin());

create policy "Admin can delete lessons"
  on public.lessons for delete
  using (public.is_admin());


-- 3. MATERIALS TABLE
create table public.materials (
  id uuid default gen_random_uuid() primary key,
  lesson_id uuid references public.lessons(id) on delete cascade not null,
  file_url text not null,
  file_type text not null default 'pdf',
  file_name text not null,
  uploaded_by uuid references public.users(id) not null,
  created_at timestamptz not null default now()
);

alter table public.materials enable row level security;

-- Students can read materials for accessible lessons (free or approved access)
create policy "Users can read materials for accessible lessons"
  on public.materials for select
  using (
    exists (
      select 1 from public.lessons l
      where l.id = lesson_id and l.is_free = true
    )
    or
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.access_status = 'approved'
    )
    or public.is_admin()
  );

-- Only admin can manage materials
create policy "Admin can insert materials"
  on public.materials for insert
  with check (public.is_admin());

create policy "Admin can delete materials"
  on public.materials for delete
  using (public.is_admin());


-- 4. PURCHASES (ACCESS GRANTS) TABLE
create table public.purchases (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  lesson_id uuid references public.lessons(id) on delete cascade not null,
  granted_by uuid references public.users(id),
  created_at timestamptz not null default now(),
  unique(user_id, lesson_id)
);

alter table public.purchases enable row level security;

-- Students can read their own purchases
create policy "Users can read own purchases"
  on public.purchases for select
  using (auth.uid() = user_id);

-- Admin can read all purchases
create policy "Admin can read all purchases"
  on public.purchases for select
  using (public.is_admin());

-- Admin can insert purchases (grant access)
create policy "Admin can insert purchases"
  on public.purchases for insert
  with check (public.is_admin());

-- Admin can delete purchases (revoke access)
create policy "Admin can delete purchases"
  on public.purchases for delete
  using (public.is_admin());


-- 5. HOMEWORK TABLE
create table public.homework (
  id uuid default gen_random_uuid() primary key,
  lesson_id uuid references public.lessons(id) on delete cascade not null,
  student_id uuid references public.users(id) on delete cascade not null,
  file_url text not null,
  file_name text not null,
  status text not null default 'submitted' check (status in ('submitted', 'approved', 'rejected')),
  feedback text,
  created_at timestamptz not null default now()
);

alter table public.homework enable row level security;

-- Students can read their own homework
create policy "Students can read own homework"
  on public.homework for select
  using (auth.uid() = student_id);

-- Students can submit homework for accessible lessons (free or approved access)
create policy "Students can submit homework"
  on public.homework for insert
  with check (
    auth.uid() = student_id
    and (
      exists (
        select 1 from public.lessons l
        where l.id = lesson_id and l.is_free = true
      )
      or
      exists (
        select 1 from public.users u
        where u.id = auth.uid() and u.access_status = 'approved'
      )
    )
  );

-- Admin can read all homework
create policy "Admin can read all homework"
  on public.homework for select
  using (public.is_admin());

-- Students can update their own homework (resubmit)
create policy "Students can update own homework"
  on public.homework for update
  using (auth.uid() = student_id)
  with check (auth.uid() = student_id);

-- Admin can update homework (approve/reject + feedback)
create policy "Admin can update homework"
  on public.homework for update
  using (public.is_admin());

-- Admin can delete homework
create policy "Admin can delete homework"
  on public.homework for delete
  using (public.is_admin());


-- ============================================
-- FUNCTION: Auto-create user profile on signup
-- ============================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, role, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'student'),
    coalesce(new.raw_user_meta_data->>'full_name', '')
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger: runs after each signup
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ============================================
-- STORAGE BUCKETS
-- ============================================

-- Bucket for lesson materials (PDFs, images)
insert into storage.buckets (id, name, public)
values ('materials', 'materials', false);

-- Bucket for homework submissions
insert into storage.buckets (id, name, public)
values ('homework', 'homework', false);

-- Storage policies: materials bucket
create policy "Admin can upload materials"
  on storage.objects for insert
  with check (bucket_id = 'materials' and public.is_admin());

create policy "Users can read materials they have access to"
  on storage.objects for select
  using (
    bucket_id = 'materials'
    and auth.uid() is not null
  );

create policy "Admin can delete materials"
  on storage.objects for delete
  using (bucket_id = 'materials' and public.is_admin());

-- Storage policies: homework bucket
create policy "Students can upload homework"
  on storage.objects for insert
  with check (
    bucket_id = 'homework'
    and auth.uid() is not null
  );

create policy "Users can read own homework files"
  on storage.objects for select
  using (
    bucket_id = 'homework'
    and auth.uid() is not null
  );

create policy "Admin can read all homework files"
  on storage.objects for select
  using (bucket_id = 'homework' and public.is_admin());
