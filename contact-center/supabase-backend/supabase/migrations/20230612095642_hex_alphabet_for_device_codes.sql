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
    SELECT id_encode(code_id, salt, 6, '0123456789abcdef') INTO device_code;
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
    SELECT id, device_id INTO code_id, device FROM device_codes WHERE id = ANY(id_decode(lower(device_code), salt, 6,'0123456789abcdef')) AND expires_at > timezone('utc'::text, now());
    IF FOUND THEN
      DELETE FROM device_codes WHERE id = code_id;
      RETURN device;
    ELSE
      RETURN NULL;
    END IF;
    END;
$$;
