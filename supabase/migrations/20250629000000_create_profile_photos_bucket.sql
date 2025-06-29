-- Create storage bucket for profile photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-photos',
  'profile-photos',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
);

-- Create RLS policy for profile photos
CREATE POLICY "Users can upload their own profile photos" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'profile-photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own profile photos" ON storage.objects
FOR SELECT USING (
  bucket_id = 'profile-photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own profile photos" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'profile-photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own profile photos" ON storage.objects
FOR DELETE USING (
  bucket_id = 'profile-photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Add profile_photo_url column to profiles table if not exists
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_photo_url TEXT;
