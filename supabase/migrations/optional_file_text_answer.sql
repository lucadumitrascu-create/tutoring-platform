-- Make file attachment optional and add text_answer column
ALTER TABLE public.assignment_submissions
  ALTER COLUMN file_url DROP NOT NULL,
  ALTER COLUMN file_name DROP NOT NULL;

ALTER TABLE public.assignment_submissions
  ADD COLUMN IF NOT EXISTS text_answer text;
