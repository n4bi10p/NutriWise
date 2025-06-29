-- Complete database migration script
-- This script creates the missing user_preferences table and updates constraints
-- Run this in your Supabase SQL Editor

-- Create user_preferences table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  preference_type text NOT NULL CHECK (preference_type IN ('dietary_restriction', 'allergy', 'health_condition', 'food_preference', 'regional_preference', 'original_goal')),
  preference_value text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_preferences
DROP POLICY IF EXISTS "Users can manage own preferences" ON public.user_preferences;
CREATE POLICY "Users can manage own preferences"
  ON public.user_preferences
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_type ON public.user_preferences(user_id, preference_type);

-- Create unique constraint to prevent duplicate preferences
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_preferences_unique ON public.user_preferences(user_id, preference_type, preference_value);

-- Update profiles table goal constraint to support new goal types
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_goal_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_goal_check 
  CHECK (goal IN ('weight_loss', 'muscle_gain', 'maintenance', 'fat_loss_muscle_gain', 'athletic_performance', 'general_health'));

-- Create saved_meal_plans table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.saved_meal_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  plan_type text NOT NULL CHECK (plan_type IN ('weekly_meal_plan', 'nutrition_strategy')),
  plan_content text NOT NULL,
  parsed_data jsonb DEFAULT '{}',
  is_active boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS for saved_meal_plans
ALTER TABLE public.saved_meal_plans ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for saved_meal_plans
DROP POLICY IF EXISTS "Users can manage own meal plans" ON public.saved_meal_plans;
CREATE POLICY "Users can manage own meal plans"
  ON public.saved_meal_plans
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for saved_meal_plans
CREATE INDEX IF NOT EXISTS idx_saved_meal_plans_user_type ON public.saved_meal_plans(user_id, plan_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_saved_meal_plans_active ON public.saved_meal_plans(user_id, is_active) WHERE is_active = true;

-- Add trigger function and trigger for updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop trigger if it exists and recreate it
DROP TRIGGER IF EXISTS update_saved_meal_plans_updated_at ON public.saved_meal_plans;
CREATE TRIGGER update_saved_meal_plans_updated_at 
    BEFORE UPDATE ON public.saved_meal_plans 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Fix RLS policies for grocery_lists table
-- Drop existing policy and create separate, explicit policies

DROP POLICY IF EXISTS "Users can manage own grocery lists" ON public.grocery_lists;

-- Policy for SELECT (reading grocery lists)
CREATE POLICY "Users can view own grocery lists"
  ON public.grocery_lists
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR is_shared = true);

-- Policy for INSERT (creating new grocery lists)
CREATE POLICY "Users can insert own grocery lists"
  ON public.grocery_lists
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy for UPDATE (modifying grocery lists)
CREATE POLICY "Users can update own grocery lists"
  ON public.grocery_lists
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy for DELETE (removing grocery lists)
CREATE POLICY "Users can delete own grocery lists"
  ON public.grocery_lists
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Fix RLS policies for user_progress table
-- Drop existing policy and create separate, explicit policies

DROP POLICY IF EXISTS "Users can manage own progress" ON public.user_progress;

-- Policy for SELECT (reading user progress)
CREATE POLICY "Users can view own progress"
  ON public.user_progress
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy for INSERT (creating new progress entries)
CREATE POLICY "Users can insert own progress"
  ON public.user_progress
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy for UPDATE (modifying progress entries)
CREATE POLICY "Users can update own progress"
  ON public.user_progress
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy for DELETE (removing progress entries)
CREATE POLICY "Users can delete own progress"
  ON public.user_progress
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Fix achievements table and ensure data is populated
CREATE TABLE IF NOT EXISTS public.achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL,
  category text NOT NULL CHECK (category IN ('nutrition', 'consistency', 'community', 'milestone')),
  points integer NOT NULL,
  requirement_type text NOT NULL CHECK (requirement_type IN ('streak', 'total', 'single_day', 'community')),
  requirement_value integer NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS for achievements table
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for achievements (readable by all authenticated users)
DROP POLICY IF EXISTS "Achievements are readable by all" ON public.achievements;
CREATE POLICY "Achievements are readable by all"
  ON public.achievements
  FOR SELECT
  TO authenticated
  USING (true);

-- Insert default achievements
INSERT INTO public.achievements (name, description, icon, category, points, requirement_type, requirement_value) VALUES
('First Steps', 'Complete your first day of meal logging', 'Footprints', 'nutrition', 10, 'single_day', 1),
('Consistency Champion', 'Log meals for 7 days in a row', 'Calendar', 'consistency', 50, 'streak', 7),
('Hydration Hero', 'Meet your water goal for 5 days', 'Droplets', 'nutrition', 30, 'streak', 5),
('Protein Power', 'Meet your protein goal 10 times', 'Zap', 'nutrition', 40, 'total', 10),
('Community Contributor', 'Share your first recipe', 'Users', 'community', 25, 'single_day', 1),
('Recipe Master', 'Share 5 recipes with the community', 'ChefHat', 'community', 75, 'total', 5),
('Streak Superstar', 'Maintain a 30-day login streak', 'Star', 'consistency', 100, 'streak', 30),
('Balanced Lifestyle', 'Meet all daily goals for 14 days', 'Target', 'milestone', 150, 'streak', 14),
('Nutrition Guru', 'Accumulate 1000 points', 'Award', 'milestone', 200, 'total', 1000),
('Early Bird', 'Log breakfast before 9 AM for 7 days', 'Sunrise', 'consistency', 35, 'streak', 7)
ON CONFLICT (name) DO NOTHING;

-- Fix user_achievements table
CREATE TABLE IF NOT EXISTS public.user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id uuid REFERENCES public.achievements(id) ON DELETE CASCADE NOT NULL,
  earned_at timestamptz DEFAULT now(),
  progress integer DEFAULT 0
);

-- Enable RLS for user_achievements table
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- Fix RLS policies for user_achievements
DROP POLICY IF EXISTS "Users can view own achievements" ON public.user_achievements;
DROP POLICY IF EXISTS "System can insert achievements" ON public.user_achievements;

CREATE POLICY "Users can view own achievements" ON public.user_achievements FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own achievements" ON public.user_achievements FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own achievements" ON public.user_achievements FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own achievements" ON public.user_achievements FOR DELETE TO authenticated USING (auth.uid() = user_id);
