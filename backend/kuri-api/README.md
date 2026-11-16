# Kuri API

Spring Boot backend for Kuri Labo.

## Prerequisites

- Java 21
- Docker Desktop

The project includes Maven Wrapper, so a global Maven installation is not required.

## Start PostgreSQL

From the repository root:

```powershell
docker compose -f infrastructure/docker-compose.yml up -d postgres
```

## Run the API

From `backend/kuri-api`:

```powershell
.\mvnw.cmd spring-boot:run
```

Flyway applies the database migrations automatically.

Health endpoint:

```text
GET http://localhost:8080/actuator/health
```

## Current API

Public endpoints:

```text
GET  /api/v1/services
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/refresh
POST /api/v1/auth/logout
```

Authenticated endpoints:

```text
GET  /api/v1/users/me
GET  /api/v1/availability?date=YYYY-MM-DD&serviceId={uuid}
GET  /api/v1/appointments/me
POST /api/v1/appointments
POST /api/v1/appointments/{appointmentId}/cancellation-requests
```

Admin endpoints:

```text
GET  /api/v1/admin/users
GET  /api/v1/admin/users/{userId}
PUT  /api/v1/admin/users/{userId}
GET  /api/v1/admin/services
POST /api/v1/admin/services
PUT  /api/v1/admin/services/{serviceId}
DELETE /api/v1/admin/services/{serviceId}
GET  /api/v1/admin/appointments
POST /api/v1/admin/appointments
POST /api/v1/admin/appointments/{appointmentId}/confirm
POST /api/v1/admin/appointments/{appointmentId}/reject
POST /api/v1/admin/appointments/{appointmentId}/cancellation-requests/approve
POST /api/v1/admin/appointments/{appointmentId}/cancellation-requests/reject
GET  /api/v1/admin/availability-blocks?from=YYYY-MM-DD&to=YYYY-MM-DD
POST /api/v1/admin/availability-blocks
DELETE /api/v1/admin/availability-blocks/{blockId}
```

Deleting a service is a soft delete: it becomes inactive, remains available to
historical appointments, and is omitted from the public service catalog. Service
durations must use 30-minute increments. An admin cannot disable or remove their
own admin role through the user-management endpoint.

Use `clientType: "MOBILE"` to receive a refresh token in the JSON response. Use
`clientType: "WEB"` to receive the refresh token as an HttpOnly cookie instead.

The development token secret in `application.yml` is not suitable for deployment.
Production must provide a strong `AUTH_TOKEN_SECRET` environment variable and set
`AUTH_SECURE_COOKIE=true` behind HTTPS.

