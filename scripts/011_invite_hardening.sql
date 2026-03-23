-- ViBE: Invite System Hardening
-- Fix 1: CHECK constraint to block old org roles
-- Fix 2: FOR UPDATE lock on claim_invite to prevent double-claim race

-- ============================================================
-- 1. CHECK CONSTRAINT: Only allow new org roles going forward
-- ============================================================

ALTER TABLE public.organization_members
  DROP CONSTRAINT IF EXISTS org_role_allowed;

ALTER TABLE public.organization_members
  ADD CONSTRAINT org_role_allowed
  CHECK (role IN ('owner', 'admin', 'editor', 'viewer'));

-- ============================================================
-- 2. REBUILD claim_invite WITH FOR UPDATE LOCKING
-- ============================================================

CREATE OR REPLACE FUNCTION public.claim_invite(invite_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invite RECORD;
  v_user_id uuid;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Not authenticated');
  END IF;

  -- FOR UPDATE locks the row to prevent double-claim race condition
  SELECT * INTO v_invite
    FROM public.org_invites
    WHERE org_invites.token = invite_token
    FOR UPDATE
    LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Invite not found');
  END IF;

  IF v_invite.claimed_by IS NOT NULL THEN
    RETURN jsonb_build_object('error', 'Invite has already been claimed');
  END IF;

  IF v_invite.expires_at < now() THEN
    RETURN jsonb_build_object('error', 'Invite has expired');
  END IF;

  -- Email match check (case-normalized)
  IF v_invite.email IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM auth.users u
      WHERE u.id = v_user_id AND lower(u.email) = lower(v_invite.email)
    ) THEN
      RETURN jsonb_build_object('error', 'This invite is for a different email address');
    END IF;
  END IF;

  -- Already a member check
  IF EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE org_id = v_invite.org_id AND user_id = v_user_id
  ) THEN
    RETURN jsonb_build_object('error', 'You are already a member of this organization');
  END IF;

  -- Insert membership
  INSERT INTO public.organization_members (org_id, user_id, role)
    VALUES (v_invite.org_id, v_user_id, v_invite.role);

  -- Mark invite as claimed
  UPDATE public.org_invites
    SET claimed_by = v_user_id, claimed_at = now()
    WHERE id = v_invite.id;

  RETURN jsonb_build_object(
    'success', true,
    'org_id', v_invite.org_id,
    'role', v_invite.role
  );
END;
$$;

-- Only authenticated users can call this function
REVOKE EXECUTE ON FUNCTION public.claim_invite(text) FROM anon;
GRANT EXECUTE ON FUNCTION public.claim_invite(text) TO authenticated;
