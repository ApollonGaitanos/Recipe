-- COMPREHENSIVE REPAIR FOR LIKES SYSTEM
-- This script will:
-- 1. Reset the trigger logic to be 100% sure it works (SECURITY DEFINER).
-- 2. Recalculate ALL like counts from scratch to fix the "Zero" issue.
-- 3. Verify RLS policies.

-- 1. Drop old text/logic to be clean
DROP TRIGGER IF EXISTS on_like_change ON likes;
DROP FUNCTION IF EXISTS update_likes_count();

-- 2. Create the robust function (Admin Level Permissions)
CREATE OR REPLACE FUNCTION update_likes_count()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE recipes SET likes_count = likes_count + 1 WHERE id = NEW.recipe_id;
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE recipes SET likes_count = likes_count - 1 WHERE id = OLD.recipe_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 3. Attach Trigger
CREATE TRIGGER on_like_change
AFTER INSERT OR DELETE ON likes
FOR EACH ROW EXECUTE FUNCTION update_likes_count();

-- 4. SELF-HEALING: Recalculate all counts right now
-- This fixes any mismatch where the counter stayed 0 but likes existed.
UPDATE recipes
SET likes_count = (
    SELECT count(*)
    FROM likes
    WHERE likes.recipe_id = recipes.id
);

-- 5. Ensure NULLs are 0 (Just in case)
UPDATE recipes SET likes_count = 0 WHERE likes_count IS NULL;

-- 6. Verify RLS (Policies)
-- Ensure users can Insert/Delete their OWN likes.
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public likes are viewable by everyone" ON likes;
CREATE POLICY "Public likes are viewable by everyone" ON likes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own likes" ON likes;
CREATE POLICY "Users can insert their own likes" ON likes FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own likes" ON likes;
CREATE POLICY "Users can delete their own likes" ON likes FOR DELETE USING (auth.uid() = user_id);
