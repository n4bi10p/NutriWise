-- Debug script to check RLS policies and data types for community_recipes deletion

-- Check current RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'community_recipes';

-- Check the data types of user_id columns
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'community_recipes' AND column_name = 'user_id';

-- Check some sample data to see user_id format
SELECT id, user_id, title, created_at 
FROM community_recipes 
LIMIT 5;

-- Check if current user matches any recipes (replace with actual user ID when testing)
-- SELECT auth.uid() as current_user;

-- Test the delete policy by trying to select recipes the current user should be able to delete
-- SELECT id, title, user_id, auth.uid() = user_id as can_delete
-- FROM community_recipes 
-- WHERE auth.uid() = user_id;
