ALTER TABLE notification
    ADD COLUMN related_client_id uuid REFERENCES client(id) ON DELETE SET NULL;

CREATE INDEX idx_notification_related_client
    ON notification(related_client_id)
    WHERE related_client_id IS NOT NULL;
