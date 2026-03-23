-- ViBE: Lock down subscribers table -- prevent email enumeration
-- SEVERITY: Medium -- brand-trust + privacy issue
-- Currently: SELECT USING (true) allows anyone to list all waitlist emails
-- Fix: Only admins can read subscribers; public can only insert

-- Drop the overly-permissive select policy
DROP POLICY IF EXISTS "Allow public to check their own email" ON subscribers;

-- Replace with admin-only read access
CREATE POLICY "subscribers_select_admin_only" ON subscribers
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role_admin = true
    )
  );
