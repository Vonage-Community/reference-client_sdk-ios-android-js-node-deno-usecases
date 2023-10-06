
-- Enable the "pg_hashids" extension
create extension pg_hashids with schema extensions;

CREATE TABLE IF NOT EXISTS devices (
  id uuid PRIMARY KEY DEFAULT  uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  device_name text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);

-- enable RLS on devices
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow individual read access" ON devices FOR SELECT
  USING ( auth.role() = 'authenticated' AND user_id = auth.uid() );

CREATE POLICY "Allow individual update access" ON devices FOR UPDATE
    USING ( auth.role() = 'authenticated' AND user_id = auth.uid() );

CREATE POLICY "Allow individual delete access" ON devices FOR DELETE
    USING ( auth.role() = 'authenticated' AND user_id = auth.uid() );

CREATE POLICY "Allow individual insert access" ON devices FOR INSERT
    WITH CHECK ( user_id = auth.uid() );

-- Device Code Table
CREATE TABLE IF NOT EXISTS device_codes (
  id serial PRIMARY KEY,
  device_id uuid NOT NULL REFERENCES devices (id) ON DELETE CASCADE,
  expires_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now() + interval '5 minutes'),
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);

-- enable RLS on device_codes
ALTER TABLE device_codes ENABLE ROW LEVEL SECURITY;

-- Only allow the owner of the device to read the device code IF the code is not expired
CREATE POLICY "Allow unauthenticated read access if not expired" ON device_codes FOR SELECT
  USING ( auth.role() = 'anonymous' AND expires_at > timezone('utc'::text, now()) );

-- Only allow the owner of the device to read the device code IF the code is not expired
CREATE POLICY "Allow individual read access if not expired" ON device_codes FOR SELECT
  USING ( auth.role() = 'authenticated' AND device_id IN (SELECT id FROM devices WHERE user_id = auth.uid()) AND expires_at > timezone('utc'::text, now()) );

CREATE POLICY "Allow individual delete access" ON device_codes FOR DELETE
    USING ( auth.role() = 'authenticated' AND device_id IN (SELECT id FROM devices WHERE user_id = auth.uid()) );

CREATE POLICY "Allow Insert access on devices owned by the user" ON device_codes FOR INSERT
    WITH CHECK (
      auth.uid() IN (SELECT user_id FROM devices WHERE id = device_id)
    );

-- Function make a new device code for a device or if one already exists, delete it and make a new one
CREATE OR REPLACE FUNCTION public.make_device_code(device uuid, salt text)
    RETURNS text
    LANGUAGE 'plpgsql'
    security invoker
AS $$
DECLARE
  code_id integer;
  device_code text;
BEGIN
    -- Check if a device code already exists for this device and delete it if it does
    DELETE FROM device_codes WHERE device_id = device;
    -- Make a new device code for the device and get the id of the new device code
    INSERT INTO device_codes (device_id) VALUES (device) RETURNING id INTO code_id;
    -- If the id was not found then raise an exception
    IF NOT FOUND THEN
      RAISE EXCEPTION 'No device code found for device %', device;
    END IF;
    -- Encode the id of the device code with the salt and return it
    SELECT id_encode(code_id, salt, 6) INTO device_code;
    -- If the device code was not found then raise an exception
    IF NOT FOUND THEN
      RAISE EXCEPTION 'No device code found for device %', device;
    END IF;
    RETURN device_code;
    END;
$$;

-- Function to verify a device code and return true if it is valid and false if it is not or expired then delete it to prevent replay attacks
CREATE OR REPLACE FUNCTION public.verify_device_code(device_code text, salt text)
    RETURNS uuid
    LANGUAGE 'plpgsql'
    security invoker
AS $$
DECLARE
  code_id integer;
  device uuid;
BEGIN
    SELECT id, device_id INTO code_id, device FROM device_codes WHERE id = ANY(id_decode(device_code, salt, 6)) AND expires_at > timezone('utc'::text, now());
    IF FOUND THEN
      DELETE FROM device_codes WHERE id = code_id;
      RETURN device;
    ELSE
      RETURN NULL;
    END IF;
    END;
$$;
