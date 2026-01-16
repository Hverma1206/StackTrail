-- Create steps table
CREATE TABLE IF NOT EXISTS steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id UUID NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL,
  context TEXT NOT NULL,
  options JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(scenario_id, step_order)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_steps_scenario_id ON steps(scenario_id);
CREATE INDEX IF NOT EXISTS idx_steps_scenario_order ON steps(scenario_id, step_order);

-- Enable Row Level Security (RLS)
ALTER TABLE steps ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all authenticated users to read steps
CREATE POLICY "Allow authenticated users to read steps"
  ON steps
  FOR SELECT
  TO authenticated
  USING (true);

-- Create policy to allow only service role to insert/update/delete steps
CREATE POLICY "Allow service role to manage steps"
  ON steps
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
