
-- Funktioniert als Helfer für database-backup, um Tabellen zu leeren
CREATE OR REPLACE FUNCTION public.truncate_table(table_name TEXT)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  EXECUTE format('TRUNCATE TABLE %I RESTART IDENTITY CASCADE', table_name);
END;
$$;
