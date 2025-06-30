-- Fix RLS policies for grocery_lists table
-- Drop existing policy and create separate, explicit policies

DROP POLICY IF EXISTS "Users can manage own grocery lists" ON grocery_lists;

-- Policy for SELECT (reading grocery lists)
CREATE POLICY "Users can view own grocery lists"
  ON grocery_lists
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR is_shared = true);

-- Policy for INSERT (creating new grocery lists)
CREATE POLICY "Users can insert own grocery lists"
  ON grocery_lists
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy for UPDATE (modifying grocery lists)
CREATE POLICY "Users can update own grocery lists"
  ON grocery_lists
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy for DELETE (removing grocery lists)
CREATE POLICY "Users can delete own grocery lists"
  ON grocery_lists
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
