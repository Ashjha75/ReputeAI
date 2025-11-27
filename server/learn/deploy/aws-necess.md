# AWS Essentials for Deploying Spring Boot Apps with ECS Fargate and RDS MySQL

# 1. AWS Fundamentals

1. **IAM basics**

- Users, roles, policies
- Why you never use the root account
- Access keys & MFA

2. **VPC basics**

- Public vs private subnets
- Security groups
- NAT gateway vs Internet gateway

3. **Regions & Availability Zones**

---

# 2. Networking & Security

1. **How ALB works**
    - Target groups
    - Health checks
    - Listeners (HTTP/HTTPS)

2. **Security groups**
    - Inbound rules
    - ALB → ECS communication

3. **DNS**
    - Route 53 hosted zones
    - A-record alias to ALB

4. **TLS/SSL**
    - ACM certificates
    - HTTP → HTTPS redirect

---

# 3. Docker & Containerization

1. **Build & run Docker images locally**
2. **Dockerfile best practices**
    - Small images
    - Non-root user
    - Exposing port
    - Health checks

3. **Tagging strategy**
    - `latest` vs version tags (`v1`, `v2`, git-sha)

---

# 4. ECS Fargate Essentials

1. **What a task definition is**
2. **Execution role vs task role**
3. **awsvpc networking mode**
4. **Scaling (desired / min / max count)**
5. **Deployments**
    - Rolling updates
    - Circuit breaker rollback

---

# 5. ECR (Container Registry)

1. **Repository creation**
2. **Authentication (docker login)**
3. **Pushing images**
4. **Lifecycle policies** (clean old images)

---

# 6. RDS MySQL Knowledge

1. **Subnet placement (private recommended)**
2. **Connectivity**
    - RDS SG → ECS SG
    - Why DB should not be public

3. **DB endpoints**
4. **Backups & retention**
5. **Parameter groups (if needed)**

---

# 7. Secrets & Configuration

1. **AWS Secrets Manager basics**
    - Secret structure (JSON)
    - Retrieving keys from ECS tasks

2. **Environment variables in Spring Boot**
    - `SPRING_DATASOURCE_URL`
    - `SPRING_PROFILES_ACTIVE`

3. **Externalizing config** (never hardcode)

---

# 8. Application Readiness

1. **Actuator health endpoints**
2. **Graceful shutdown**
3. **Database migrations**
    - Use Flyway
    - Avoid manually exposing DB to the internet

4. **Resource limits**
    - JVM memory within Fargate memory
    - Container CPU tuning

---

# 9. Logs, Monitoring & Troubleshooting

1. **CloudWatch Logs**
2. **ECS service events**
3. **ALB target health**
4. **RDS logs**
5. **Metrics**
    - CPU, memory
    - Request count
    - Error rates

---

# 10. Cost Awareness

1. **Fargate pricing (per vCPU + memory per second)**
2. **RDS pricing (instance + storage)**
3. **ALB hourly cost**
4. **NAT gateway cost**
5. **Free-tier limits**
6. **How to shut down resources safely**

---

# 11. Deployment Workflow

1. **How to rebuild and push a new image**
2. **How to update ECS service**
3. **How to rollback to a previous version**
4. **CI/CD basics**
    - GitHub Actions → ECR → ECS

---

# 12. Essential CLI Commands to Know

- `aws configure`
- `aws sts get-caller-identity`
- `aws ecr get-login-password`
- `aws ecs describe-services`
- `aws logs tail`
- `aws rds describe-db-instances`

---
