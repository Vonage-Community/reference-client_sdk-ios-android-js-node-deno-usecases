
-- user-profile table
CREATE TABLE user_profile (
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  email text UNIQUE NOT NULL,
  avatar_url text DEFAULT NULL::text,
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),

  PRIMARY KEY (user_id)
); 

CREATE INDEX user_profile_username_idx ON user_profile (username);

-- enable RLS on user_profile
ALTER TABLE user_profile ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow logged-in read access" ON user_profile FOR SELECT
  USING ( auth.role() = 'authenticated' );

CREATE POLICY "Allow individual update access" ON user_profile FOR UPDATE
  USING ( auth.role() = 'authenticated' AND user_id = auth.uid() );

CREATE POLICY "Allow individual delete access" ON user_profile FOR DELETE
  USING ( auth.role() = 'authenticated' AND user_id = auth.uid() );


-- Ensure that only Vonage Employees can sign up Via Email check
CREATE OR REPLACE FUNCTION check_email_domain()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.email NOT LIKE '%@vonage.com' THEN
    RAISE EXCEPTION 'Only Vonage Employees can sign up via Email';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_email_domain
BEFORE INSERT ON auth.users
FOR EACH ROW EXECUTE PROCEDURE check_email_domain();

-- Make sure that the user_profile is created when a new user is created
-- If user is created via email, using email as username and null for avatar_url
-- If user is created via google, using name as username and avatar_url from google
CREATE OR REPLACE FUNCTION public.on_auth_user_created()
    RETURNS trigger
    LANGUAGE 'plpgsql'
    security definer set search_path = public
AS $$
BEGIN
  IF NEW.raw_app_meta_data->>'provider' = 'google' OR NEW.raw_app_meta_data->>'provider' = 'github' THEN
    INSERT INTO user_profile (user_id, username, email, avatar_url)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'name', NEW.email, NEW.raw_user_meta_data->>'avatar_url');
    RETURN NEW;
  ELSE
    INSERT INTO user_profile (user_id, username, email)
    VALUES (NEW.id, NEW.email, NEW.email);
    RETURN NEW;
  END IF;
END;
$$;

CREATE TRIGGER create_user_profile
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE PROCEDURE public.on_auth_user_created();
