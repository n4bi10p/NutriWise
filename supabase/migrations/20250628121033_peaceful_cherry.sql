/*
  # Create profiles table for nutrition app

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `full_name` (text)
      - `age` (integer)
      - `gender` (text with constraints)
      - `height` (integer in cm)
      - `weight` (integer in kg)
      - `goal` (text with constraints)
      - `preferences` (jsonb for dietary restrictions and regional preferences)
      - `calorie_target` (integer)
      - `protein_target` (integer)
      - `theme` (text with constraints)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `profiles` table
    - Add policies for authenticated users to manage their own data
*/

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name text NOT NULL,
  age integer NOT NULL CHECK (age > 0 AND age < 150),
  gender text NOT NULL CHECK (gender IN ('male', 'female', 'other')),
  height integer NOT NULL CHECK (height > 0 AND height < 300),
  weight integer NOT NULL CHECK (weight > 0 AND weight < 500),
  goal text NOT NULL CHECK (goal IN ('weight_loss', 'muscle_gain', 'maintenance')),
  preferences jsonb DEFAULT '{"dietary_restrictions": [], "regional_preference": ""}',
  calorie_target integer NOT NULL CHECK (calorie_target > 0),
  protein_target integer NOT NULL CHECK (protein_target > 0),
  theme text DEFAULT 'light' CHECK (theme IN ('light', 'dark')),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS profiles_user_id_idx ON profiles(user_id);