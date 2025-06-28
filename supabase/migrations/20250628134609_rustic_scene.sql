-- Create user_preferences table to store all preference data separately
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  preference_type text NOT NULL CHECK (preference_type IN ('dietary_restriction', 'allergy', 'health_condition', 'food_preference', 'regional_preference')),
  preference_value text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_preferences
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

-- Migrate existing data from profiles table if complex JSON fields exist
DO $$
BEGIN
  -- Check if preferences column exists and migrate data
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'preferences' AND table_schema = 'public') THEN
    -- Migrate dietary restrictions
    INSERT INTO public.user_preferences (user_id, preference_type, preference_value)
    SELECT 
      user_id, 
      'dietary_restriction', 
      unnest(COALESCE((preferences->>'dietary_restrictions')::text[], ARRAY[]::text[]))
    FROM public.profiles 
    WHERE preferences->>'dietary_restrictions' IS NOT NULL
    ON CONFLICT DO NOTHING;

    -- Migrate regional preferences
    INSERT INTO public.user_preferences (user_id, preference_type, preference_value)
    SELECT 
      user_id, 
      'regional_preference', 
      preferences->>'regional_preference'
    FROM public.profiles 
    WHERE preferences->>'regional_preference' IS NOT NULL AND preferences->>'regional_preference' != ''
    ON CONFLICT DO NOTHING;
  END IF;

  -- Migrate allergies if column exists
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'allergies' AND table_schema = 'public') THEN
    INSERT INTO public.user_preferences (user_id, preference_type, preference_value)
    SELECT 
      user_id, 
      'allergy', 
      unnest(COALESCE(allergies, ARRAY[]::text[]))
    FROM public.profiles 
    WHERE allergies IS NOT NULL AND array_length(allergies, 1) > 0
    ON CONFLICT DO NOTHING;
  END IF;

  -- Migrate health conditions if column exists
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'health_conditions' AND table_schema = 'public') THEN
    INSERT INTO public.user_preferences (user_id, preference_type, preference_value)
    SELECT 
      user_id, 
      'health_condition', 
      unnest(COALESCE(health_conditions, ARRAY[]::text[]))
    FROM public.profiles 
    WHERE health_conditions IS NOT NULL AND array_length(health_conditions, 1) > 0
    ON CONFLICT DO NOTHING;
  END IF;

  -- Migrate food preferences if column exists
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'food_preferences' AND table_schema = 'public') THEN
    INSERT INTO public.user_preferences (user_id, preference_type, preference_value)
    SELECT 
      user_id, 
      'food_preference', 
      unnest(COALESCE(food_preferences, ARRAY[]::text[]))
    FROM public.profiles 
    WHERE food_preferences IS NOT NULL AND array_length(food_preferences, 1) > 0
    ON CONFLICT DO NOTHING;
  END IF;
END $$;