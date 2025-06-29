-- Quick fix for user_progress RLS policy error
-- Run this SQL in your Supabase SQL Editor

-- Drop the existing overly restrictive policy
DROP POLICY IF EXISTS "Users can manage own progress" ON public.user_progress;

-- Create separate, explicit policies for each operation

-- Policy for SELECT (reading user progress)
CREATE POLICY "Users can view own progress"
  ON public.user_progress
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy for INSERT (creating new progress entries) - THIS IS THE KEY FIX
CREATE POLICY "Users can insert own progress"
  ON public.user_progress
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy for UPDATE (modifying progress entries)
CREATE POLICY "Users can update own progress"
  ON public.user_progress
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy for DELETE (removing progress entries)
CREATE POLICY "Users can delete own progress"
  ON public.user_progress
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
