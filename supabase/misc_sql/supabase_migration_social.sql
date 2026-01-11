-- Add author_username to recipes for public attribution
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS author_username text;

-- Add likes_count to recipes for performance
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS likes_count bigint DEFAULT 0;

-- Create likes table to track unique likes
CREATE TABLE IF NOT EXISTS likes (
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    recipe_id uuid REFERENCES recipes(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    PRIMARY KEY (user_id, recipe_id)
);

-- Enable RLS on likes
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read likes (to see count/status)
CREATE POLICY "Public likes are viewable by everyone" ON likes FOR SELECT USING (true);

-- Allow authenticated users to insert their own like
CREATE POLICY "Users can insert their own likes" ON likes FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to delete their own like
CREATE POLICY "Users can delete their own likes" ON likes FOR DELETE USING (auth.uid() = user_id);

-- Function to handle like toggling safely (optional, but handled in client for now)
-- We will handle the count increment/decrement in the client or via a postgres trigger. 
-- For simplicity/robustness, let's add a trigger to keep the count in sync automatically.

CREATE OR REPLACE FUNCTION update_likes_count()
RETURNS TRIGGER AS $$
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

DROP TRIGGER IF EXISTS on_like_change ON likes;

CREATE TRIGGER on_like_change
AFTER INSERT OR DELETE ON likes
FOR EACH ROW EXECUTE FUNCTION update_likes_count();
