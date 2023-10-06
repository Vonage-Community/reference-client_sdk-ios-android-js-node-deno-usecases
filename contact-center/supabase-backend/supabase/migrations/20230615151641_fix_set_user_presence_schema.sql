DROP FUNCTION public.set_user_presence_email(new_status presence_status, new_availability availability_type, email text);

CREATE OR REPLACE FUNCTION public.set_user_presence_email(new_status presence_status, new_availability availability_type, user_email text)
    RETURNS void
    LANGUAGE 'plpgsql'
    security definer set search_path = public
AS $$
BEGIN
    UPDATE user_presence
    SET status = new_status,
        availability = new_availability
    WHERE user_id = (SELECT user_id FROM user_profile WHERE user_profile.email = user_email);
END;
$$;