This README explains how to build and run the `reputeai` Spring Boot service with Docker, and how to push images to AWS ECR.

Build (local)

1. Build the image locally (uses Maven inside the Docker builder stage):

```bash
# from project root (where pom.xml exists)
docker build -t reputeai:latest .
```

2. Run locally:

```bash
docker run --rm -p 8080:8080 \
  -e SPRING_PROFILES_ACTIVE=local \
  -e SPRING_DATASOURCE_URL=jdbc:mysql://host:3306/dbname \
  -e SPRING_DATASOURCE_USERNAME=user \
  -e SPRING_DATASOURCE_PASSWORD=pass \
  reputeai:latest
```

Push to AWS ECR (high level)

1. Authenticate Docker to ECR (replace <region> and <account-id>):

```bash
aws ecr get-login-password --region <region> | docker login --username AWS --password-stdin <account-id>.dkr.ecr.<region>.amazonaws.com
```

2. Create repository (if missing):

```bash
aws ecr create-repository --repository-name reputeai --region <region>
```

3. Tag and push:

```bash
docker tag reputeai:latest <account-id>.dkr.ecr.<region>.amazonaws.com/reputeai:latest
docker push <account-id>.dkr.ecr.<region>.amazonaws.com/reputeai:latest
```

Notes
- The Dockerfile uses a multi-stage build with Maven and Temurin Java 21. Ensure your project builds locally with `mvn -U clean package` before relying on the container build.
- Keep secrets out of the image; provide credentials via environment variables or AWS Secrets Manager.

