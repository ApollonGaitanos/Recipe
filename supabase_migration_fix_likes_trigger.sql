-- FIX: The previous trigger failed because users cannot UPDATE other users' recipes due to RLS.
-- Solution: Make the trigger function SECURITY DEFINER so it runs with admin privileges.

CREATE OR REPLACE FUNCTION update_likes_count()
RETURNS TRIGGER 
SECURITY DEFINER -- <--- THIS IS THE KEY FIX
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

-- Re-create the trigger to be sure (it uses the same function name, so just replacing function is enough, but safeguards are good)
DROP TRIGGER IF EXISTS on_like_change ON likes;

CREATE TRIGGER on_like_change
AFTER INSERT OR DELETE ON likes
FOR EACH ROW EXECUTE FUNCTION update_likes_count();
