-- 1. Add is_public column
ALTER TABLE recipes 
ADD COLUMN is_public BOOLEAN DEFAULT false;

-- 2. Drop existing Read policy (which was owner-only)
DROP POLICY IF EXISTS "Users can read own recipes" ON recipes;

-- 3. Create new Read policy (Public OR Owner)
CREATE POLICY "Public recipes are visible to everyone" 
ON recipes FOR SELECT 
USING (is_public = true OR auth.uid() = user_id);

-- 4. Ensure Update/Delete remain Owner-only (already set, but good to be sure)
-- (No change needed if existing policies checked auth.uid() = user_id)
