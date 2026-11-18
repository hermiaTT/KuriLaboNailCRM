# Kuri Labo Railway deployment

The web client and Spring Boot API are built into one Docker image so they share
one HTTPS origin. PostgreSQL remains a separate private Railway service.

## Railway resources

1. Create a project from the GitHub repository.
2. Add Railway PostgreSQL to the same project.
3. On the application service, add a persistent volume mounted at `/data`.
4. Generate a public domain for the application service.

## Application variables

Set these on the application service. Reference the actual Railway PostgreSQL
service name if it is not named `Postgres`.

```text
DATABASE_URL=jdbc:postgresql://${{Postgres.PGHOST}}:${{Postgres.PGPORT}}/${{Postgres.PGDATABASE}}
DATABASE_USER=${{Postgres.PGUSER}}
DATABASE_PASSWORD=${{Postgres.PGPASSWORD}}
MEDIA_STORAGE_PATH=/data/media
AUTH_TOKEN_SECRET=<at least 32 random bytes>
AUTH_SECURE_COOKIE=true
PORT=8080
```

Do not copy local `.env` secrets into Railway. Flyway applies database migrations
when the application starts.

## After deployment

- Open `/actuator/health/readiness` and confirm `UP`.
- Register the first account and change its role to `ADMIN` in PostgreSQL, or
  migrate the existing local database securely.
- Enable database and volume backups before using real customer data.
