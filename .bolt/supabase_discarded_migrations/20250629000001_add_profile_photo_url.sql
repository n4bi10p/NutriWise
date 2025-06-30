-- Add profile_photo_url column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_photo_url TEXT;

-- Update the column to allow NULL values (it should already be nullable by default)
-- Add a comment to document the column
COMMENT ON COLUMN profiles.profile_photo_url IS 'URL to the user profile photo stored in Supabase Storage';
