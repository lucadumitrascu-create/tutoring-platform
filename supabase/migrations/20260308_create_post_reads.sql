CREATE TABLE post_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, post_id)
);

ALTER TABLE post_reads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own" ON post_reads
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own" ON post_reads
  FOR INSERT WITH CHECK (auth.uid() = user_id);
