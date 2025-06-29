-- IMPROVED RLS FIX for Recipe Operations (Deletion, Rating, etc.)
-- Run this in Supabase SQL Editor to fix recipe deletion and rating problems

-- STEP 1: Temporarily disable RLS on community_recipes and recipe_ratings
ALTER TABLE IF EXISTS public.community_recipes DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.recipe_ratings DISABLE ROW LEVEL SECURITY;

-- STEP 2: Drop existing policies to start fresh
DROP POLICY IF EXISTS "community_recipes_all_access" ON public.community_recipes;
DROP POLICY IF EXISTS "community_recipes_select" ON public.community_recipes;
DROP POLICY IF EXISTS "community_recipes_insert" ON public.community_recipes;
DROP POLICY IF EXISTS "community_recipes_update" ON public.community_recipes;
DROP POLICY IF EXISTS "community_recipes_delete" ON public.community_recipes;

DROP POLICY IF EXISTS "recipe_ratings_all_access" ON public.recipe_ratings;
DROP POLICY IF EXISTS "recipe_ratings_select" ON public.recipe_ratings;
DROP POLICY IF EXISTS "recipe_ratings_insert" ON public.recipe_ratings;
DROP POLICY IF EXISTS "recipe_ratings_update" ON public.recipe_ratings;
DROP POLICY IF EXISTS "recipe_ratings_delete" ON public.recipe_ratings;

-- STEP 3: Create recipe_ratings table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.recipe_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipe_id uuid NOT NULL REFERENCES public.community_recipes(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, recipe_id)
);

-- STEP 4: Re-enable RLS
ALTER TABLE public.community_recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_ratings ENABLE ROW LEVEL SECURITY;

-- STEP 5: Create proper user-scoped policies for community_recipes
-- Allow all authenticated users to view recipes
DROP POLICY IF EXISTS "community_recipes_select_policy" ON public.community_recipes;
CREATE POLICY "community_recipes_select_policy" 
ON public.community_recipes FOR SELECT 
TO authenticated 
USING (true);

-- Allow authenticated users to insert their own recipes
DROP POLICY IF EXISTS "community_recipes_insert_policy" ON public.community_recipes;
CREATE POLICY "community_recipes_insert_policy" 
ON public.community_recipes FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own recipes
DROP POLICY IF EXISTS "community_recipes_update_policy" ON public.community_recipes;
CREATE POLICY "community_recipes_update_policy" 
ON public.community_recipes FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own recipes
DROP POLICY IF EXISTS "community_recipes_delete_policy" ON public.community_recipes;
CREATE POLICY "community_recipes_delete_policy" 
ON public.community_recipes FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id);

-- STEP 6: Create proper user-scoped policies for recipe_ratings
-- Allow all authenticated users to view ratings
DROP POLICY IF EXISTS "recipe_ratings_select_policy" ON public.recipe_ratings;
CREATE POLICY "recipe_ratings_select_policy" 
ON public.recipe_ratings FOR SELECT 
TO authenticated 
USING (true);

-- Allow authenticated users to insert their own ratings
DROP POLICY IF EXISTS "recipe_ratings_insert_policy" ON public.recipe_ratings;
CREATE POLICY "recipe_ratings_insert_policy" 
ON public.recipe_ratings FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own ratings
DROP POLICY IF EXISTS "recipe_ratings_update_policy" ON public.recipe_ratings;
CREATE POLICY "recipe_ratings_update_policy" 
ON public.recipe_ratings FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own ratings
DROP POLICY IF EXISTS "recipe_ratings_delete_policy" ON public.recipe_ratings;
CREATE POLICY "recipe_ratings_delete_policy" 
ON public.recipe_ratings FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id);

-- STEP 7: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_recipe_ratings_recipe_id ON public.recipe_ratings(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_ratings_user_id ON public.recipe_ratings(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_recipe_ratings_unique ON public.recipe_ratings(user_id, recipe_id);

-- STEP 8: Create trigger for updated_at on recipe_ratings
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_recipe_ratings_updated_at ON public.recipe_ratings;
CREATE TRIGGER update_recipe_ratings_updated_at
    BEFORE UPDATE ON public.recipe_ratings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- STEP 9: Test the fix by checking if policies are working
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public' AND tablename IN ('community_recipes', 'recipe_ratings')
ORDER BY tablename, policyname;

-- SUCCESS MESSAGE
SELECT 'Improved RLS fix completed! Recipe deletion and rating should now work properly.' as status;
