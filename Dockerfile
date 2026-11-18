FROM node:22-alpine AS web-build
WORKDIR /build/web
COPY web/package*.json ./
RUN npm ci
COPY web/ ./
RUN npm run build

FROM maven:3.9-eclipse-temurin-21 AS api-build
WORKDIR /build/api
COPY backend/kuri-api/pom.xml ./
RUN mvn -B dependency:go-offline
COPY backend/kuri-api/src ./src
COPY --from=web-build /build/web/dist ./src/main/resources/static
RUN mvn -B -DskipTests package

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=api-build /build/api/target/kuri-api-0.0.1-SNAPSHOT.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75.0", "-jar", "/app/app.jar"]
