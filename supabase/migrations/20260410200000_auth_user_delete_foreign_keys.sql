-- Allow staff-initiated auth user deletion: references to auth.users default to NO ACTION,
-- which blocks deletes from auth.users even when using the Auth Admin API.

-- events.created_by
ALTER TABLE public.events ALTER COLUMN created_by DROP NOT NULL;
ALTER TABLE public.events DROP CONSTRAINT IF EXISTS events_created_by_fkey;
ALTER TABLE public.events
  ADD CONSTRAINT events_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES auth.users (id) ON DELETE SET NULL;

-- events.reviewed_by
ALTER TABLE public.events DROP CONSTRAINT IF EXISTS events_reviewed_by_fkey;
ALTER TABLE public.events
  ADD CONSTRAINT events_reviewed_by_fkey
  FOREIGN KEY (reviewed_by) REFERENCES auth.users (id) ON DELETE SET NULL;

-- org_invites.created_by / claimed_by
ALTER TABLE public.org_invites ALTER COLUMN created_by DROP NOT NULL;
ALTER TABLE public.org_invites DROP CONSTRAINT IF EXISTS org_invites_created_by_fkey;
ALTER TABLE public.org_invites
  ADD CONSTRAINT org_invites_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES auth.users (id) ON DELETE SET NULL;

ALTER TABLE public.org_invites DROP CONSTRAINT IF EXISTS org_invites_claimed_by_fkey;
ALTER TABLE public.org_invites
  ADD CONSTRAINT org_invites_claimed_by_fkey
  FOREIGN KEY (claimed_by) REFERENCES auth.users (id) ON DELETE SET NULL;

-- host_applications.reviewed_by
ALTER TABLE public.host_applications DROP CONSTRAINT IF EXISTS host_applications_reviewed_by_fkey;
ALTER TABLE public.host_applications
  ADD CONSTRAINT host_applications_reviewed_by_fkey
  FOREIGN KEY (reviewed_by) REFERENCES auth.users (id) ON DELETE SET NULL;
