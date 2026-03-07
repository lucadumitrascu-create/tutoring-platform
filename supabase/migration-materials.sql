-- ============================================
-- MIGRATION: Materials Library (Central)
-- Admin-only content organized by categories
-- ============================================

CREATE TABLE public.material_categories (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.material_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id uuid REFERENCES public.material_categories(id) ON DELETE CASCADE NOT NULL,
  file_url text NOT NULL,
  file_type text NOT NULL DEFAULT 'application/pdf',
  file_name text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.material_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.material_items ENABLE ROW LEVEL SECURITY;

-- Admin-only policies
CREATE POLICY "Admin can manage material categories"
  ON public.material_categories FOR ALL USING (public.is_admin());

CREATE POLICY "Admin can manage material items"
  ON public.material_items FOR ALL USING (public.is_admin());
