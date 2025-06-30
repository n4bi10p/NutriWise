/*
  # Create meal plans storage table

  1. New Tables
    - `saved_meal_plans`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `name` (text, meal plan name)
      - `plan_type` (text, type of plan - 'weekly_meal_plan' or 'nutrition_strategy')
      - `plan_content` (text, the generated content)
      - `parsed_data` (jsonb, structured meal plan data)
      - `is_active` (boolean, currently active plan)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `saved_meal_plans` table
    - Add policy for users to manage their own meal plans
*/

CREATE TABLE IF NOT EXISTS saved_meal_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  plan_type text NOT NULL CHECK (plan_type IN ('weekly_meal_plan', 'nutrition_strategy')),
  plan_content text NOT NULL,
  parsed_data jsonb DEFAULT '{}',
  is_active boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE saved_meal_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own meal plans"
  ON saved_meal_plans
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Index for better performance
CREATE INDEX IF NOT EXISTS idx_saved_meal_plans_user_type ON saved_meal_plans(user_id, plan_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_saved_meal_plans_active ON saved_meal_plans(user_id, is_active) WHERE is_active = true;