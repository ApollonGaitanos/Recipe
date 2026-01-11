-- FIX: Public -> Private transitions were "silent" because RLS hid the event.
-- SOLUTION: A separate "Signal" table that everyone can see, containing ONLY non-sensitive status info.

-- 1. Create the Signal Table
CREATE TABLE IF NOT EXISTS recipe_signals (
    recipe_id uuid PRIMARY KEY REFERENCES recipes(id) ON DELETE CASCADE,
    is_public boolean DEFAULT false,
    updated_at timestamptz DEFAULT now()
);

-- 2. Enable RLS but allow PUBLIC VIEWING of this signal 
-- (It contains no sensitive data, just ID and Public Status)
ALTER TABLE recipe_signals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Signals are public" ON recipe_signals;
CREATE POLICY "Signals are public" ON recipe_signals FOR SELECT USING (true);

-- 3. Enable Realtime for this table
ALTER PUBLICATION supabase_realtime ADD TABLE recipe_signals;

-- 4. Trigger to Sync `recipes` -> `recipe_signals`
CREATE OR REPLACE FUNCTION sync_recipe_signal()
RETURNS TRIGGER 
SECURITY DEFINER
AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        INSERT INTO recipe_signals (recipe_id, is_public) VALUES (NEW.id, NEW.is_public);
        RETURN NEW;
    ELSIF (TG_OP = 'UPDATE') THEN
        INSERT INTO recipe_signals (recipe_id, is_public) VALUES (NEW.id, NEW.is_public)
        ON CONFLICT (recipe_id) DO UPDATE SET is_public = NEW.is_public, updated_at = now();
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        DELETE FROM recipe_signals WHERE recipe_id = OLD.id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_recipe_change_signal ON recipes;

CREATE TRIGGER on_recipe_change_signal
AFTER INSERT OR UPDATE OR DELETE ON recipes
FOR EACH ROW EXECUTE FUNCTION sync_recipe_signal();

-- 5. Backfill existing data
INSERT INTO recipe_signals (recipe_id, is_public)
SELECT id, is_public FROM recipes
ON CONFLICT (recipe_id) DO UPDATE SET is_public = EXCLUDED.is_public;
