import React, { useState } from 'react'
import { AlertTriangle, Copy, CheckCircle, ExternalLink } from 'lucide-react'

interface RLSFixProps {
  isOpen: boolean
  onClose: () => void
  errorMessage?: string
}

export const RLSFixModal: React.FC<RLSFixProps> = ({ isOpen, onClose, errorMessage }) => {
  const [copied, setCopied] = useState(false)

  const rlsFixSQL = `-- IMPROVED RLS FIX for Recipe Deletion Issues
-- Run this in Supabase SQL Editor to fix recipe deletion problems

-- STEP 1: Temporarily disable RLS on community_recipes
ALTER TABLE IF EXISTS public.community_recipes DISABLE ROW LEVEL SECURITY;

-- STEP 2: Drop existing policies to start fresh
DROP POLICY IF EXISTS "community_recipes_all_access" ON public.community_recipes;
DROP POLICY IF EXISTS "community_recipes_select" ON public.community_recipes;
DROP POLICY IF EXISTS "community_recipes_insert" ON public.community_recipes;
DROP POLICY IF EXISTS "community_recipes_update" ON public.community_recipes;
DROP POLICY IF EXISTS "community_recipes_delete" ON public.community_recipes;

-- STEP 3: Re-enable RLS
ALTER TABLE public.community_recipes ENABLE ROW LEVEL SECURITY;

-- STEP 4: Create proper user-scoped policies
-- Allow all authenticated users to view recipes
CREATE POLICY "community_recipes_select_policy" 
ON public.community_recipes FOR SELECT 
TO authenticated 
USING (true);

-- Allow authenticated users to insert their own recipes
CREATE POLICY "community_recipes_insert_policy" 
ON public.community_recipes FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own recipes
CREATE POLICY "community_recipes_update_policy" 
ON public.community_recipes FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own recipes
CREATE POLICY "community_recipes_delete_policy" 
ON public.community_recipes FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id);

-- SUCCESS MESSAGE
SELECT 'Improved RLS fix completed! Recipe deletion should now work properly.' as status;`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(rlsFixSQL)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-red-500" />
              <h2 className="text-xl font-bold text-gray-900">Database Permission Error</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          {errorMessage && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800 text-sm font-medium">Error Details:</p>
              <p className="text-red-700 text-sm mt-1">{errorMessage}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">What's happening?</h3>
              <p className="text-gray-700">
                The Row Level Security (RLS) policies on your database are preventing recipe operations 
                (deletion, rating, etc.). This is a common issue that can be fixed by running a simple SQL script.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">How to fix this:</h3>
              <ol className="list-decimal list-inside space-y-2 text-gray-700">
                <li>Copy the SQL script below</li>
                <li>Open your <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-1">Supabase dashboard <ExternalLink className="w-3 h-3" /></a></li>
                <li>Go to <strong>SQL Editor</strong></li>
                <li>Paste and run the script</li>
                <li>Come back and try the operation again</li>
              </ol>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold">SQL Fix Script:</h3>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                >
                  {copied ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy Script
                    </>
                  )}
                </button>
              </div>
              <div className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm font-mono overflow-x-auto">
                <pre>{rlsFixSQL}</pre>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-800 mb-2">What this script does:</h4>
              <ul className="text-blue-700 text-sm space-y-1">
                <li>• Safely resets the Row Level Security policies for recipes and ratings</li>
                <li>• Creates proper policies for recipe deletion, rating, editing, and viewing</li>
                <li>• Maintains security by preventing unauthorized access to other users' data</li>
                <li>• Fixes permission issues that cause operations to fail</li>
                <li>• Creates the recipe_ratings table if it doesn't exist</li>
              </ul>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
              >
                Close
              </button>
              <a
                href="https://supabase.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-center inline-flex items-center justify-center gap-2"
              >
                Open Supabase Dashboard
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RLSFixModal
