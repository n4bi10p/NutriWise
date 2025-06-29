-- Fix the foreign key relationship and profiles table for community recipes
-- Run this SQL in your Supabase SQL Editor

-- Ensure profiles table exists and has proper structure
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  full_name text NOT NULL,
  age integer,
  gender text CHECK (gender IN ('male', 'female', 'other')),
  height integer,
  weight integer,
  goal text CHECK (goal IN ('weight_loss', 'muscle_gain', 'maintenance', 'fat_loss_muscle_gain', 'athletic_performance', 'general_health')),
  activity_level text CHECK (activity_level IN ('sedentary', 'lightly_active', 'moderately_active', 'very_active')),
  sleep_hours integer,
  water_goal_ltr numeric(3,1),
  notes text,
  calorie_target integer,
  protein_target integer,
  theme text DEFAULT 'light' CHECK (theme IN ('light', 'dark')),
  points integer DEFAULT 0,
  level integer DEFAULT 1,
  streak_days integer DEFAULT 0,
  last_login timestamptz DEFAULT now(),
  notification_preferences jsonb DEFAULT '{"daily_reminders": true, "achievement_alerts": true, "community_updates": true}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Ensure community_recipes table has proper foreign key
ALTER TABLE public.community_recipes 
DROP CONSTRAINT IF EXISTS community_recipes_user_id_fkey;

ALTER TABLE public.community_recipes 
ADD CONSTRAINT community_recipes_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create a function to get user's display name
CREATE OR REPLACE FUNCTION get_user_display_name(user_uuid uuid)
RETURNS text AS $$
DECLARE
  display_name text;
BEGIN
  SELECT full_name INTO display_name
  FROM public.profiles
  WHERE user_id = user_uuid;
  
  RETURN COALESCE(display_name, 'Anonymous');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Test the setup by creating a sample profile for the first user (if it doesn't exist)
INSERT INTO public.profiles (user_id, full_name, age, gender, height, weight, goal, activity_level, sleep_hours, water_goal_ltr, calorie_target, protein_target)
SELECT 
  id,
  'Sample User',
  30,
  'other',
  170,
  70,
  'general_health',
  'moderately_active',
  8,
  2.5,
  2000,
  150
FROM auth.users 
WHERE id NOT IN (SELECT user_id FROM public.profiles)
LIMIT 1
ON CONFLICT (user_id) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_community_recipes_user_lookup ON public.community_recipes(user_id, is_public);
