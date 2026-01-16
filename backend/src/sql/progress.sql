-- Create progress table
CREATE TABLE IF NOT EXISTS progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scenario_id UUID NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
  current_step_id UUID REFERENCES steps(id) ON DELETE SET NULL,
  score INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  failed BOOLEAN DEFAULT false,
  bad_decision_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, scenario_id)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_progress_user_id ON progress(user_id);
CREATE INDEX IF NOT EXISTS idx_progress_scenario_id ON progress(scenario_id);
CREATE INDEX IF NOT EXISTS idx_progress_user_scenario ON progress(user_id, scenario_id);

-- Enable Row Level Security (RLS)
ALTER TABLE progress ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to read only their own progress
CREATE POLICY "Users can read own progress"
  ON progress
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policy to allow users to insert their own progress
CREATE POLICY "Users can insert own progress"
  ON progress
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to update only their own progress
CREATE POLICY "Users can update own progress"
  ON progress
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to delete their own progress
CREATE POLICY "Users can delete own progress"
  ON progress
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
