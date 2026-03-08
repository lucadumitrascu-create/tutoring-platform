-- Add feedback file fields to assignment_submissions
ALTER TABLE assignment_submissions ADD COLUMN feedback_file_url text;
ALTER TABLE assignment_submissions ADD COLUMN feedback_file_name text;
