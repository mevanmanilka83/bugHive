# Database Migration Instructions

## How to Add Views Column to Supabase

The application now tracks view counts for bugs and solutions, but the database schema needs to be updated.

### Option 1: Using Supabase Dashboard (Easiest)

1. Go to your Supabase dashboard: https://app.supabase.com
2. Select your project
3. Go to the **SQL Editor** section
4. Create a new query
5. Copy and paste the following SQL:

```sql
-- Add views column to bugs table
ALTER TABLE bugs ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0;

-- Add views column to bug_solution_details table
ALTER TABLE bug_solution_details ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0;
```

6. Click **Run** to execute the query
7. You should see a success message

### Option 2: Using Node.js Script

If you want to automate this, you can run:

```bash
node scripts/apply-migration.js
```

Make sure your environment variables are set:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

### What This Does

- Adds a `views` INTEGER column with default value 0 to the `bugs` table
- Adds a `views` INTEGER column with default value 0 to the `bug_solution_details` table

Once applied:
- Every time a user visits a bug detail page, the view count increases by 1
- Every time a user visits a solution detail page, the view count increases by 1
- The components automatically display these view counts
- The "Most Viewed" sort option will work correctly

### Verification

After running the migration, you can verify it worked by:

1. Going to the Table Editor in Supabase
2. Checking the `bugs` table - you should see a `views` column
3. Checking the `bug_solution_details` table - you should see a `views` column

Both columns should have type `int8` (64-bit integer) and default value `0`.
