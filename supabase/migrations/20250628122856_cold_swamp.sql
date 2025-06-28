/*
  # Update profiles table for comprehensive health data

  1. Schema Changes
    - Add allergies (jsonb array)
    - Add health_conditions (jsonb array) 
    - Add food_preferences (jsonb array)
    - Add activity_level (text with constraints)
    - Add sleep_hours (integer)
    - Add water_goal_ltr (decimal)
    - Add notes (text)
    - Update preferences structure
    - Update regional_preference with Indian states

  2. Security
    - Maintain existing RLS policies
    - Add validation constraints for new fields
*/

-- Add new columns to profiles table
DO $$
BEGIN
  -- Add allergies column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'allergies'
  ) THEN
    ALTER TABLE profiles ADD COLUMN allergies jsonb DEFAULT '[]'::jsonb;
  END IF;

  -- Add health_conditions column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'health_conditions'
  ) THEN
    ALTER TABLE profiles ADD COLUMN health_conditions jsonb DEFAULT '[]'::jsonb;
  END IF;

  -- Add food_preferences column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'food_preferences'
  ) THEN
    ALTER TABLE profiles ADD COLUMN food_preferences jsonb DEFAULT '[]'::jsonb;
  END IF;

  -- Add activity_level column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'activity_level'
  ) THEN
    ALTER TABLE profiles ADD COLUMN activity_level text DEFAULT 'moderately_active';
  END IF;

  -- Add sleep_hours column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'sleep_hours'
  ) THEN
    ALTER TABLE profiles ADD COLUMN sleep_hours integer DEFAULT 8;
  END IF;

  -- Add water_goal_ltr column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'water_goal_ltr'
  ) THEN
    ALTER TABLE profiles ADD COLUMN water_goal_ltr decimal(3,1) DEFAULT 2.5;
  END IF;

  -- Add notes column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'notes'
  ) THEN
    ALTER TABLE profiles ADD COLUMN notes text DEFAULT '';
  END IF;
END $$;

-- Add constraints for new fields
DO $$
BEGIN
  -- Activity level constraint
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'profiles_activity_level_check'
  ) THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_activity_level_check 
    CHECK (activity_level IN ('sedentary', 'lightly_active', 'moderately_active', 'very_active'));
  END IF;

  -- Sleep hours constraint
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'profiles_sleep_hours_check'
  ) THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_sleep_hours_check 
    CHECK (sleep_hours >= 1 AND sleep_hours <= 24);
  END IF;

  -- Water goal constraint
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'profiles_water_goal_check'
  ) THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_water_goal_check 
    CHECK (water_goal_ltr >= 0.5 AND water_goal_ltr <= 10.0);
  END IF;
END $$;