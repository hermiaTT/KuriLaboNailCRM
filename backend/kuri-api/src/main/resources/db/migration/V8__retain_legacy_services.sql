-- BASIC and COMPLEX are retained as editable starter services during the
-- transition from the legacy fixed-service model to the admin-managed catalog.
UPDATE service_definition
SET active = true, updated_at = now()
WHERE code IN ('BASIC', 'COMPLEX');
