# Multi-stage Dockerfile for building and running the Spring Boot application
# Builder stage: builds the fat JAR using Maven
FROM maven:3.9.4-eclipse-temurin-21 AS builder
WORKDIR /workspace

# Copy only Maven wrapper and pom first for cached dependency download
COPY mvnw mvnw.cmd pom.xml ./
COPY .mvn .mvn

# Copy source and build
COPY src ./src
RUN mvn -B -DskipTests package

# Runtime stage: slim Java runtime
FROM eclipse-temurin:21-jre
WORKDIR /app
ARG JAR_FILE=target/*.jar
COPY --from=builder /workspace/target/*.jar app.jar

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]

