ALTER TABLE service_definition
    ADD COLUMN price numeric(10, 2) NOT NULL DEFAULT 0
        CHECK (price >= 0);

ALTER TABLE service_definition
    DROP CONSTRAINT service_definition_duration_minutes_check;

ALTER TABLE service_definition
    ADD CONSTRAINT service_definition_duration_minutes_check
        CHECK (duration_minutes BETWEEN 30 AND 300 AND duration_minutes % 30 = 0);

UPDATE service_definition
SET active = false, updated_at = now()
WHERE code IN ('BASIC', 'COMPLEX');

ALTER TABLE user_profile
    ADD COLUMN avatar_media_id uuid REFERENCES media_asset(id);

CREATE TABLE appointment_reference_media (
    id uuid PRIMARY KEY,
    appointment_id uuid NOT NULL REFERENCES appointment(id) ON DELETE CASCADE,
    media_asset_id uuid NOT NULL REFERENCES media_asset(id),
    display_order integer NOT NULL DEFAULT 0,
    UNIQUE (appointment_id, media_asset_id),
    UNIQUE (appointment_id, display_order)
);

CREATE INDEX appointment_reference_media_appointment_idx
    ON appointment_reference_media(appointment_id, display_order);
