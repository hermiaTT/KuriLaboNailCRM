ALTER TABLE appointment
    DROP CONSTRAINT appointment_duration_minutes_snapshot_check1,
    DROP CONSTRAINT appointment_start_at_check,
    DROP CONSTRAINT appointment_end_at_check;

ALTER TABLE appointment
    ADD CONSTRAINT appointment_duration_five_minute_check
        CHECK (duration_minutes_snapshot % 5 = 0),
    ADD CONSTRAINT appointment_start_five_minute_check
        CHECK (extract(minute FROM start_at)::integer % 5 = 0),
    ADD CONSTRAINT appointment_end_five_minute_check
        CHECK (extract(minute FROM end_at)::integer % 5 = 0);
