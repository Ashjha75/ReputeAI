# Spring Boot Docker Setup - Complete Guide

## 📋 Table of Contents
1. [What We Built](#what-we-built)
2. [Project Structure](#project-structure)
3. [Configuration Files](#configuration-files)
4. [Understanding Each Component](#understanding-each-component)
5. [Commands Reference](#commands-reference)
6. [Troubleshooting](#troubleshooting)

---

## 🎯 What We Built

We created a Docker setup that:
- ✅ Builds your Spring Boot application into a Docker container
- ✅ Connects to external Aiven MySQL database
- ✅ Runs Redis in a separate container for caching
- ✅ Loads all configuration from environment variables
- ✅ Works differently for Docker vs IntelliJ local development

---

## 📁 Project Structure

```
your-project/
├── src/
│   └── main/
│       ├── java/
│       │   └── com/reputeai/server/reputeai/
│       │       ├── ReputeaiApplication.java
│       │       └── config/
│       │           └── RedissonConfig.java  ← Updated to read correct properties
│       └── resources/
│           ├── application.yml              ← Base configuration (common settings)
│           ├── application-dev.yml          ← Development config (for Docker)
│           ├── application-prod.yml         ← Production config (for production)
│           └── application-local.yml        ← Local config (for IntelliJ) - NEW!
│
├── Dockerfile                               ← Instructions to build Docker image
├── docker-compose.yml                       ← Orchestrates multiple containers
├── .env                                     ← Environment variables (secrets)
├── .gitignore                               ← Don't commit secrets!
└── pom.xml                                  ← Maven dependencies
```

---

## 📝 Configuration Files

### 1. Dockerfile

**Purpose:** Instructions to build your Spring Boot app into a Docker image.

**What it does:**
- Uses multi-stage build (smaller final image)
- Stage 1: Builds the JAR file using Maven
- Stage 2: Runs the JAR using lightweight Java runtime
- Creates a non-root user for security
- Exposes port 8080

```dockerfile
# Multi-stage build for Spring Boot
FROM maven:3.9.4-eclipse-temurin-21 AS build
WORKDIR /app

# Download dependencies first (cached layer)
COPY pom.xml .
RUN mvn dependency:go-offline

# Build the application
COPY src ./src
RUN mvn clean package -DskipTests

# Runtime stage - only contains what's needed to run
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Security: create non-root user
RUN addgroup -S spring && adduser -S spring -G spring

# Create logs directory
RUN mkdir -p /app/logs && chown -R spring:spring /app/logs

# Copy JAR from build stage
COPY --from=build /app/target/*.jar app.jar

USER spring:spring

EXPOSE 8080

ENV SPRING_PROFILES_ACTIVE=dev

ENTRYPOINT ["java", "-jar", "app.jar"]
```

**Simple Explanation:**
- **Line 1-2:** Use Maven with Java 21 to build
- **Line 5-6:** Copy pom.xml and download dependencies
- **Line 9-10:** Copy source code and build JAR
- **Line 13:** Switch to smaller runtime image (no Maven needed)
- **Line 16:** Create a user named "spring" (safer than root)
- **Line 22:** Copy the built JAR from previous stage
- **Line 28:** Run the JAR file when container starts

---

### 2. docker-compose.yml

**Purpose:** Defines and connects multiple containers (your app + Redis).

**What it does:**
- Defines 2 services: `app` (Spring Boot) and `redis`
- Sets environment variables for configuration
- Creates a network so containers can talk to each other
- Adds health checks to ensure services are ready

```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: reputeai-app
    ports:
      - "8080:8080"  # Map container port 8080 to host port 8080
    environment:
      # Profile to use (dev/prod)
      - SPRING_PROFILES_ACTIVE=dev
      - SERVER_PORT=8080
      
      # MySQL Database (external Aiven)
      - SPRING_DATASOURCE_URL=jdbc:mysql://mysql-host:16125/defaultdb?sslMode=REQUIRED
      - SPRING_DATASOURCE_USERNAME=avnadmin
      - SPRING_DATASOURCE_PASSWORD=your_password
      
      # Redis (Docker container)
      - SPRING_REDIS_HOST=redis  # "redis" is the service name below
      - SPRING_REDIS_PORT=6379
      
      # JWT Configuration
      - JWT_EXPIRATION_MS=3600000
      - JWT_REFRESH_EXPIRATION_MS=604800000
      - JWT_RESET_EXPIRATION_MS=3600000
      
      # AWS Configuration
      - AWS_ACCESS_KEY_ID=your_key
      - AWS_SECRET_ACCESS_KEY=your_secret
      - AWS_REGION=ap-south-1
      
    depends_on:
      redis:
        condition: service_healthy  # Wait for Redis to be ready
    networks:
      - reputeai-net
    restart: unless-stopped
    dns:
      - 8.8.8.8  # Google DNS (helps resolve external databases)
      - 8.8.4.4

  redis:
    image: redis:8.2-alpine
    container_name: reputeai-redis
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data  # Persist Redis data
    networks:
      - reputeai-net
    command: redis-server --appendonly yes  # Enable data persistence
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  redis-data:  # Named volume for Redis data

networks:
  reputeai-net:
    driver: bridge  # Private network for containers
```

**Simple Explanation:**

**App Service:**
- `build`: Build from Dockerfile in current directory
- `ports`: Make app accessible at http://localhost:8080
- `environment`: Configuration variables (replaces application.yml values)
- `depends_on`: Wait for Redis before starting
- `dns`: Custom DNS servers to resolve external database hostname

**Redis Service:**
- `image`: Use official Redis image
- `volumes`: Save data even if container restarts
- `healthcheck`: Verify Redis is working before app starts
- `command`: Enable persistence (save data to disk)

**Networks:**
- Creates a private network where `app` can reach `redis` by name

---

### 3. .env File

**Purpose:** Store sensitive configuration (passwords, secrets) - NOT committed to git!

```bash
# Spring Boot Configuration
SPRING_PROFILES_ACTIVE=dev
SPRING_FLYWAY_ENABLED=true

# MySQL Database (Aiven Cloud)
SPRING_DATASOURCE_URL=jdbc:mysql://mysql-host:16125/defaultdb?sslMode=REQUIRED&serverTimezone=UTC
SPRING_DATASOURCE_USERNAME=avnadmin
SPRING_DATASOURCE_PASSWORD=your_password_here

# Redis
SPRING_REDIS_HOST=redis
SPRING_REDIS_PORT=6379

# JWT Secrets
JWT_PRIVATE_KEY=your_private_key
JWT_PUBLIC_KEY=your_public_key
JWT_EXPIRATION_MS=3600000
JWT_REFRESH_EXPIRATION_MS=604800000
JWT_RESET_EXPIRATION_MS=3600000

# AWS Credentials
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_REGION=ap-south-1
AWS_S3_BUCKET=your_bucket_name

# App Configuration
APP_DOMAIN=http://localhost:8080/api/auth
APP_JWTSECRET=your_jwt_secret
CORS_ALLOWED_ORIGINS=http://localhost:4200,http://localhost:8080
```

**Simple Explanation:**
- One variable per line: `KEY=value`
- No spaces around `=`
- Docker Compose automatically loads this file
- **NEVER commit this to git!** (add to .gitignore)

---

### 4. application-dev.yml

**Purpose:** Spring Boot configuration for Docker development environment.

```yaml
spring:
  datasource:
    url: ${SPRING_DATASOURCE_URL}
    username: ${SPRING_DATASOURCE_USERNAME}
    password: ${SPRING_DATASOURCE_PASSWORD}
    driver-class-name: com.mysql.cj.jdbc.Driver
  
  data:
    redis:
      host: ${SPRING_REDIS_HOST:redis}
      port: ${SPRING_REDIS_PORT:6379}

jwt:
  expiration-ms: ${JWT_EXPIRATION_MS:3600000}
  refresh-token:
    expiration-ms: ${JWT_REFRESH_EXPIRATION_MS:604800000}
  reset-token:
    expiration-ms: ${JWT_RESET_EXPIRATION_MS:3600000}

app:
  jwtSecret: ${APP_JWTSECRET}
```

**Simple Explanation:**
- `${VARIABLE_NAME}` reads from environment variable
- `:default_value` provides fallback if variable not set
- Docker passes environment variables from `.env` file
- Spring Boot reads these and configures the application

---

### 5. application-local.yml

**Purpose:** Spring Boot configuration for IntelliJ local development.

```yaml
spring:
  datasource:
    url: jdbc:mysql://mysql-host:16125/defaultdb?sslMode=REQUIRED
    username: avnadmin
    password: your_password
  
  data:
    redis:
      host: localhost  # Different from Docker!
      port: 6379

jwt:
  expiration-ms: 3600000
  refresh-token:
    expiration-ms: 604800000
```

**Simple Explanation:**
- Hard-coded values for local development
- Uses `localhost` for Redis (not `redis`)
- Only used when you run from IntelliJ with `local` profile
- **Add to .gitignore** to keep secrets private

---

### 6. Updated RedissonConfig.java

**Purpose:** Connects to Redis for caching and rate limiting.

**What changed:**
- Old: Read from `spring.redis.host` (doesn't exist)
- New: Read from `spring.data.redis.host` (standard Spring Boot property)

```java
@Value("${spring.data.redis.host:localhost}")
private String redisHost;

@Value("${spring.data.redis.port:6379}")
private int redisPort;
```

**Simple Explanation:**
- Reads Redis hostname from Spring Boot properties
- Falls back to `localhost` if not set
- Works for both Docker (`redis`) and IntelliJ (`localhost`)

---

## 🚀 Commands Reference

### Initial Setup

```bash
# 1. Navigate to project directory
cd /path/to/your/project

# 2. Create .env file with your configuration
nano .env  # or use your text editor

# 3. Add .env to .gitignore
echo ".env" >> .gitignore
echo "src/main/resources/application-local.yml" >> .gitignore

# 4. Make sure Docker is running
docker --version
docker-compose --version
```

### Build and Run

```bash
# Build and start containers (first time or after code changes)
docker-compose up --build

# Start containers (if already built)
docker-compose up

# Start in background (detached mode)
docker-compose up -d

# View logs
docker-compose logs -f

# View logs for specific service
docker-compose logs -f app
docker-compose logs -f redis
```

### Management Commands

```bash
# Stop containers (keeps data)
docker-compose stop

# Stop and remove containers (keeps data in volumes)
docker-compose down

# Stop and remove everything including volumes (deletes Redis data)
docker-compose down -v

# Rebuild without cache (clean build)
docker-compose build --no-cache

# View running containers
docker-compose ps

# View all Docker containers
docker ps -a

# View Docker images
docker images
```

### Debugging Commands

```bash
# Check what environment variables Docker sees
docker-compose config

# Execute command inside running container
docker exec -it reputeai-app bash

# Check environment variables inside container
docker exec -it reputeai-app env | grep SPRING

# Check Redis connection from app container
docker exec -it reputeai-app ping redis

# Check if Redis is working
docker exec -it reputeai-redis redis-cli ping
# Should return: PONG
```

### Cleanup Commands

```bash
# Remove stopped containers
docker-compose rm

# Remove unused images
docker image prune

# Remove unused volumes
docker volume prune

# Remove everything unused (dangerous!)
docker system prune -a --volumes
```

---

## 🔍 Understanding Key Concepts

### 1. Multi-Stage Docker Build

**Why?**
- Stage 1 (build): Large image with Maven (500MB+)
- Stage 2 (runtime): Small image with only Java (150MB)
- Final image is smaller and faster to deploy

**How it works:**
```dockerfile
FROM maven AS build     # Heavy build environment
# ... build stuff ...

FROM java:jre          # Lightweight runtime
COPY --from=build      # Copy only the JAR
```

### 2. Environment Variables Flow

```
.env file
  ↓
docker-compose.yml reads .env
  ↓
Passes variables to container
  ↓
application-dev.yml reads variables
  ↓
Spring Boot configures application
```

### 3. Network Communication

```
Your Computer (localhost)
  ↓
  Port 8080 exposed
  ↓
Docker Network (reputeai-net)
  ├── reputeai-app (talks to "redis")
  └── reputeai-redis (hostname: "redis")
```

### 4. Container Hostname Resolution

**Inside Docker network:**
- `redis` → resolves to Redis container IP
- Service names become hostnames

**From your computer:**
- `localhost:8080` → your app
- `localhost:6379` → Redis (if port exposed)

### 5. Property Binding in Spring Boot

Spring Boot automatically converts environment variables:

```
SPRING_REDIS_HOST=redis
  ↓ (Spring Boot magic)
spring.data.redis.host=redis
  ↓ (Read in code)
@Value("${spring.data.redis.host}")
```

**Conversion rules:**
- `UPPERCASE_WITH_UNDERSCORES` → `lowercase.with.dots`
- `SPRING_DATA_REDIS_HOST` → `spring.data.redis.host`

---

## 🐛 Troubleshooting

### Problem: "Failed to convert String to long"

**Cause:** Environment variable for JWT expiration is empty or missing.

**Solution:**
```bash
# Check .env file has:
JWT_EXPIRATION_MS=3600000
JWT_REFRESH_EXPIRATION_MS=604800000
JWT_RESET_EXPIRATION_MS=3600000

# Rebuild
docker-compose down
docker-compose up --build
```

### Problem: "UnknownHostException: redis"

**Cause:**
- Running locally in IntelliJ with `dev` profile
- IntelliJ can't resolve `redis` hostname (only works in Docker)

**Solution:**
```bash
# Option 1: Use local profile in IntelliJ
# Set Active profiles: local

# Option 2: Start local Redis
docker run -d -p 6379:6379 redis:8.2-alpine

# Option 3: Override Redis host
# Add to IntelliJ Run Configuration environment variables:
SPRING_REDIS_HOST=localhost
```

### Problem: "Communications link failure" (MySQL)

**Cause:** Can't connect to Aiven MySQL database.

**Solution:**
```bash
# 1. Check connection string format
SPRING_DATASOURCE_URL=jdbc:mysql://host:port/db?sslMode=REQUIRED

# 2. Verify DNS can resolve hostname
docker exec -it reputeai-app ping mysql-host.aivencloud.com

# 3. Check database credentials are correct

# 4. Ensure firewall allows connection
```

### Problem: Container keeps restarting

**Debug:**
```bash
# View logs
docker-compose logs -f app

# Check exit code
docker ps -a

# See what went wrong
docker logs reputeai-app
```

### Problem: Changes not reflected after rebuild

**Solution:**
```bash
# Clean build
docker-compose down
docker-compose build --no-cache
docker-compose up
```

### Problem: Port 8080 already in use

**Solution:**
```bash
# Find what's using the port
# Windows:
netstat -ano | findstr :8080

# Linux/Mac:
lsof -i :8080

# Kill the process or change port in docker-compose.yml:
ports:
  - "8081:8080"  # Host port 8081, container port 8080
```

---

## 📚 Differences: Docker vs IntelliJ

| Aspect | Docker | IntelliJ |
|--------|--------|----------|
| **Profile** | `dev` | `local` |
| **Config File** | `application-dev.yml` | `application-local.yml` |
| **Redis Host** | `redis` (service name) | `localhost` |
| **Environment Variables** | From `.env` file | Hard-coded in YAML |
| **Database** | External Aiven MySQL | External Aiven MySQL |
| **How to Run** | `docker-compose up` | Click Run button |

---

## 🎯 Quick Start Checklist

- [ ] Create `.env` file with all variables
- [ ] Add `.env` to `.gitignore`
- [ ] Update `RedissonConfig.java` to use `spring.data.redis.host`
- [ ] Create `application-local.yml` for IntelliJ
- [ ] Update `application-dev.yml` to read from environment variables
- [ ] Build: `docker-compose build`
- [ ] Run: `docker-compose up`
- [ ] Check logs: `docker-compose logs -f app`
- [ ] Test: Visit http://localhost:8080

---

## 🔐 Security Best Practices

1. **Never commit secrets:**
   ```bash
   # .gitignore
   .env
   application-local.yml
   ```

2. **Use different credentials for each environment**
    - Development: `.env`
    - Production: Environment variables or secrets manager

3. **Rotate credentials regularly**
    - Change passwords every 90 days
    - Use strong, unique passwords

4. **Use non-root user in Docker**
    - Already configured: `USER spring:spring`

5. **Enable SSL for databases**
    - Already configured: `?sslMode=REQUIRED`

---

## 📖 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Spring Boot Docker Guide](https://spring.io/guides/gs/spring-boot-docker/)
- [Dockerfile Best Practices](https://docs.docker.com/develop/develop-images/dockerfile_best-practices/)

---

## 🆘 Need Help?

Common issues and solutions are in the [Troubleshooting](#troubleshooting) section above.

For more help:
1. Check container logs: `docker-compose logs -f`
2. Verify environment variables: `docker-compose config`
3. Test Redis connectivity: `docker exec -it reputeai-redis redis-cli ping`
4. Check application health: `curl http://localhost:8080/actuator/health`