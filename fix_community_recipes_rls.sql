-- Fix RLS policies for community_recipes table
-- This ensures users can insert their own recipes

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Users can view public recipes" ON community_recipes;
DROP POLICY IF EXISTS "Users can manage own recipes" ON community_recipes;

-- Recreate policies with proper permissions
CREATE POLICY "Users can view public recipes"
  ON community_recipes
  FOR SELECT
  TO authenticated
  USING (is_public = true OR auth.uid() = user_id);

CREATE POLICY "Users can insert own recipes"
  ON community_recipes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own recipes"
  ON community_recipes
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own recipes"
  ON community_recipes
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
