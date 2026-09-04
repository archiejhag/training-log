-- Enable Realtime on days/prefs so a second open device or tab hears about
-- a change immediately, instead of waiting for its next refocus-triggered
-- pull. RLS still applies to the realtime stream — a client only ever
-- receives events for rows it could already SELECT.
--
-- Run once in the SQL Editor, after 0001_init.sql.

alter publication supabase_realtime add table public.days;
alter publication supabase_realtime add table public.prefs;
