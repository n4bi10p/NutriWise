#!/usr/bin/env node

/**
 * Migration runner script to update the goal constraint
 * Run this with: node run-migration.js
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Please check your .env file.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function runMigration() {
  try {
    console.log('Running migration to fix grocery lists RLS policies...')
    
    // Read the migration file
    const migrationPath = resolve('./supabase/migrations/20250628140005_fix_grocery_lists_rls.sql')
    const migrationSQL = readFileSync(migrationPath, 'utf8')
    
    // Extract just the SQL commands (remove comments)
    const sqlCommands = migrationSQL
      .split('\n')
      .filter(line => !line.trim().startsWith('--') && !line.trim().startsWith('/*') && !line.trim().startsWith('*/') && line.trim() !== '')
      .join('\n')
    
    console.log('Executing SQL:', sqlCommands)
    
    // Since Supabase doesn't have exec_sql RPC by default, 
    // we'll output the SQL for manual execution
    console.log('\n=== MIGRATION SQL TO RUN MANUALLY ===')
    console.log('Copy and paste this SQL into your Supabase SQL Editor:\n')
    console.log(sqlCommands)
    console.log('\n=== END OF MIGRATION SQL ===')
    
    console.log('\nTo apply this migration:')
    console.log('1. Go to your Supabase Dashboard')
    console.log('2. Navigate to SQL Editor')
    console.log('3. Create a new query')
    console.log('4. Paste the SQL above')
    console.log('5. Run the query')
    
  } catch (error) {
    console.error('Error running migration:', error)
    process.exit(1)
  }
}

runMigration()
