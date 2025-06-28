import React, { useState } from 'react'
import { AlertTriangle, Database, CheckCircle, Copy } from 'lucide-react'
import StackDepthErrorFix from './StackDepthErrorFix'

interface DatabaseSetupProps {
  onClose: () => void
}

const DatabaseSetup: React.FC<DatabaseSetupProps> = ({ onClose }) => {
  const [copied, setCopied] = useState(false)

  const migrationSQL = `-- Complete database migration script with Stack Depth Fix
-- Copy and paste this into your Supabase SQL Editor

-- STEP 1: Fix Stack Depth Error (if present)
-- Temporarily disable RLS to break any circular references
ALTER TABLE IF EXISTS public.user_preferences DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.saved_meal_plans DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.profiles DISABLE ROW LEVEL SECURITY;

-- Drop problematic policies
DROP POLICY IF EXISTS "Users can manage own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can manage own meal plans" ON public.saved_meal_plans;
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- STEP 2: Create missing tables
-- Create user_preferences table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  preference_type text NOT NULL CHECK (preference_type IN ('dietary_restriction', 'allergy', 'health_condition', 'food_preference', 'regional_preference', 'original_goal')),
  preference_value text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create saved_meal_plans table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.saved_meal_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  plan_type text NOT NULL CHECK (plan_type IN ('weekly_meal_plan', 'nutrition_strategy')),
  plan_content text NOT NULL,
  parsed_data jsonb DEFAULT '{}',
  is_active boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- STEP 3: Update goal constraints
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_goal_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_goal_check 
  CHECK (goal IN ('weight_loss', 'muscle_gain', 'maintenance', 'fat_loss_muscle_gain', 'athletic_performance', 'general_health'));

-- STEP 4: Enable RLS with safe policies
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create simple, non-recursive RLS policies
CREATE POLICY "users_own_preferences_policy" ON public.user_preferences
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "users_own_meal_plans_policy" ON public.saved_meal_plans
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "users_own_profile_policy" ON public.profiles
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_type ON public.user_preferences(user_id, preference_type);
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_preferences_unique ON public.user_preferences(user_id, preference_type, preference_value);
CREATE INDEX IF NOT EXISTS idx_saved_meal_plans_user_type ON public.saved_meal_plans(user_id, plan_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_saved_meal_plans_active ON public.saved_meal_plans(user_id, is_active) WHERE is_active = true;

-- Simple trigger without recursion risk
CREATE OR REPLACE FUNCTION simple_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_saved_meal_plans_updated_at ON public.saved_meal_plans;
CREATE TRIGGER simple_meal_plans_update_trigger
    BEFORE UPDATE ON public.saved_meal_plans
    FOR EACH ROW
    EXECUTE FUNCTION simple_update_timestamp();`

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(migrationSQL)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy: ', err)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Database className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Database Setup Required</h2>
          </div>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[70vh]">
          <StackDepthErrorFix />
          
          <div className="mb-6">
            <div className="flex items-center space-x-2 mb-4">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <p className="text-gray-700">
                The database tables are not set up properly, and there may be stack depth errors. Please run the migration script below.
              </p>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-blue-900 mb-2">This script will:</h3>
              <ul className="list-disc list-inside space-y-1 text-blue-800 text-sm">
                <li>Fix any PostgreSQL stack depth errors (code 54001)</li>
                <li>Create missing database tables safely</li>
                <li>Set up proper Row Level Security policies</li>
                <li>Update goal constraints to support all goal types</li>
                <li>Create necessary indexes for performance</li>
              </ul>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-green-900 mb-2">Steps to fix:</h3>
              <ol className="list-decimal list-inside space-y-2 text-blue-800">
                <li>Copy the SQL script below</li>
                <li>Go to your <a href="https://app.supabase.com" target="_blank" rel="noopener noreferrer" className="underline">Supabase Dashboard</a></li>
                <li>Navigate to SQL Editor</li>
                <li>Create a new query</li>
                <li>Paste the SQL script</li>
                <li>Run the query</li>
                <li>Come back and try creating your profile again</li>
              </ol>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg border">
            <div className="flex items-center justify-between p-3 border-b border-gray-200">
              <h3 className="font-medium text-gray-900">Migration SQL</h3>
              <button
                onClick={copyToClipboard}
                className="flex items-center space-x-2 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
              >
                {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                <span>{copied ? 'Copied!' : 'Copy SQL'}</span>
              </button>
            </div>
            <pre className="p-4 text-sm text-gray-800 overflow-x-auto whitespace-pre-wrap font-mono bg-gray-50">
              {migrationSQL}
            </pre>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DatabaseSetup
