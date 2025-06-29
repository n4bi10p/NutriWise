-- Fixed community_recipes table with correct data types
-- Run this SQL in your Supabase SQL Editor

-- Create community_recipes table if it doesn't exist with correct column types
CREATE TABLE IF NOT EXISTS public.community_recipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  ingredients jsonb NOT NULL,  -- Changed to jsonb to match existing schema
  instructions text NOT NULL,
  prep_time integer,
  cook_time integer,
  servings integer NOT NULL,
  calories_per_serving integer,
  protein_per_serving integer,
  tags jsonb,  -- Changed to jsonb to match existing schema
  difficulty text NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  cuisine_type text,
  dietary_tags jsonb,  -- Changed to jsonb to match existing schema
  image_url text,
  is_public boolean DEFAULT true,
  rating_average numeric(3,2) DEFAULT 0,
  rating_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS for community_recipes table
ALTER TABLE public.community_recipes ENABLE ROW LEVEL SECURITY;

-- Fix RLS policies for community_recipes
DROP POLICY IF EXISTS "Users can view public recipes" ON public.community_recipes;
DROP POLICY IF EXISTS "Users can insert own recipes" ON public.community_recipes;
DROP POLICY IF EXISTS "Users can update own recipes" ON public.community_recipes;
DROP POLICY IF EXISTS "Users can delete own recipes" ON public.community_recipes;

CREATE POLICY "Users can view public recipes" ON public.community_recipes FOR SELECT TO authenticated USING (is_public = true OR auth.uid() = user_id);
CREATE POLICY "Users can insert own recipes" ON public.community_recipes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own recipes" ON public.community_recipes FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own recipes" ON public.community_recipes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Create recipe_ratings table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.recipe_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipe_id uuid REFERENCES public.community_recipes(id) ON DELETE CASCADE NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS for recipe_ratings table
ALTER TABLE public.recipe_ratings ENABLE ROW LEVEL SECURITY;

-- Fix RLS policies for recipe_ratings
DROP POLICY IF EXISTS "Users can view all ratings" ON public.recipe_ratings;
DROP POLICY IF EXISTS "Users can insert own ratings" ON public.recipe_ratings;
DROP POLICY IF EXISTS "Users can update own ratings" ON public.recipe_ratings;
DROP POLICY IF EXISTS "Users can delete own ratings" ON public.recipe_ratings;

CREATE POLICY "Users can view all ratings" ON public.recipe_ratings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert own ratings" ON public.recipe_ratings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own ratings" ON public.recipe_ratings FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own ratings" ON public.recipe_ratings FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Insert sample recipes with correct JSONB format
INSERT INTO public.community_recipes (
  user_id, title, description, ingredients, instructions, prep_time, cook_time, 
  servings, calories_per_serving, protein_per_serving, tags, difficulty, 
  cuisine_type, dietary_tags, is_public
) VALUES 
(
  (SELECT id FROM auth.users LIMIT 1),
  'Healthy Quinoa Bowl',
  'A nutritious and colorful quinoa bowl packed with vegetables and protein',
  '["1 cup quinoa", "2 cups vegetable broth", "1 avocado", "1 cup cherry tomatoes", "1 cucumber", "2 tbsp olive oil", "salt and pepper"]'::jsonb,
  'Cook quinoa in vegetable broth according to package directions. Dice vegetables. Mix everything together with olive oil, salt and pepper. Serve chilled or at room temperature.',
  15,
  20,
  2,
  450,
  15,
  '["healthy", "vegetarian", "gluten-free"]'::jsonb,
  'easy',
  'mediterranean',
  '["vegetarian", "gluten-free", "healthy"]'::jsonb,
  true
),
(
  (SELECT id FROM auth.users LIMIT 1),
  'Grilled Chicken Salad',
  'Fresh and light grilled chicken salad with mixed greens',
  '["2 chicken breasts", "4 cups mixed greens", "1 cup cherry tomatoes", "1/2 red onion", "2 tbsp balsamic vinegar", "1 tbsp olive oil"]'::jsonb,
  'Season chicken breasts with salt and pepper. Grill for 6-7 minutes per side until cooked through. Slice and serve over mixed greens with vegetables and balsamic vinegar.',
  10,
  15,
  2,
  320,
  35,
  '["protein", "low-carb", "healthy"]'::jsonb,
  'easy',
  'american',
  '["high-protein", "low-carb"]'::jsonb,
  true
),
(
  (SELECT id FROM auth.users LIMIT 1),
  'Vegetable Stir Fry',
  'Quick and colorful vegetable stir fry with ginger and garlic',
  '["2 cups broccoli florets", "1 bell pepper", "1 carrot", "2 cloves garlic", "1 inch ginger", "2 tbsp soy sauce", "1 tbsp sesame oil"]'::jsonb,
  'Heat oil in a wok. Add garlic and ginger, stir for 30 seconds. Add vegetables and stir fry for 3-4 minutes. Add soy sauce and sesame oil. Serve hot.',
  5,
  8,
  2,
  180,
  8,
  '["vegetarian", "vegan", "quick"]'::jsonb,
  'easy',
  'asian',
  '["vegan", "vegetarian", "gluten-free"]'::jsonb,
  true
)
ON CONFLICT DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_community_recipes_user ON public.community_recipes(user_id);
CREATE INDEX IF NOT EXISTS idx_community_recipes_public ON public.community_recipes(is_public);
CREATE INDEX IF NOT EXISTS idx_community_recipes_rating ON public.community_recipes(rating_average DESC);
CREATE INDEX IF NOT EXISTS idx_recipe_ratings_recipe ON public.recipe_ratings(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_ratings_user ON public.recipe_ratings(user_id);
