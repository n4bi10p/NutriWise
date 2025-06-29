-- IMPROVED RLS FIX for Recipe Deletion Issues
-- Run this in Supabase SQL Editor to fix recipe deletion problems

-- STEP 1: Temporarily disable RLS on community_recipes
ALTER TABLE IF EXISTS public.community_recipes DISABLE ROW LEVEL SECURITY;

-- STEP 2: Drop existing policies to start fresh
DROP POLICY IF EXISTS "community_recipes_all_access" ON public.community_recipes;
DROP POLICY IF EXISTS "community_recipes_select" ON public.community_recipes;
DROP POLICY IF EXISTS "community_recipes_insert" ON public.community_recipes;
DROP POLICY IF EXISTS "community_recipes_update" ON public.community_recipes;
DROP POLICY IF EXISTS "community_recipes_delete" ON public.community_recipes;

-- STEP 3: Re-enable RLS
ALTER TABLE public.community_recipes ENABLE ROW LEVEL SECURITY;

-- STEP 4: Create proper user-scoped policies
-- Allow all authenticated users to view recipes
CREATE POLICY "community_recipes_select_policy" 
ON public.community_recipes FOR SELECT 
TO authenticated 
USING (true);

-- Allow authenticated users to insert their own recipes
CREATE POLICY "community_recipes_insert_policy" 
ON public.community_recipes FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own recipes
CREATE POLICY "community_recipes_update_policy" 
ON public.community_recipes FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own recipes
CREATE POLICY "community_recipes_delete_policy" 
ON public.community_recipes FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id);

-- STEP 5: Test the fix by checking if policies are working
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
WHERE schemaname = 'public' AND tablename = 'community_recipes'
ORDER BY tablename, policyname;

-- SUCCESS MESSAGE
SELECT 'Improved RLS fix completed! Recipe deletion should now work properly.' as status;
