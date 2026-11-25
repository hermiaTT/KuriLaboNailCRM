# Kuri Labo Data Model V2

## 1. Conventions

- Primary keys use UUIDs.
- Date-time columns use PostgreSQL `timestamptz` and are persisted in UTC.
- Date-only values use `date`.
- Mutable tables include `created_at`, `updated_at`, and optimistic-lock version where useful.
- Important business records are deactivated or soft-deleted instead of physically deleted.
- External media is referenced by object-storage key, never stored as base64 or a database blob.

## 2. Identity and profiles

### `app_user`

- `id`
- `email` (case-insensitive unique)
- `password_hash`
- `login_phone` (unique; authentication credential)
- `phone_verified_at`
- `client_id` (nullable unique FK; required for `USER`, absent for `ADMIN`)
- `role`: `USER | ADMIN`
- `created_at`
- `updated_at`

`app_user` represents a login identity, not the salon's customer record. Admin-created clients do not receive placeholder accounts.

### `client`

- `id`
- `client_name` (customer-controlled; duplicates allowed)
- `admin_display_name` (admin-only; unique among active clients)
- `contact_phone` (optional CRM contact data; separate from login phone)
- `birthday`
- `instagram`
- `wechat`
- `preferred_language`: `en | zh-CN`
- `preferred_nail_style`
- `allergy_notes`
- `admin_notes`
- `avatar_media_id`
- `status`: `ACTIVE | MERGED | ARCHIVED`
- `merged_into_client_id`, `merged_by`, `merged_at`
- `created_at`
- `updated_at`

Appointments, nail sets, collections, favorites, and client notifications reference `client.id`. Authentication, audit actors, uploads, confirmations, and password resets reference `app_user.id`.

Admin notifications about a newly registered customer store `related_client_id`, so the web and mobile admin apps can navigate directly to the CRM profile regardless of whether registration auto-linked an existing record or created a new record for manual review.

### `admin_profile`

- `user_id` (PK/FK to `app_user`)
- `name`
- `avatar_media_id`
- `preferred_language`
- `created_at`, `updated_at`

### `client_merge_history`

- `id`
- `source_client_id`
- `target_client_id`
- `merged_by`
- `merged_at`

A merge moves customer-owned records to the target, marks the source `MERGED`, and retains this audit record. The source is not physically deleted.

### `refresh_token`

- `id`
- `user_id`
- `token_hash`
- `device_name`
- `expires_at`
- `revoked_at`
- `created_at`

## 3. Salon configuration

### `salon_setting`

Single-row configuration for the first release:

- `id`
- `salon_name`
- `timezone` (initially `America/Vancouver`)
- `opening_time` (initially `09:00`)
- `closing_time` (initially `18:00`)
- `booking_increment_minutes` (initially `30`)
- `wechat_id`
- `contact_message`
- `updated_by`
- `updated_at`

### `service_definition`

- `id`
- `code` (unique stable identifier)
- `name`
- `description`
- `duration_minutes`
- `active`
- `display_order`
- `created_at`
- `updated_at`

Seed data:

- `BASIC`, 120 minutes
- `COMPLEX`, 180 minutes

## 4. Availability and appointments

### `availability_block`

- `id`
- `start_at`
- `end_at`
- `reason`
- `created_by`
- `created_at`

The first release has one salon and one nail artist, so a block applies to the only booking resource.

### `appointment`

- `id`
- `customer_id`
- `service_definition_id` (nullable for an admin-defined custom appointment)
- `service_name_snapshot`
- `duration_minutes_snapshot`
- `start_at`
- `end_at`
- `status`
- `customer_note`
- `service_notes`
- `final_price`
- `created_by`
- `confirmed_by`
- `confirmed_at`
- `completed_at`
- `cancelled_at`
- `created_at`
- `updated_at`
- `version`

Appointment status:

- `PENDING_CONFIRMATION`
- `CONFIRMED`
- `REJECTED`
- `CANCELLATION_REQUESTED`
- `CANCELLED`
- `COMPLETED`
- `NO_SHOW`

The service name and duration are snapshotted so later service-catalog edits do not change historical appointments.

### `appointment_status_history`

- `id`
- `appointment_id`
- `from_status`
- `to_status`
- `reason`
- `changed_by`
- `changed_at`

### `cancellation_request`

- `id`
- `appointment_id`
- `requested_by`
- `reason`
- `status`: `PENDING | APPROVED | REJECTED`
- `reviewed_by`
- `review_note`
- `requested_at`
- `reviewed_at`

Keeping the request separate preserves its history even after the appointment returns to `CONFIRMED` or becomes `CANCELLED`.

## 5. Media and collections

### `media_asset`

- `id`
- `storage_provider`
- `bucket`
- `object_key`
- `original_filename`
- `content_type`
- `size_bytes`
- `width`
- `height`
- `processing_status`: `UPLOADED | PROCESSING | READY | FAILED`
- `uploaded_by`
- `created_at`

### `collection_item`

- `id`
- `customer_id`
- `appointment_id` (nullable)
- `title`
- `description`
- `visit_date`
- `created_by`
- `created_at`
- `updated_at`
- `deleted_at`

### `collection_item_media`

- `collection_item_id`
- `media_asset_id`
- `display_order`

### `collection_item_tag`

- `collection_item_id`
- `tag`

## 6. Inspiration

### `inspiration_item`

- `id`
- `title`
- `description`
- `source_collection_item_id` (nullable)
- `published`
- `created_by`
- `created_at`
- `updated_at`
- `deleted_at`

### `inspiration_item_media`

- `inspiration_item_id`
- `media_asset_id`
- `display_order`

### `inspiration_item_tag`

- `inspiration_item_id`
- `tag`

### `inspiration_favorite`

- `user_id`
- `inspiration_item_id`
- `created_at`

The pair `(user_id, inspiration_item_id)` is unique.

## 7. Reliability and audit

### `outbox_event`

- `id`
- `aggregate_type`
- `aggregate_id`
- `event_type`
- `event_version`
- `payload` (`jsonb`)
- `correlation_id`
- `causation_id`
- `occurred_at`
- `published_at`
- `publish_attempts`
- `last_error`

### `processed_event`

- `consumer_name`
- `event_id`
- `processed_at`

The pair `(consumer_name, event_id)` is unique and supports idempotent consumers.

### `audit_log`

- `id`
- `actor_id`
- `action`
- `entity_type`
- `entity_id`
- `before_state` (`jsonb`)
- `after_state` (`jsonb`)
- `correlation_id`
- `created_at`

## 8. Booking integrity

The database must reject overlapping active appointments even when two requests arrive concurrently.

The implementation will use a PostgreSQL range overlap strategy with a GiST exclusion constraint or an equivalent transaction-safe locking design. Active occupancy includes:

- `PENDING_CONFIRMATION`
- `CONFIRMED`
- `CANCELLATION_REQUESTED`

Availability blocks are checked in the same booking transaction.

Admin bookings may be outside normal business hours, but use the same 30-minute alignment and conflict protection as user bookings unless an explicitly designed override feature is added later.

