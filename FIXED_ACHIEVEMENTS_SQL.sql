-- Fix achievements table with proper unique constraint
-- Run this SQL in your Supabase SQL Editor

-- First, ensure the achievements table exists with proper constraints
CREATE TABLE IF NOT EXISTS public.achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,  -- Add UNIQUE constraint here
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

-- Clear any existing achievements first to avoid conflicts
DELETE FROM public.achievements;

-- Insert default achievements (now with unique constraint in place)
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
('Early Bird', 'Log breakfast before 9 AM for 7 days', 'Sunrise', 'consistency', 35, 'streak', 7);

-- Ensure user_achievements table exists
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
DROP POLICY IF EXISTS "Users can insert own achievements" ON public.user_achievements;
DROP POLICY IF EXISTS "Users can update own achievements" ON public.user_achievements;
DROP POLICY IF EXISTS "Users can delete own achievements" ON public.user_achievements;

CREATE POLICY "Users can view own achievements" ON public.user_achievements FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own achievements" ON public.user_achievements FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own achievements" ON public.user_achievements FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own achievements" ON public.user_achievements FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_achievements_category ON public.achievements(category);
CREATE INDEX IF NOT EXISTS idx_achievements_is_active ON public.achievements(is_active);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON public.user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement ON public.user_achievements(achievement_id);
