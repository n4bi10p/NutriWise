/*
  # Comprehensive Features Migration

  1. New Tables
    - `user_progress` - Daily nutrition and activity tracking
    - `achievements` - Achievement definitions and requirements
    - `user_achievements` - User achievement progress and completions
    - `community_recipes` - User-shared recipes with ratings
    - `recipe_ratings` - Recipe rating and review system
    - `grocery_lists` - Smart grocery list management
    - `meal_plans` - Saved meal plans and templates
    - `user_streaks` - Streak tracking for various activities
    - `notifications` - User notification system

  2. Profile Enhancements
    - Added gamification fields (points, level, streak_days)
    - Added notification preferences
    - Added last login tracking

  3. Security
    - Enable RLS on all new tables
    - Add appropriate policies for data access
    - Create performance indexes

  4. Functions & Triggers
    - Automatic recipe rating updates
    - User streak and points calculation
    - Achievement progress tracking
*/

-- Update profiles table with new fields
DO $$
BEGIN
  -- Add new columns if they don't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'points') THEN
    ALTER TABLE profiles ADD COLUMN points integer DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'level') THEN
    ALTER TABLE profiles ADD COLUMN level integer DEFAULT 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'streak_days') THEN
    ALTER TABLE profiles ADD COLUMN streak_days integer DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'last_login') THEN
    ALTER TABLE profiles ADD COLUMN last_login timestamptz DEFAULT now();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'notification_preferences') THEN
    ALTER TABLE profiles ADD COLUMN notification_preferences jsonb DEFAULT '{"daily_reminders": true, "achievement_alerts": true, "community_updates": false}'::jsonb;
  END IF;
END $$;

-- User Progress Tracking
CREATE TABLE IF NOT EXISTS user_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  calories_consumed integer DEFAULT 0,
  protein_consumed integer DEFAULT 0,
  water_consumed numeric(3,1) DEFAULT 0,
  meals_logged integer DEFAULT 0,
  exercise_minutes integer DEFAULT 0,
  weight numeric(5,2),
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Achievements System
CREATE TABLE IF NOT EXISTS achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL,
  category text NOT NULL CHECK (category IN ('nutrition', 'consistency', 'community', 'milestone')),
  points integer NOT NULL DEFAULT 10,
  requirement_type text NOT NULL CHECK (requirement_type IN ('streak', 'total', 'single_day', 'community')),
  requirement_value integer NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- User Achievements
CREATE TABLE IF NOT EXISTS user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  achievement_id uuid REFERENCES achievements(id) ON DELETE CASCADE NOT NULL,
  earned_at timestamptz DEFAULT now(),
  progress integer DEFAULT 0,
  UNIQUE(user_id, achievement_id)
);

-- Community Recipes
CREATE TABLE IF NOT EXISTS community_recipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  ingredients jsonb NOT NULL DEFAULT '[]'::jsonb,
  instructions text NOT NULL,
  prep_time integer, -- minutes
  cook_time integer, -- minutes
  servings integer DEFAULT 1,
  calories_per_serving integer,
  protein_per_serving integer,
  tags jsonb DEFAULT '[]'::jsonb,
  difficulty text CHECK (difficulty IN ('easy', 'medium', 'hard')) DEFAULT 'medium',
  cuisine_type text,
  dietary_tags jsonb DEFAULT '[]'::jsonb, -- vegetarian, vegan, gluten-free, etc.
  image_url text,
  is_public boolean DEFAULT true,
  rating_average numeric(2,1) DEFAULT 0,
  rating_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Recipe Ratings
CREATE TABLE IF NOT EXISTS recipe_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  recipe_id uuid REFERENCES community_recipes(id) ON DELETE CASCADE NOT NULL,
  rating integer CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  review text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, recipe_id)
);

-- Grocery Lists
CREATE TABLE IF NOT EXISTS grocery_lists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_template boolean DEFAULT false,
  is_shared boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Saved Meal Plans
CREATE TABLE IF NOT EXISTS meal_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  plan_data jsonb NOT NULL,
  week_start_date date,
  is_active boolean DEFAULT false,
  is_template boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- User Streaks
CREATE TABLE IF NOT EXISTS user_streaks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  streak_type text NOT NULL CHECK (streak_type IN ('daily_login', 'meal_logging', 'water_goal', 'calorie_goal', 'exercise')),
  current_streak integer DEFAULT 0,
  longest_streak integer DEFAULT 0,
  last_activity_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, streak_type)
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL CHECK (type IN ('achievement', 'reminder', 'community', 'system')),
  is_read boolean DEFAULT false,
  action_url text,
  created_at timestamptz DEFAULT now()
);

-- Insert default achievements
INSERT INTO achievements (name, description, icon, category, points, requirement_type, requirement_value) VALUES
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
ON CONFLICT DO NOTHING;

-- Enable RLS
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE grocery_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_progress
CREATE POLICY "Users can manage own progress"
  ON user_progress
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for achievements (read-only for all authenticated users)
CREATE POLICY "Achievements are readable by all"
  ON achievements
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- RLS Policies for user_achievements
CREATE POLICY "Users can view own achievements"
  ON user_achievements
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert achievements"
  ON user_achievements
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for community_recipes
CREATE POLICY "Users can view public recipes"
  ON community_recipes
  FOR SELECT
  TO authenticated
  USING (is_public = true OR auth.uid() = user_id);

CREATE POLICY "Users can manage own recipes"
  ON community_recipes
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for recipe_ratings
CREATE POLICY "Users can view all ratings"
  ON recipe_ratings
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage own ratings"
  ON recipe_ratings
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for grocery_lists
CREATE POLICY "Users can manage own grocery lists"
  ON grocery_lists
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id OR is_shared = true)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for meal_plans
CREATE POLICY "Users can manage own meal plans"
  ON meal_plans
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for user_streaks
CREATE POLICY "Users can manage own streaks"
  ON user_streaks
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for notifications
CREATE POLICY "Users can view own notifications"
  ON notifications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON notifications
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_progress_user_date ON user_progress(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_community_recipes_public ON community_recipes(is_public, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_recipes_rating ON community_recipes(rating_average DESC);
CREATE INDEX IF NOT EXISTS idx_recipe_ratings_recipe ON recipe_ratings(recipe_id);
CREATE INDEX IF NOT EXISTS idx_grocery_lists_user ON grocery_lists(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_meal_plans_user ON meal_plans(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_streaks_user ON user_streaks(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read, created_at DESC);

-- Function to update recipe ratings
CREATE OR REPLACE FUNCTION update_recipe_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE community_recipes 
  SET 
    rating_average = (
      SELECT ROUND(AVG(rating)::numeric, 1) 
      FROM recipe_ratings 
      WHERE recipe_id = COALESCE(NEW.recipe_id, OLD.recipe_id)
    ),
    rating_count = (
      SELECT COUNT(*) 
      FROM recipe_ratings 
      WHERE recipe_id = COALESCE(NEW.recipe_id, OLD.recipe_id)
    )
  WHERE id = COALESCE(NEW.recipe_id, OLD.recipe_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to update recipe ratings
DROP TRIGGER IF EXISTS trigger_update_recipe_rating ON recipe_ratings;
CREATE TRIGGER trigger_update_recipe_rating
  AFTER INSERT OR UPDATE OR DELETE ON recipe_ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_recipe_rating();

-- Function to update user streaks and points
CREATE OR REPLACE FUNCTION update_user_streaks_and_points()
RETURNS TRIGGER AS $$
DECLARE
  today_date date := CURRENT_DATE;
  yesterday_date date := CURRENT_DATE - INTERVAL '1 day';
  streak_record RECORD;
  points_to_add integer := 0;
BEGIN
  -- Update daily login streak
  INSERT INTO user_streaks (user_id, streak_type, current_streak, longest_streak, last_activity_date)
  VALUES (NEW.user_id, 'daily_login', 1, 1, today_date)
  ON CONFLICT (user_id, streak_type) DO UPDATE SET
    current_streak = CASE 
      WHEN user_streaks.last_activity_date = yesterday_date THEN user_streaks.current_streak + 1
      WHEN user_streaks.last_activity_date = today_date THEN user_streaks.current_streak
      ELSE 1
    END,
    longest_streak = GREATEST(user_streaks.longest_streak, 
      CASE 
        WHEN user_streaks.last_activity_date = yesterday_date THEN user_streaks.current_streak + 1
        WHEN user_streaks.last_activity_date = today_date THEN user_streaks.current_streak
        ELSE 1
      END
    ),
    last_activity_date = today_date,
    updated_at = now();

  -- Award points for daily login (5 points)
  IF OLD IS NULL OR OLD.last_login::date < today_date THEN
    points_to_add := points_to_add + 5;
  END IF;

  -- Update profile with new points and streak
  UPDATE profiles 
  SET 
    points = points + points_to_add,
    streak_days = (
      SELECT current_streak 
      FROM user_streaks 
      WHERE user_id = NEW.user_id AND streak_type = 'daily_login'
    ),
    last_login = now()
  WHERE user_id = NEW.user_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update streaks on profile update
DROP TRIGGER IF EXISTS trigger_update_user_streaks ON profiles;
CREATE TRIGGER trigger_update_user_streaks
  AFTER UPDATE OF last_login ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_user_streaks_and_points();