-- Comprehensive RLS policy fix for all user tables
-- This fixes the "FOR ALL" policies that cause RLS violations
-- Run this SQL in your Supabase SQL Editor

-- Fix user_progress table
DROP POLICY IF EXISTS "Users can manage own progress" ON public.user_progress;

CREATE POLICY "Users can view own progress" ON public.user_progress FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own progress" ON public.user_progress FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own progress" ON public.user_progress FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own progress" ON public.user_progress FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Fix community_recipes table
DROP POLICY IF EXISTS "Users can manage own recipes" ON public.community_recipes;

CREATE POLICY "Users can view public recipes" ON public.community_recipes FOR SELECT TO authenticated USING (is_public = true OR auth.uid() = user_id);
CREATE POLICY "Users can insert own recipes" ON public.community_recipes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own recipes" ON public.community_recipes FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own recipes" ON public.community_recipes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Fix recipe_ratings table
DROP POLICY IF EXISTS "Users can manage own ratings" ON public.recipe_ratings;

CREATE POLICY "Users can view all ratings" ON public.recipe_ratings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert own ratings" ON public.recipe_ratings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own ratings" ON public.recipe_ratings FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own ratings" ON public.recipe_ratings FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Fix meal_plans table
DROP POLICY IF EXISTS "Users can manage own meal plans" ON public.meal_plans;

CREATE POLICY "Users can view own meal plans" ON public.meal_plans FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own meal plans" ON public.meal_plans FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own meal plans" ON public.meal_plans FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own meal plans" ON public.meal_plans FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Fix user_streaks table
DROP POLICY IF EXISTS "Users can manage own streaks" ON public.user_streaks;

CREATE POLICY "Users can view own streaks" ON public.user_streaks FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own streaks" ON public.user_streaks FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own streaks" ON public.user_streaks FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own streaks" ON public.user_streaks FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Fix saved_meal_plans table (if it exists)
DROP POLICY IF EXISTS "Users can manage own saved meal plans" ON public.saved_meal_plans;

CREATE POLICY "Users can view own saved meal plans" ON public.saved_meal_plans FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own saved meal plans" ON public.saved_meal_plans FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own saved meal plans" ON public.saved_meal_plans FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own saved meal plans" ON public.saved_meal_plans FOR DELETE TO authenticated USING (auth.uid() = user_id);
