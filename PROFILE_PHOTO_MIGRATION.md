# Database Migration Instructions

## Add Profile Photo Support

To enable profile photo functionality, you need to add the `profile_photo_url` column to your `profiles` table.

### Option 1: Run this SQL in your Supabase SQL Editor

```sql
-- Add profile_photo_url column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_photo_url TEXT;

-- Add comment to document the column  
COMMENT ON COLUMN profiles.profile_photo_url IS 'URL to the user profile photo stored in Supabase Storage';
```

### Option 2: Use Supabase CLI (if you have it set up)

```bash
# Make sure you're in the project directory
cd /path/to/your/project

# Apply the migration
supabase db push
```

### Option 3: Add manually via Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to "Table Editor" 
3. Select the "profiles" table
4. Click "Add Column"
5. Column name: `profile_photo_url`
6. Type: `text`
7. Allow nullable: Yes
8. Click "Save"

### Verify the column was added

Run this query to verify:
```sql
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name = 'profile_photo_url';
```

You should see one row returned with the column details.
