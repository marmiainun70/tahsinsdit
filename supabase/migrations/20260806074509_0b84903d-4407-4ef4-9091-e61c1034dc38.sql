ALTER TABLE public.profiles DISABLE TRIGGER prevent_self_status_role_change;
ALTER TABLE public.profiles DISABLE TRIGGER prevent_self_status_role_change_trigger;

UPDATE public.profiles
SET role = 'admin',
    status = 'approved',
    is_read_by_admin = true,
    full_name = COALESCE(NULLIF(BTRIM(full_name), ''), 'YSDS Admin')
WHERE user_id = '7e66b10d-2be8-4e44-9595-7d95a1d9fb88';

ALTER TABLE public.profiles ENABLE TRIGGER prevent_self_status_role_change;
ALTER TABLE public.profiles ENABLE TRIGGER prevent_self_status_role_change_trigger;

INSERT INTO public.user_roles (user_id, role)
VALUES ('7e66b10d-2be8-4e44-9595-7d95a1d9fb88', 'admin'::public.app_role)
ON CONFLICT (user_id, role) DO NOTHING;