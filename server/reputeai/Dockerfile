# Multi-stage build for Spring Boot
FROM maven:3.9.4-eclipse-temurin-21 AS build
WORKDIR /app

# Copy pom.xml and download dependencies
COPY pom.xml .
RUN mvn dependency:go-offline

# Copy source code and build
COPY src ./src
RUN mvn clean package -DskipTests

# Runtime stage
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Create a non-root user before persisting logs
RUN addgroup -S spring && adduser -S spring -G spring

# Ensure log directory exists for Logback with proper ownership
RUN mkdir -p /app/logs && chown -R spring:spring /app/logs

# Copy the jar from build stage
COPY --from=build /app/target/*.jar app.jar

USER spring:spring

# Expose port
EXPOSE 8080

# Use environment variable for active profile
ENV SPRING_PROFILES_ACTIVE=dev

# Run the application
ENTRYPOINT ["java", "-jar", "app.jar"]