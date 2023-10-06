-- Drop user_presence table

DROP TABLE IF EXISTS user_presence CASCADE;

-- Drop user_presence_view view

DROP VIEW IF EXISTS user_presence_view CASCADE;

-- Drop ensure_user_presence_on_new_user trigger

DROP TRIGGER IF EXISTS ensure_user_presence ON auth.users;

-- Drop ensure_user_presence_on_new_user function

DROP FUNCTION IF EXISTS ensure_user_presence_on_new_user();

-- Drop presence_status enum

DROP TYPE IF EXISTS presence_status;

create extension if not exists pg_cron;

CREATE TYPE presence_status AS ENUM (
    'AVAILABLE',
    'OFFLINE',
    'BUSY',
    'DO_NOT_DISTURB'
);

CREATE TYPE availability_type AS ENUM (
    'VOICE',
    'CHAT',
    'ALL'
);

CREATE TABLE IF NOT EXISTS user_presence (
    user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
    status presence_status NOT NULL DEFAULT 'OFFLINE',
    availability availability_type NOT NULL DEFAULT 'ALL',
    updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    PRIMARY KEY (user_id)
);

-- Enable RLS on user_presence table

ALTER TABLE user_presence ENABLE ROW LEVEL SECURITY;

-- Allow only the user to read and update their own presence

CREATE POLICY user_presence_select ON user_presence
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY user_presence_update ON user_presence
FOR UPDATE
USING (user_id = auth.uid());


-- view to get the user_presence with user_name and avatar_url for all available users

CREATE OR REPLACE VIEW user_presence_view AS
    SELECT
        user_presence.user_id AS user_id,
        user_profile.username AS name,
        user_profile.avatar_url AS avatar_url,
        user_presence.status AS status,
        user_presence.availability AS availability
    FROM user_presence
    LEFT JOIN user_profile ON user_presence.user_id = user_profile.user_id
    WHERE user_presence.status = 'AVAILABLE';

-- view to get the user_presence with user_name and avatar_url for all available users for voice

CREATE OR REPLACE VIEW user_presence_voice_view AS
    SELECT *
    FROM user_presence_view
    WHERE user_presence_view.availability = 'VOICE' OR user_presence_view.availability = 'ALL';

-- view to get the user_presence with user_name and avatar_url for all available users for chat

CREATE OR REPLACE VIEW user_presence_chat_view AS
    SELECT *
    FROM user_presence_view
    WHERE user_presence_view.availability = 'CHAT' OR user_presence_view.availability = 'ALL';

-- Ensure that the user_presence is created when a new user is created

CREATE OR REPLACE FUNCTION public.ensure_user_presence_on_new_user()
    RETURNS trigger
    LANGUAGE 'plpgsql'
    security definer set search_path = public
AS $$
BEGIN
    INSERT INTO user_presence (user_id)
    VALUES (NEW.id);
    RETURN NEW;
END;
$$;

CREATE TRIGGER ensure_user_presence
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE PROCEDURE ensure_user_presence_on_new_user();


-- Ensure that existing users have a user_presence

INSERT INTO user_presence (user_id)
SELECT id
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM user_presence);

-- function to ping the user_presence for logged in user

CREATE OR REPLACE FUNCTION public.set_user_presence(new_status presence_status, new_availability availability_type)
    RETURNS void
    LANGUAGE 'plpgsql'
    security definer set search_path = public
AS $$
BEGIN
    UPDATE user_presence
    SET status = new_status,
        availability = new_availability
    WHERE user_id = auth.uid();
END;
$$;

-- function to ping the user_presence for device

CREATE OR REPLACE FUNCTION public.set_user_presence_device(new_status presence_status, new_availability availability_type, device_id uuid)
    RETURNS void
    LANGUAGE 'plpgsql'
    security definer set search_path = public
AS $$
BEGIN
    UPDATE user_presence
    SET status = new_status,
        availability = new_availability
    WHERE user_id = (SELECT user_id FROM devices WHERE id = device_id);
END;
$$;

