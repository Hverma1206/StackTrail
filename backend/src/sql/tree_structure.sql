-- ============================================
-- TREE-BASED DECISION STRUCTURE MIGRATION
-- ============================================

-- Drop existing steps table and recreate with tree structure
DROP TABLE IF EXISTS steps CASCADE;

CREATE TABLE steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id UUID NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
  context TEXT NOT NULL,
  options JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_root BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Each scenario should have exactly one root step
  UNIQUE(scenario_id, is_root) WHERE is_root = true
);

-- Create indexes
CREATE INDEX idx_steps_scenario_id ON steps(scenario_id);
CREATE INDEX idx_steps_root ON steps(scenario_id, is_root) WHERE is_root = true;

-- Enable RLS
ALTER TABLE steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to read steps"
  ON steps
  FOR SELECT
  TO authenticated
  USING (true);

-- ============================================
-- UPDATE PROGRESS TABLE FOR TREE NAVIGATION
-- ============================================

DROP TABLE IF EXISTS progress CASCADE;

CREATE TABLE progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scenario_id UUID NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
  current_step_id UUID REFERENCES steps(id) ON DELETE SET NULL,
  total_xp INTEGER DEFAULT 0,
  decisions JSONB DEFAULT '[]'::jsonb,
  completed BOOLEAN DEFAULT false,
  failed BOOLEAN DEFAULT false,
  bad_decision_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  
  UNIQUE(user_id, scenario_id)
);

-- Create indexes
CREATE INDEX idx_progress_user_id ON progress(user_id);
CREATE INDEX idx_progress_scenario_id ON progress(scenario_id);
CREATE INDEX idx_progress_user_scenario ON progress(user_id, scenario_id);

-- Enable RLS
ALTER TABLE progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own progress"
  ON progress
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress"
  ON progress
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
  ON progress
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to get root step for a scenario
CREATE OR REPLACE FUNCTION get_root_step(p_scenario_id UUID)
RETURNS TABLE (
  id UUID,
  scenario_id UUID,
  context TEXT,
  options JSONB,
  is_root BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT s.id, s.scenario_id, s.context, s.options, s.is_root
  FROM steps s
  WHERE s.scenario_id = p_scenario_id AND s.is_root = true
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- EXAMPLE SEED DATA (TREE STRUCTURE)
-- ============================================

-- Insert a sample scenario
INSERT INTO scenarios (id, title, description, role, difficulty)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440000', 
   'Database Performance Crisis', 
   'Production database is experiencing high latency. Diagnose and resolve the issue.',
   'Backend Engineer',
   'medium')
ON CONFLICT (id) DO NOTHING;

-- Root step
INSERT INTO steps (id, scenario_id, context, options, is_root)
VALUES (
  '550e8400-e29b-41d4-a716-446655440001',
  '550e8400-e29b-41d4-a716-446655440000',
  'You receive an alert: Database CPU at 95%. Multiple slow queries detected. What is your first action?',
  '[
    {
      "id": "opt-1-restart",
      "text": "Immediately restart the database server",
      "xpChange": -10,
      "nextStepId": "550e8400-e29b-41d4-a716-446655440002"
    },
    {
      "id": "opt-1-investigate",
      "text": "Check slow query logs and identify problematic queries",
      "xpChange": 20,
      "nextStepId": "550e8400-e29b-41d4-a716-446655440003"
    },
    {
      "id": "opt-1-scale",
      "text": "Immediately add more database replicas",
      "xpChange": 5,
      "nextStepId": "550e8400-e29b-41d4-a716-446655440004"
    }
  ]'::jsonb,
  true
);

-- Bad path: Restarted without investigation
INSERT INTO steps (id, scenario_id, context, options, is_root)
VALUES (
  '550e8400-e29b-41d4-a716-446655440002',
  '550e8400-e29b-41d4-a716-446655440000',
  'Database restarted but issue persists. You lost 5 minutes and caused brief downtime. Now what?',
  '[
    {
      "id": "opt-2-logs",
      "text": "Now check the slow query logs",
      "xpChange": 10,
      "nextStepId": "550e8400-e29b-41d4-a716-446655440003"
    },
    {
      "id": "opt-2-panic",
      "text": "Panic and call senior engineer",
      "xpChange": -15,
      "nextStepId": null
    }
  ]'::jsonb,
  false
);

-- Good path: Investigated properly
INSERT INTO steps (id, scenario_id, context, options, is_root)
VALUES (
  '550e8400-e29b-41d4-a716-446655440003',
  '550e8400-e29b-41d4-a716-446655440000',
  'You found a query without proper indexing running every 2 seconds. It scans 1M rows. What do you do?',
  '[
    {
      "id": "opt-3-prod-index",
      "text": "Create the missing index immediately on production",
      "xpChange": -5,
      "nextStepId": "550e8400-e29b-41d4-a716-446655440005"
    },
    {
      "id": "opt-3-staging",
      "text": "Test index creation on staging first, then deploy to production",
      "xpChange": 25,
      "nextStepId": "550e8400-e29b-41d4-a716-446655440006"
    },
    {
      "id": "opt-3-disable",
      "text": "Disable the feature that runs this query",
      "xpChange": 5,
      "nextStepId": "550e8400-e29b-41d4-a716-446655440007"
    }
  ]'::jsonb,
  false
);

-- Risky path: Scaled without understanding
INSERT INTO steps (id, scenario_id, context, options, is_root)
VALUES (
  '550e8400-e29b-41d4-a716-446655440004',
  '550e8400-e29b-41d4-a716-446655440000',
  'Added replicas. Bill increased $500/month but load remains high. The root cause is still there.',
  '[
    {
      "id": "opt-4-investigate",
      "text": "Now investigate the actual queries",
      "xpChange": 15,
      "nextStepId": "550e8400-e29b-41d4-a716-446655440003"
    },
    {
      "id": "opt-4-give-up",
      "text": "Accept the higher cost and move on",
      "xpChange": -20,
      "nextStepId": null
    }
  ]'::jsonb,
  false
);

-- Risky path: Created index in production directly
INSERT INTO steps (id, scenario_id, context, options, is_root)
VALUES (
  '550e8400-e29b-41d4-a716-446655440005',
  '550e8400-e29b-41d4-a716-446655440000',
  'Index creation locked the table for 30 seconds during peak hours. Some transactions timed out.',
  '[
    {
      "id": "opt-5-monitor",
      "text": "Monitor the situation and learn from the mistake",
      "xpChange": 10,
      "nextStepId": null
    },
    {
      "id": "opt-5-rollback",
      "text": "Try to rollback the index (too late)",
      "xpChange": -10,
      "nextStepId": null
    }
  ]'::jsonb,
  false
);

-- Best path: Tested in staging
INSERT INTO steps (id, scenario_id, context, options, is_root)
VALUES (
  '550e8400-e29b-41d4-a716-446655440006',
  '550e8400-e29b-41d4-a716-446655440000',
  'Index tested successfully in staging. Query time dropped from 800ms to 12ms. Ready to deploy.',
  '[
    {
      "id": "opt-6-deploy",
      "text": "Deploy index to production with CONCURRENTLY option",
      "xpChange": 30,
      "nextStepId": null
    },
    {
      "id": "opt-6-wait",
      "text": "Wait for off-peak hours",
      "xpChange": 20,
      "nextStepId": null
    }
  ]'::jsonb,
  false
);

-- Disabled feature path
INSERT INTO steps (id, scenario_id, context, options, is_root)
VALUES (
  '550e8400-e29b-41d4-a716-446655440007',
  '550e8400-e29b-41d4-a716-446655440000',
  'Feature disabled. Database load decreased but users are complaining about missing functionality.',
  '[
    {
      "id": "opt-7-fix",
      "text": "Re-enable and fix with proper indexing",
      "xpChange": 15,
      "nextStepId": "550e8400-e29b-41d4-a716-446655440006"
    },
    {
      "id": "opt-7-keep",
      "text": "Keep feature disabled permanently",
      "xpChange": -15,
      "nextStepId": null
    }
  ]'::jsonb,
  false
);

COMMENT ON TABLE steps IS 'Tree-based decision structure. Each step has options with nextStepId for navigation.';
COMMENT ON COLUMN steps.options IS 'JSONB array of options. Each option has: id, text, xpChange, nextStepId';
COMMENT ON COLUMN steps.is_root IS 'True for the starting step of a scenario. Each scenario has exactly one root.';
COMMENT ON TABLE progress IS 'Tracks user progress through decision trees with XP and decision history.';
