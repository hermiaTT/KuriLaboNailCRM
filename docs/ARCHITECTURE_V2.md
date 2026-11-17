# Kuri Labo Architecture V2

## 1. Architecture goals

- Keep the existing Kuri Labo visual direction while replacing Supabase completely.
- Serve Expo mobile and React web clients through one backend contract.
- Begin as a modular monolith so core booking rules remain easy to understand and test.
- Introduce Kafka through real asynchronous use cases rather than splitting services prematurely.
- Preserve a clear path toward independently deployable notification, media, and analytics workers.
- Make concurrency, reliability, observability, and failure recovery demonstrable in interviews.

## 2. Target system

```text
Expo mobile ─┐
             ├── HTTPS/JSON ──> Spring Boot API ──> PostgreSQL
React web  ──┘                       │     │
                                    │     └──> MinIO / S3-compatible storage
                                    │
                                    └──> Transactional outbox ──> Kafka
                                                                    ├──> Notification worker
                                                                    ├──> Media worker
                                                                    └──> Analytics worker
```

## 3. Repository layout

```text
apps/
  mobile/                  Expo React Native application
  web/                     React + Vite web application

backend/
  kuri-api/                Spring Boot modular monolith
  notification-worker/     later Kafka consumer
  media-worker/            later Kafka consumer

packages/
  api-client/              generated TypeScript client from OpenAPI
  design-tokens/           shared visual constants and assets

infrastructure/
  docker-compose.yml
  monitoring/

docs/
  REQUIREMENTS_V2.md
  ARCHITECTURE_V2.md
  DATA_MODEL_V2.md
```

The existing Expo app stays in its current location during migration. It will move to `apps/mobile` only after the new API is stable, avoiding a large unrelated file move at the beginning.

## 4. Backend modules

The first release is one Spring Boot deployable with strict module boundaries:

```text
com.kurilabo
  auth
  user
  servicecatalog
  appointment
  availability
  collection
  inspiration
  media
  notification
  audit
  outbox
  shared
```

Each module owns its domain model, application services, persistence adapters, and HTTP endpoints. Modules communicate through application interfaces or domain events rather than reading one another's repositories directly.

## 5. Client architecture

### React web

- React + TypeScript + Vite
- React Router for user and admin route groups
- TanStack Query for server state
- React Hook Form for forms
- generated OpenAPI client for backend calls
- responsive layouts, with desktop-oriented admin screens

### Expo mobile

- existing React Native + Expo UI retained and migrated screen by screen
- no direct database access
- access and refresh credentials stored using platform-secure storage
- the same generated API contract as the web app

Business rules such as booking availability remain authoritative on the backend. Clients may calculate previews for UX, but must accept the backend decision.

## 6. Authentication and authorization

- Spring Security owns authentication and role authorization.
- Password hashes use Argon2 or BCrypt.
- Web authentication uses secure, HttpOnly cookies.
- Mobile authentication uses short-lived access tokens and rotating refresh tokens stored securely.
- Refresh-token records can be revoked per device.
- Endpoints apply explicit `USER` or `ADMIN` authorization.
- Resource ownership is checked in application services, not trusted from client-supplied IDs.

## 7. Booking consistency

Booking creation is synchronous and transactional:

1. validate identity, service, time increment, and business-hour rules;
2. acquire the required database protection against competing bookings;
3. reject any overlap with active appointments or availability blocks;
4. insert the `PENDING_CONFIRMATION` appointment;
5. insert an outbox event in the same transaction;
6. commit;
7. return the result to the client.

PostgreSQL provides the final overlap guarantee. A frontend availability result never guarantees that a later booking request will succeed.

All timestamps are stored as timezone-aware instants. Business-hour calculations use the salon timezone stored in settings, initially `America/Vancouver`.

## 8. Event-driven design

The API writes business data and an `outbox_event` row in the same transaction. An outbox publisher sends unpublished events to Kafka and records successful publication.

Initial event types:

- `UserRegisteredV1`
- `AppointmentRequestedV1`
- `AppointmentConfirmedV1`
- `AppointmentRejectedV1`
- `AppointmentCancellationRequestedV1`
- `AppointmentCancelledV1`
- `AppointmentCompletedV1`
- `MediaUploadedV1`
- `InspirationFavoritedV1`

Initial topics:

- `kuri.appointments.v1`
- `kuri.users.v1`
- `kuri.media.v1`
- `kuri.inspiration.v1`

Every event includes:

- unique event ID;
- event type and schema version;
- aggregate ID;
- occurrence timestamp;
- correlation and causation IDs;
- payload.

Consumers provide at-least-once handling and store processed event IDs for idempotency. Failed messages use bounded retries followed by a dead-letter topic.

## 9. Service extraction path

The following components are extracted first because their work is asynchronous and does not own booking consistency:

1. Notification worker
2. Media-processing worker
3. Analytics projection worker

The appointment module remains inside the main API until load or organizational needs justify an independent Booking Service.

## 10. Media storage

- PostgreSQL stores metadata only.
- Development uses MinIO through an S3-compatible interface.
- Production can use AWS S3, Cloudflare R2, or another S3-compatible provider.
- Uploads use generated object keys rather than user filenames.
- Media processing is asynchronous after the original upload is safely stored.

## 11. Observability

- structured JSON logs with correlation IDs;
- Spring Boot Actuator health and readiness endpoints;
- Micrometer metrics exported to Prometheus;
- Grafana dashboards;
- OpenTelemetry traces across HTTP, database, outbox, Kafka producer, and Kafka consumer work;
- audit records for admin changes and appointment state transitions.

## 12. Delivery phases

### Phase 1: Foundation

- Spring Boot API skeleton
- PostgreSQL and Flyway
- Docker Compose development environment
- health endpoint
- database schema baseline

### Phase 2: Core synchronous product

- authentication and authorization
- profiles and service catalog
- availability and concurrency-safe appointment requests
- admin confirmation and cancellation workflow
- integration tests with Testcontainers

### Phase 3: Clients

- React web user and admin applications
- generated TypeScript API client
- migrate Expo screens away from Supabase

### Phase 4: Events and workers

- transactional outbox
- Kafka
- notification and media workers
- retry, dead-letter, and idempotency demonstrations

### Phase 5: Production readiness

- monitoring and tracing
- rate limiting
- backup and restore procedure
- load and concurrency tests
- deployment documentation

