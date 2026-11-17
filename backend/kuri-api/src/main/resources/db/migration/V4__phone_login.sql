UPDATE user_profile
SET phone = '+17788555154'
WHERE user_id = '9492d795-a4c0-46e4-b3af-6a1ffe731ce7';

UPDATE user_profile
SET phone = '+17788385154'
WHERE user_id = 'a0bcc63a-7c1f-4c9c-a0d7-46a28a83ac10';

ALTER TABLE user_profile
    ALTER COLUMN phone SET NOT NULL;

CREATE UNIQUE INDEX user_profile_phone_unique_idx ON user_profile(phone);

ALTER TABLE app_user
    DROP CONSTRAINT app_user_account_credentials_check;

ALTER TABLE app_user
    ADD CONSTRAINT app_user_account_credentials_check CHECK (
        (account_type = 'REGISTERED' AND password_hash IS NOT NULL)
        OR
        (account_type = 'GUEST' AND email IS NULL AND password_hash IS NULL AND role = 'USER')
    );
