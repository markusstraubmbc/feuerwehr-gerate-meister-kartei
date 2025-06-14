
-- Enable RLS policies for the settings table to allow read and write access
-- This allows the application to store and retrieve system settings

-- Policy to allow reading all settings
CREATE POLICY "Allow read access to settings" ON settings
FOR SELECT USING (true);

-- Policy to allow inserting/updating all settings
CREATE POLICY "Allow insert/update access to settings" ON settings
FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update access to settings" ON settings
FOR UPDATE USING (true) WITH CHECK (true);

-- Policy to allow deleting settings (if needed)
CREATE POLICY "Allow delete access to settings" ON settings
FOR DELETE USING (true);
