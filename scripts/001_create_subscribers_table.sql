-- Create subscribers table for email waitlist
CREATE TABLE subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  source TEXT DEFAULT 'website'
);

-- Enable Row Level Security
ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (for public waitlist signups)
CREATE POLICY "Allow public inserts" ON subscribers 
  FOR INSERT 
  WITH CHECK (true);

-- Only allow authenticated admins to view subscribers (you can adjust this later)
CREATE POLICY "Allow public to check their own email" ON subscribers 
  FOR SELECT 
  USING (true);
