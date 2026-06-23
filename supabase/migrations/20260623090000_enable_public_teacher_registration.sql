-- Public registration for the Tahsin application.
-- Existing accounts and data are not modified.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    user_id,
    full_name,
    username,
    whatsapp,
    role,
    status
  )
  VALUES (
    NEW.id,
    COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''), NEW.email),
    NULLIF(LOWER(TRIM(NEW.raw_user_meta_data->>'username')), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'whatsapp'), ''),
    'guru',
    'pending'
  );

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_approved_profile_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'approved' AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.user_id, 'guru'::public.app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_approved_profile_role ON public.profiles;
CREATE TRIGGER sync_approved_profile_role
  AFTER UPDATE OF status ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_approved_profile_role();
