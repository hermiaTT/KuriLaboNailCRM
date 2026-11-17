CREATE TYPE account_type AS ENUM ('REGISTERED', 'GUEST');

ALTER TABLE app_user
    ADD COLUMN account_type account_type NOT NULL DEFAULT 'REGISTERED',
    ALTER COLUMN email DROP NOT NULL,
    ALTER COLUMN password_hash DROP NOT NULL;

ALTER TABLE app_user
    ADD CONSTRAINT app_user_account_credentials_check CHECK (
        (account_type = 'REGISTERED' AND email IS NOT NULL AND password_hash IS NOT NULL)
        OR
        (account_type = 'GUEST' AND email IS NULL AND password_hash IS NULL AND role = 'USER')
    );

CREATE INDEX app_user_account_type_idx ON app_user(account_type, created_at DESC);
