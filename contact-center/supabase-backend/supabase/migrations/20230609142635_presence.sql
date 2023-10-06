-- presence_status enum is used to track the status of users.

CREATE TYPE presence_status AS ENUM (
  'AVAILABLE',
  'AWAY',
  'BUSY'
);

-- user_presence table is used to track the presence and status of users.

CREATE TABLE IF NOT EXISTS user_presence (
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  status presence_status NOT NULL DEFAULT 'AWAY',
  actitivy text NOT NULL DEFAULT 'IDLE',
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),

  PRIMARY KEY (user_id)
);

-- View to get the user_presence with user_name and avatar_url 

CREATE OR REPLACE VIEW user_presence_view AS
  SELECT
    user_presence.user_id,
    user_profile.username,
    user_profile.avatar_url,
    user_presence.status,
    user_presence.updated_at,
    user_presence.created_at
  FROM user_presence
  INNER JOIN user_profile ON user_presence.user_id = user_profile.user_id;

-- enable RLS on user_presence

ALTER TABLE user_presence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow logged-in read access" ON user_presence FOR SELECT
  USING ( auth.role() = 'authenticated' );

CREATE POLICY "Allow individual update access" ON user_presence FOR UPDATE
  USING ( auth.role() = 'authenticated' AND user_id = auth.uid() );

-- Trigger to ensure that the user_presence is created when a new user is created

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

