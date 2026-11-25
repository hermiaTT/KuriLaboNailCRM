CREATE TYPE client_status AS ENUM ('ACTIVE', 'MERGED', 'ARCHIVED');

CREATE TABLE client (
    id uuid PRIMARY KEY,
    client_name varchar(120),
    admin_display_name varchar(120) NOT NULL,
    contact_phone varchar(40),
    birthday date,
    instagram varchar(120),
    wechat varchar(120),
    preferred_language varchar(5) NOT NULL DEFAULT 'en'
        CHECK (preferred_language IN ('en', 'zh-CN')),
    preferred_nail_style text,
    allergy_notes text,
    admin_notes text,
    avatar_media_id uuid REFERENCES media_asset(id),
    status client_status NOT NULL DEFAULT 'ACTIVE',
    merged_into_client_id uuid REFERENCES client(id),
    merged_by uuid REFERENCES app_user(id),
    merged_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT client_merge_state_check CHECK (
        (status = 'MERGED' AND merged_into_client_id IS NOT NULL AND merged_at IS NOT NULL)
        OR
        (status <> 'MERGED' AND merged_into_client_id IS NULL AND merged_at IS NULL)
    ),
    CONSTRAINT client_not_merged_into_self CHECK (merged_into_client_id IS NULL OR merged_into_client_id <> id)
);

CREATE UNIQUE INDEX client_admin_display_name_active_unique_idx
    ON client (lower(btrim(admin_display_name)))
    WHERE status = 'ACTIVE';

CREATE UNIQUE INDEX client_contact_phone_active_unique_idx
    ON client (contact_phone)
    WHERE contact_phone IS NOT NULL AND status = 'ACTIVE';

CREATE INDEX client_status_created_idx ON client(status, created_at DESC);

CREATE TABLE admin_profile (
    user_id uuid PRIMARY KEY REFERENCES app_user(id) ON DELETE CASCADE,
    name varchar(120) NOT NULL,
    avatar_media_id uuid REFERENCES media_asset(id),
    preferred_language varchar(5) NOT NULL DEFAULT 'en'
        CHECK (preferred_language IN ('en', 'zh-CN')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO client (
    id,
    client_name,
    admin_display_name,
    contact_phone,
    birthday,
    instagram,
    wechat,
    preferred_language,
    preferred_nail_style,
    allergy_notes,
    admin_notes,
    avatar_media_id,
    created_at,
    updated_at
)
SELECT
    profile.user_id,
    CASE WHEN account.account_type = 'REGISTERED' THEN profile.name ELSE NULL END,
    profile.name,
    profile.phone,
    profile.birthday,
    profile.instagram,
    profile.wechat,
    profile.preferred_language,
    profile.preferred_nail_style,
    profile.allergy_notes,
    profile.admin_notes,
    profile.avatar_media_id,
    profile.created_at,
    profile.updated_at
FROM user_profile profile
JOIN app_user account ON account.id = profile.user_id
WHERE account.role = 'USER';

INSERT INTO admin_profile (user_id, name, avatar_media_id, preferred_language, created_at, updated_at)
SELECT profile.user_id, profile.name, profile.avatar_media_id, profile.preferred_language,
       profile.created_at, profile.updated_at
FROM user_profile profile
JOIN app_user account ON account.id = profile.user_id
WHERE account.role = 'ADMIN';

ALTER TABLE app_user
    ADD COLUMN client_id uuid,
    ADD COLUMN login_phone varchar(40),
    ADD COLUMN phone_verified_at timestamptz;

UPDATE app_user account
SET login_phone = profile.phone,
    client_id = CASE WHEN account.role = 'USER' THEN account.id ELSE NULL END
FROM user_profile profile
WHERE profile.user_id = account.id
  AND account.account_type = 'REGISTERED';

ALTER TABLE appointment DROP CONSTRAINT appointment_customer_id_fkey;
ALTER TABLE appointment
    ADD CONSTRAINT appointment_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES client(id);

ALTER TABLE collection_item DROP CONSTRAINT collection_item_customer_id_fkey;
ALTER TABLE collection_item
    ADD CONSTRAINT collection_item_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES client(id);

ALTER TABLE nail_set DROP CONSTRAINT nail_set_client_id_fkey;
ALTER TABLE nail_set
    ADD CONSTRAINT nail_set_client_id_fkey FOREIGN KEY (client_id) REFERENCES client(id);

ALTER TABLE inspiration_favorite DROP CONSTRAINT inspiration_favorite_user_id_fkey;
ALTER TABLE inspiration_favorite RENAME COLUMN user_id TO client_id;
ALTER TABLE inspiration_favorite
    ADD CONSTRAINT inspiration_favorite_client_id_fkey FOREIGN KEY (client_id) REFERENCES client(id);

ALTER TABLE nail_set_favorite DROP CONSTRAINT nail_set_favorite_user_id_fkey;
ALTER TABLE nail_set_favorite RENAME COLUMN user_id TO client_id;
ALTER TABLE nail_set_favorite
    ADD CONSTRAINT nail_set_favorite_client_id_fkey FOREIGN KEY (client_id) REFERENCES client(id);

ALTER TABLE notification
    ADD COLUMN client_id uuid REFERENCES client(id);

ALTER TABLE notification ALTER COLUMN user_id DROP NOT NULL;

UPDATE notification notification_row
SET client_id = COALESCE(account.client_id, notification_row.user_id),
    user_id = NULL
FROM app_user account
WHERE account.id = notification_row.user_id
  AND account.role = 'USER';

ALTER TABLE notification
    ADD CONSTRAINT notification_recipient_check CHECK (
        (user_id IS NOT NULL AND client_id IS NULL)
        OR
        (user_id IS NULL AND client_id IS NOT NULL)
    );
CREATE INDEX idx_notification_client_created ON notification(client_id, created_at DESC)
    WHERE client_id IS NOT NULL;
CREATE INDEX idx_notification_client_unread ON notification(client_id, read_at)
    WHERE client_id IS NOT NULL AND read_at IS NULL;

DROP TABLE user_profile;

DELETE FROM app_user WHERE account_type = 'GUEST';

ALTER TABLE app_user DROP CONSTRAINT app_user_account_credentials_check;
ALTER TABLE app_user DROP COLUMN account_type;
DROP TYPE account_type;

ALTER TABLE app_user
    ALTER COLUMN login_phone SET NOT NULL,
    ADD CONSTRAINT app_user_client_id_fkey FOREIGN KEY (client_id) REFERENCES client(id),
    ADD CONSTRAINT app_user_role_client_check CHECK (
        (role = 'ADMIN' AND client_id IS NULL)
        OR
        (role = 'USER' AND client_id IS NOT NULL)
    );

CREATE UNIQUE INDEX app_user_login_phone_unique_idx ON app_user(login_phone);
CREATE UNIQUE INDEX app_user_client_unique_idx ON app_user(client_id) WHERE client_id IS NOT NULL;

CREATE TABLE client_merge_history (
    id uuid PRIMARY KEY,
    source_client_id uuid NOT NULL REFERENCES client(id),
    target_client_id uuid NOT NULL REFERENCES client(id),
    merged_by uuid NOT NULL REFERENCES app_user(id),
    merged_at timestamptz NOT NULL DEFAULT now(),
    CHECK (source_client_id <> target_client_id)
);

CREATE INDEX client_merge_history_source_idx ON client_merge_history(source_client_id, merged_at DESC);
CREATE INDEX client_merge_history_target_idx ON client_merge_history(target_client_id, merged_at DESC);
