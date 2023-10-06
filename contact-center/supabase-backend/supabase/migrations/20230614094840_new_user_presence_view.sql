DROP VIEW user_presence_chat_view;
DROP VIEW user_presence_voice_view;
DROP VIEW user_presence_view;

CREATE OR REPLACE VIEW users_view AS
    SELECT
        user_presence.user_id AS user_id,
        user_profile.username AS name,
        user_profile.email AS email,
        user_profile.avatar_url AS avatar_url,
        user_presence.status AS status,
        user_presence.availability AS availability,
        user_presence.updated_at AS status_updated_at,
        user_profile.updated_at AS profile_updated_at,
        user_profile.created_at AS created_at
    FROM user_presence
    LEFT JOIN user_profile ON user_presence.user_id = user_profile.user_id;

CREATE OR REPLACE VIEW user_available_view AS
    SELECT
        user_id,
        name,
        email,
        avatar_url,
        status,
        availability,
        status_updated_at AS updated_at
    FROM users_view
    WHERE status = 'AVAILABLE'
    ORDER BY updated_at ASC;

CREATE OR REPLACE VIEW user_available_view_voice AS
    SELECT *
    FROM user_available_view
    WHERE availability = 'VOICE' OR availability = 'ALL';

-- view to get the user_presence with user_name and avatar_url for all available users for chat

CREATE OR REPLACE VIEW user_available_view_chat AS
    SELECT *
    FROM user_available_view
    WHERE availability = 'CHAT' OR availability = 'ALL';


CREATE OR REPLACE FUNCTION public.set_user_presence_email(new_status presence_status, new_availability availability_type, email text)
    RETURNS void
    LANGUAGE 'plpgsql'
    security definer set search_path = public
AS $$
BEGIN
    UPDATE user_presence
    SET status = new_status,
        availability = new_availability
    WHERE user_id = (SELECT user_id FROM user_profile WHERE user_profile.email = mail);
END;
$$;