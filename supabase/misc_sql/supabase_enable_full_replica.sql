-- CRITICAL FIX: Ensure Realtime sends the FULL ROW for updates.
-- Without this, 'UPDATE' events might only send changed columns, causing the app
-- to overwrite complete recipes with partial data (causing crashes).

ALTER TABLE recipes REPLICA IDENTITY FULL;

-- Note: This is a Postgres setting that ensures the 'old' and 'new' payloads
-- in the replication stream contain all columns.
