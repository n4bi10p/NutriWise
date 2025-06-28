import React, { useState } from 'react'
import { AlertTriangle, Copy, CheckCircle } from 'lucide-react'

const StackDepthErrorFix: React.FC = () => {
  const [copied, setCopied] = useState(false)

  const emergencySQL = `-- EMERGENCY: Stack Depth Error Fix
-- Run this immediately if you're getting stack depth errors

-- Disable all RLS temporarily to stop the recursion
ALTER TABLE IF EXISTS public.user_preferences DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.saved_meal_plans DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.profiles DISABLE ROW LEVEL SECURITY;

-- Drop ALL policies that might be causing recursion
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
                      pol.policyname, pol.schemaname, pol.tablename);
    END LOOP;
END $$;

-- Re-enable RLS with minimal policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_basic_policy" ON public.profiles FOR ALL TO authenticated USING (true);

-- This gives full access to authenticated users temporarily
-- Run the main migration script after this emergency fix`

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(emergencySQL)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy: ', err)
    }
  }

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
      <div className="flex items-start space-x-3">
        <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
        <div className="flex-grow">
          <h3 className="font-semibold text-red-900 mb-2">Emergency: Stack Depth Error Fix</h3>
          <p className="text-red-800 text-sm mb-3">
            If you're still getting "stack depth limit exceeded" errors, run this emergency SQL first:
          </p>
          
          <div className="bg-white rounded border p-3 mb-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Emergency SQL</span>
              <button
                onClick={copyToClipboard}
                className="flex items-center space-x-1 bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700 transition-colors"
              >
                {copied ? <CheckCircle className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
            <pre className="text-xs text-gray-700 overflow-x-auto whitespace-pre-wrap">
              {emergencySQL}
            </pre>
          </div>
          
          <p className="text-red-800 text-xs">
            After running this, refresh the page and then run the main migration script.
          </p>
        </div>
      </div>
    </div>
  )
}

export default StackDepthErrorFix
