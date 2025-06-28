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
