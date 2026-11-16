CREATE EXTENSION IF NOT EXISTS btree_gist;
CREATE EXTENSION IF NOT EXISTS citext;

CREATE TYPE user_role AS ENUM ('USER', 'ADMIN');
CREATE TYPE user_status AS ENUM ('ACTIVE', 'DISABLED');
CREATE TYPE appointment_status AS ENUM (
    'PENDING_CONFIRMATION',
    'CONFIRMED',
    'REJECTED',
    'CANCELLATION_REQUESTED',
    'CANCELLED',
    'COMPLETED',
    'NO_SHOW'
);
CREATE TYPE cancellation_request_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE media_processing_status AS ENUM ('UPLOADED', 'PROCESSING', 'READY', 'FAILED');

CREATE TABLE app_user (
    id uuid PRIMARY KEY,
    email citext NOT NULL UNIQUE,
    password_hash text NOT NULL,
    role user_role NOT NULL DEFAULT 'USER',
    status user_status NOT NULL DEFAULT 'ACTIVE',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE user_profile (
    user_id uuid PRIMARY KEY REFERENCES app_user(id),
    name varchar(120) NOT NULL,
    phone varchar(40),
    birthday date,
    instagram varchar(120),
    wechat varchar(120),
    preferred_nail_style text,
    allergy_notes text,
    admin_notes text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE refresh_token (
    id uuid PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES app_user(id),
    token_hash text NOT NULL UNIQUE,
    device_name varchar(200),
    expires_at timestamptz NOT NULL,
    revoked_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX refresh_token_user_idx ON refresh_token(user_id);

CREATE TABLE salon_setting (
    id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    salon_name varchar(120) NOT NULL,
    timezone varchar(80) NOT NULL DEFAULT 'America/Vancouver',
    opening_time time NOT NULL DEFAULT '09:00',
    closing_time time NOT NULL DEFAULT '18:00',
    booking_increment_minutes integer NOT NULL DEFAULT 30 CHECK (booking_increment_minutes > 0),
    wechat_id varchar(120),
    contact_message text,
    updated_by uuid REFERENCES app_user(id),
    updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO salon_setting (id, salon_name, contact_message)
VALUES (
    1,
    'Kuri Labo',
    'Have a special request or need help within 24 hours of your appointment? Contact the nail artist on WeChat.'
);

CREATE TABLE service_definition (
    id uuid PRIMARY KEY,
    code varchar(60) NOT NULL UNIQUE,
    name varchar(120) NOT NULL,
    description text,
    duration_minutes integer NOT NULL CHECK (duration_minutes > 0 AND duration_minutes % 30 = 0),
    active boolean NOT NULL DEFAULT true,
    display_order integer NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO service_definition (id, code, name, duration_minutes, display_order)
VALUES
    ('10000000-0000-0000-0000-000000000001', 'BASIC', 'Basic', 120, 10),
    ('10000000-0000-0000-0000-000000000002', 'COMPLEX', 'Complex', 180, 20);

CREATE TABLE availability_block (
    id uuid PRIMARY KEY,
    start_at timestamptz NOT NULL,
    end_at timestamptz NOT NULL,
    reason text,
    created_by uuid NOT NULL REFERENCES app_user(id),
    created_at timestamptz NOT NULL DEFAULT now(),
    CHECK (end_at > start_at)
);
CREATE INDEX availability_block_time_idx ON availability_block(start_at, end_at);

CREATE TABLE appointment (
    id uuid PRIMARY KEY,
    customer_id uuid NOT NULL REFERENCES app_user(id),
    service_definition_id uuid REFERENCES service_definition(id),
    service_name_snapshot varchar(120) NOT NULL,
    duration_minutes_snapshot integer NOT NULL CHECK (duration_minutes_snapshot > 0),
    start_at timestamptz NOT NULL,
    end_at timestamptz NOT NULL,
    status appointment_status NOT NULL DEFAULT 'PENDING_CONFIRMATION',
    customer_note text,
    service_notes text,
    final_price numeric(10, 2) CHECK (final_price IS NULL OR final_price >= 0),
    created_by uuid NOT NULL REFERENCES app_user(id),
    confirmed_by uuid REFERENCES app_user(id),
    confirmed_at timestamptz,
    completed_at timestamptz,
    cancelled_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    version bigint NOT NULL DEFAULT 0,
    CHECK (end_at > start_at),
    CHECK (duration_minutes_snapshot % 30 = 0),
    CHECK (extract(minute FROM start_at)::integer % 30 = 0),
    CHECK (extract(second FROM start_at) = 0),
    CHECK (extract(minute FROM end_at)::integer % 30 = 0),
    CHECK (extract(second FROM end_at) = 0)
);

ALTER TABLE appointment
    ADD CONSTRAINT appointment_no_active_overlap
    EXCLUDE USING gist (
        tstzrange(start_at, end_at, '[)') WITH &&
    )
    WHERE (status IN ('PENDING_CONFIRMATION', 'CONFIRMED', 'CANCELLATION_REQUESTED'));

CREATE INDEX appointment_customer_idx ON appointment(customer_id, start_at DESC);
CREATE INDEX appointment_status_time_idx ON appointment(status, start_at);

CREATE TABLE appointment_status_history (
    id uuid PRIMARY KEY,
    appointment_id uuid NOT NULL REFERENCES appointment(id),
    from_status appointment_status,
    to_status appointment_status NOT NULL,
    reason text,
    changed_by uuid NOT NULL REFERENCES app_user(id),
    changed_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX appointment_status_history_appointment_idx
    ON appointment_status_history(appointment_id, changed_at);

CREATE TABLE cancellation_request (
    id uuid PRIMARY KEY,
    appointment_id uuid NOT NULL REFERENCES appointment(id),
    requested_by uuid NOT NULL REFERENCES app_user(id),
    reason text,
    status cancellation_request_status NOT NULL DEFAULT 'PENDING',
    reviewed_by uuid REFERENCES app_user(id),
    review_note text,
    requested_at timestamptz NOT NULL DEFAULT now(),
    reviewed_at timestamptz
);
CREATE UNIQUE INDEX cancellation_request_one_pending_idx
    ON cancellation_request(appointment_id)
    WHERE status = 'PENDING';

CREATE TABLE media_asset (
    id uuid PRIMARY KEY,
    storage_provider varchar(40) NOT NULL,
    bucket varchar(120) NOT NULL,
    object_key text NOT NULL,
    original_filename text,
    content_type varchar(160) NOT NULL,
    size_bytes bigint NOT NULL CHECK (size_bytes >= 0),
    width integer,
    height integer,
    processing_status media_processing_status NOT NULL DEFAULT 'UPLOADED',
    uploaded_by uuid NOT NULL REFERENCES app_user(id),
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (storage_provider, bucket, object_key)
);

CREATE TABLE collection_item (
    id uuid PRIMARY KEY,
    customer_id uuid NOT NULL REFERENCES app_user(id),
    appointment_id uuid REFERENCES appointment(id),
    title varchar(200),
    description text,
    visit_date date,
    created_by uuid NOT NULL REFERENCES app_user(id),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz
);
CREATE INDEX collection_item_customer_idx ON collection_item(customer_id, created_at DESC);

CREATE TABLE collection_item_media (
    collection_item_id uuid NOT NULL REFERENCES collection_item(id) ON DELETE CASCADE,
    media_asset_id uuid NOT NULL REFERENCES media_asset(id),
    display_order integer NOT NULL DEFAULT 0,
    PRIMARY KEY (collection_item_id, media_asset_id)
);

CREATE TABLE collection_item_tag (
    collection_item_id uuid NOT NULL REFERENCES collection_item(id) ON DELETE CASCADE,
    tag varchar(80) NOT NULL,
    PRIMARY KEY (collection_item_id, tag)
);

CREATE TABLE inspiration_item (
    id uuid PRIMARY KEY,
    title varchar(200),
    description text,
    source_collection_item_id uuid REFERENCES collection_item(id),
    published boolean NOT NULL DEFAULT false,
    created_by uuid NOT NULL REFERENCES app_user(id),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz
);
CREATE INDEX inspiration_published_idx
    ON inspiration_item(created_at DESC)
    WHERE published = true AND deleted_at IS NULL;

CREATE TABLE inspiration_item_media (
    inspiration_item_id uuid NOT NULL REFERENCES inspiration_item(id) ON DELETE CASCADE,
    media_asset_id uuid NOT NULL REFERENCES media_asset(id),
    display_order integer NOT NULL DEFAULT 0,
    PRIMARY KEY (inspiration_item_id, media_asset_id)
);

CREATE TABLE inspiration_item_tag (
    inspiration_item_id uuid NOT NULL REFERENCES inspiration_item(id) ON DELETE CASCADE,
    tag varchar(80) NOT NULL,
    PRIMARY KEY (inspiration_item_id, tag)
);

CREATE TABLE inspiration_favorite (
    user_id uuid NOT NULL REFERENCES app_user(id),
    inspiration_item_id uuid NOT NULL REFERENCES inspiration_item(id),
    created_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, inspiration_item_id)
);

CREATE TABLE outbox_event (
    id uuid PRIMARY KEY,
    aggregate_type varchar(120) NOT NULL,
    aggregate_id uuid NOT NULL,
    event_type varchar(160) NOT NULL,
    event_version integer NOT NULL DEFAULT 1,
    payload jsonb NOT NULL,
    correlation_id uuid,
    causation_id uuid,
    occurred_at timestamptz NOT NULL DEFAULT now(),
    published_at timestamptz,
    publish_attempts integer NOT NULL DEFAULT 0,
    last_error text
);
CREATE INDEX outbox_unpublished_idx
    ON outbox_event(occurred_at)
    WHERE published_at IS NULL;

CREATE TABLE processed_event (
    consumer_name varchar(160) NOT NULL,
    event_id uuid NOT NULL,
    processed_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (consumer_name, event_id)
);

CREATE TABLE audit_log (
    id uuid PRIMARY KEY,
    actor_id uuid REFERENCES app_user(id),
    action varchar(160) NOT NULL,
    entity_type varchar(120) NOT NULL,
    entity_id uuid,
    before_state jsonb,
    after_state jsonb,
    correlation_id uuid,
    created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX audit_log_entity_idx ON audit_log(entity_type, entity_id, created_at DESC);

