-- Migration 018: Trigger to prevent non-staff from modifying review fields
-- RLS only does row-level access; this trigger enforces column-level restrictions

CREATE OR REPLACE FUNCTION guard_event_review_fields()
RETURNS TRIGGER AS $$
DECLARE
  caller_role text;
BEGIN
  -- Look up the caller's platform_role
  SELECT p.platform_role::text INTO caller_role
  FROM profiles p
  WHERE p.id = auth.uid();

  -- Staff admins can do anything
  IF caller_role = 'staff_admin' THEN
    RETURN NEW;
  END IF;

  -- Non-staff: block changes to review metadata columns
  IF NEW.reviewed_by IS DISTINCT FROM OLD.reviewed_by THEN
    RAISE EXCEPTION 'Only staff admins can modify reviewed_by';
  END IF;

  IF NEW.reviewed_at IS DISTINCT FROM OLD.reviewed_at THEN
    RAISE EXCEPTION 'Only staff admins can modify reviewed_at';
  END IF;

  IF NEW.review_notes IS DISTINCT FROM OLD.review_notes THEN
    RAISE EXCEPTION 'Only staff admins can modify review_notes';
  END IF;

  -- Non-staff: block setting status to published or rejected (only staff can approve/reject)
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status IN ('published', 'rejected') THEN
      RAISE EXCEPTION 'Only staff admins can set status to published or rejected';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop if exists and recreate
DROP TRIGGER IF EXISTS trg_guard_event_review_fields ON events;

CREATE TRIGGER trg_guard_event_review_fields
  BEFORE UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION guard_event_review_fields();
