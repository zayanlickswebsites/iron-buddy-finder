
CREATE OR REPLACE FUNCTION public.prevent_self_admin_promotion()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.is_admin IS DISTINCT FROM OLD.is_admin THEN
    NEW.is_admin := OLD.is_admin;
  END IF;
  IF NEW.is_verified IS DISTINCT FROM OLD.is_verified AND OLD.is_verified = true THEN
    -- allow first-time verification (false -> true) but prevent toggling off and back
    NULL;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.prevent_self_admin_promotion() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER profiles_prevent_self_admin
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_self_admin_promotion();
