-- Create scenarios table
CREATE TABLE IF NOT EXISTS scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  role TEXT NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  description TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_scenarios_difficulty ON scenarios(difficulty);
CREATE INDEX IF NOT EXISTS idx_scenarios_role ON scenarios(role);

-- Enable Row Level Security (RLS)
ALTER TABLE scenarios ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all authenticated users to read scenarios
CREATE POLICY "Allow authenticated users to read scenarios"
  ON scenarios
  FOR SELECT
  TO authenticated
  USING (true);

-- Create policy to allow only service role to insert/update/delete scenarios
CREATE POLICY "Allow service role to manage scenarios"
  ON scenarios
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
