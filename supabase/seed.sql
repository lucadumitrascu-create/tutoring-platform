-- ============================================
-- SEED DATA (optional - for testing)
-- Run AFTER schema.sql
-- Note: Users are created via Supabase Auth,
-- the trigger auto-creates the profile row.
-- These lessons can be inserted by the admin.
-- ============================================

insert into public.lessons (title, description, price, is_free, meet_link, scheduled_at)
values
  ('Introduction to Mathematics', 'Basics of algebra and geometry. Perfect for beginners.', 0, true, null, null),
  ('Advanced Calculus', 'Derivatives, integrals, and real-world applications.', 29.99, false, 'https://meet.google.com/abc-defg-hij', '2026-03-15 18:00:00+00'),
  ('English Grammar Masterclass', 'Tenses, conditionals, and advanced sentence structures.', 19.99, false, 'https://meet.google.com/xyz-abcd-efg', '2026-03-20 17:00:00+00');
