# Kuri Labo Web

React + TypeScript web workspace for the Kuri Labo admin experience.

## Run locally

Start PostgreSQL and the Spring Boot API first:

```powershell
docker compose -f infrastructure/docker-compose.yml up -d postgres
cd backend/kuri-api
.\mvnw.cmd spring-boot:run
```

In a second terminal, start the web application:

```powershell
cd web
npm install
npm run dev
```

Open `http://127.0.0.1:3000`.

Vite proxies `/api` requests to `http://127.0.0.1:8080`, so local browser
requests use the same origin and HttpOnly refresh cookies work correctly.

## Available screens

- Admin login with refresh-cookie sessions
- Responsive dashboard
- Appointment list and pending confirmation actions
- Searchable client list
- Service catalog and service creation
- Full monthly schedule and 24-hour daily timeline in Vancouver salon time
- Admin appointment creation with automatic service-duration end times
- Partial-day and full-day availability blocks, including block removal
- Inspiration route shell for the next implementation slice

## Checks

```powershell
npm run typecheck
npm run build
```
