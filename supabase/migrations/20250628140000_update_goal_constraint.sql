/*
  # Update constraints to support new goal types and original goal preference

  This migration:
  1. Updates the goal constraint in the profiles table to include new goal types
  2. Updates the user_preferences constraint to allow storing original goal values
*/

-- Drop the existing goal constraint
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_goal_check;

-- Add the updated goal constraint with all supported values
ALTER TABLE public.profiles ADD CONSTRAINT profiles_goal_check 
  CHECK (goal IN ('weight_loss', 'muscle_gain', 'maintenance', 'fat_loss_muscle_gain', 'athletic_performance', 'general_health'));

-- Update user_preferences constraint to include 'original_goal' 
ALTER TABLE public.user_preferences DROP CONSTRAINT IF EXISTS user_preferences_preference_type_check;

-- Add updated constraint for user_preferences
ALTER TABLE public.user_preferences ADD CONSTRAINT user_preferences_preference_type_check
  CHECK (preference_type IN ('dietary_restriction', 'allergy', 'health_condition', 'food_preference', 'regional_preference', 'original_goal'));
