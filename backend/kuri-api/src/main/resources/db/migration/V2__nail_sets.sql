CREATE TABLE nail_set (
    id uuid PRIMARY KEY,
    client_id uuid REFERENCES app_user(id),
    appointment_id uuid UNIQUE REFERENCES appointment(id),
    title varchar(200),
    description text,
    published boolean NOT NULL DEFAULT true,
    created_by uuid NOT NULL REFERENCES app_user(id),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX nail_set_published_idx
    ON nail_set(created_at DESC)
    WHERE published = true;

CREATE INDEX nail_set_client_idx
    ON nail_set(client_id, created_at DESC)
    WHERE client_id IS NOT NULL;

CREATE TABLE nail_set_media (
    id uuid PRIMARY KEY,
    nail_set_id uuid NOT NULL REFERENCES nail_set(id) ON DELETE CASCADE,
    media_asset_id uuid NOT NULL REFERENCES media_asset(id),
    display_order integer NOT NULL DEFAULT 0,
    UNIQUE (nail_set_id, media_asset_id),
    UNIQUE (nail_set_id, display_order)
);

CREATE TABLE nail_set_favorite (
    user_id uuid NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    nail_set_id uuid NOT NULL REFERENCES nail_set(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, nail_set_id)
);

