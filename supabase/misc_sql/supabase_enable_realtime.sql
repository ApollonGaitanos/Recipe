-- Enable Supabase Realtime for the recipes table.
-- This is REQUIRED for the client to receive 'UPDATE' events.
-- We also enable it for 'likes' just in case we want to listen to it directly later.

begin;
  -- Try to add table to publication. IF it fails (already added), it's fine.
  -- Supabase defaults to 'supabase_realtime' publication.
  alter publication supabase_realtime add table recipes;
  alter publication supabase_realtime add table likes;
commit;

-- Note: If you get an 'relation "recipes" is already in publication' error, that's GOOD!
-- It means it was already enabled. But if you see no error, it means we just enabled it.
