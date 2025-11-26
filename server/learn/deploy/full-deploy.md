# 🚀 Complete AWS Deployment Guide for Spring Boot with Docker

## Overview

### What We'll Deploy

```
┌─────────────────────────────────────────────────────────────┐
│                    INTERNET (Users)                          │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────┐
│              Route 53 (DNS - yourdomain.com)                 │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────┐
│        Application Load Balancer (ALB) - HTTPS/SSL          │
│                  Port 443 (HTTPS)                            │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────┐
│             ECS Fargate (Docker Container)                   │
│              Spring Boot App (Port 8080)                     │
│         Automatically scales: 1-4 containers                 │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────┐
│              RDS MySQL (Database)                            │
│              Private Subnet (Secure)                         │
└─────────────────────────────────────────────────────────────┘

```

### Why This Architecture?

- **ECS Fargate**: No servers to manage, AWS handles everything
- **Docker**: Your app runs the same way everywhere
- **RDS**: Fully managed database with automatic backups
- **ALB**: Load balancing + SSL/HTTPS
- **Auto-scaling**: App grows/shrinks based on traffic

---

## Prerequisites

### ✅ What You Need

1.  **Your Spring Boot project** with:
    - `Dockerfile`
    - `docker-compose.yml`
    - `.env` file

2.  **AWS Account** (we'll create this together)
3.  **Domain name** (optional but recommended)
    - If you don't have one, you can buy from Route 53 (~$12/year)

4.  **Your laptop** with:
    - AWS CLI installed
    - Docker installed
    - Terminal/Command Prompt

---

## AWS Account Setup

### Step 1: Create AWS Account

1.  **Go to**: https://aws.amazon.com/
2.  **Click**: "Create an AWS Account"
3.  **Fill in**:
    - Email address
    - Password
    - AWS account name (e.g., "ReputeAI")
4.  **Choose**: Personal account
5.  **Enter**: Credit card details (required, but we'll use free tier)
6.  **Verify**: Phone number (SMS verification)
7.  **Select**: Free plan

**Important**: You get 12 months of free tier!

### Step 2: Secure Your Account

1.  **Enable MFA (Multi-Factor Authentication)**:
    - Go to: IAM Console → Your username → Security credentials
    - Click "Assign MFA device"
    - Use Google Authenticator app

2.  **Create Admin User** (Don't use root account):

    ```
    Go to: IAM → Users → Add user
    Username: admin-user
    Access type: ✅ Programmatic access + ✅ AWS Management Console access
    Permissions: Attach existing policy → AdministratorAccess

    ```

3.  **Download credentials CSV** and save it securely!

### Step 3: Install AWS CLI

**On Windows**:

```powershell
# Download installer
https://awscli.amazonaws.com/AWSCLIV2.msi

# Install and verify
aws --version

```

**On Mac**:

```bash
brew install awscli
aws --version

```

**On Linux**:

```bash
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
aws --version

```

### Step 4: Configure AWS CLI

```bash
aws configure

# Enter when prompted:
AWS Access Key ID: [from CSV file]
AWS Secret Access Key: [from CSV file]
Default region name: us-east-1
Default output format: json

```

**Test connection**:

```bash
aws sts get-caller-identity
# Should show your account details

```

---

## Option 1: AWS ECS with Fargate (Recommended)

### Why Fargate?

- ✅ No servers to manage
- ✅ AWS handles updates, scaling, security
- ✅ Pay only for what you use
- ✅ Perfect for Docker apps

### Architecture Overview

```
Your Docker Image → ECR → ECS Fargate → ALB → Internet
                     ↓
                   RDS MySQL

```

---

### Step 1: Prepare Your Docker Image

**1.1 Review Your Dockerfile**

Make sure your `Dockerfile` looks like this:

```dockerfile
# Use official OpenJDK 21 image
FROM eclipse-temurin:21-jre-alpine

# Set working directory
WORKDIR /app

# Copy JAR file
COPY target/reputeai-0.0.1-SNAPSHOT.jar app.jar

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/actuator/health || exit 1

# Run application
ENTRYPOINT ["java", "-jar", "app.jar"]

```

**1.2 Build Your Project**

```bash
# Navigate to your project directory
cd /path/to/your/reputeai-project

# Build with Maven
mvn clean package -DskipTests

# Verify JAR was created
ls -lh target/reputeai-0.0.1-SNAPSHOT.jar

```

---

### Step 2: Create ECR Repository (Docker Image Storage)

**What is ECR?**

- ECR = Elastic Container Registry
- It's like Docker Hub, but on AWS
- Stores your Docker images securely

**2.1 Create Repository**

```bash
# Create ECR repository
aws ecr create-repository \
  --repository-name reputeai \
  --region us-east-1

# Output will show repository URI:
# 123456789012.dkr.ecr.us-east-1.amazonaws.com/reputeai

```

**Save this URI! You'll need it.**

**2.2 Login to ECR**

```bash
# Get login command
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 123456789012.dkr.ecr.us-east-1.amazonaws.com

# Should see: "Login Succeeded"

```

**2.3 Build and Push Docker Image**

```bash
# Build image
docker build -t reputeai .

# Tag image for ECR
docker tag reputeai:latest 123456789012.dkr.ecr.us-east-1.amazonaws.com/reputeai:latest

# Push to ECR
docker push 123456789012.dkr.ecr.us-east-1.amazonaws.com/reputeai:latest

# This will take 2-5 minutes depending on your internet speed

```

---

### Step 3: Create RDS MySQL Database

**What is RDS?**

- RDS = Relational Database Service
- Fully managed MySQL database
- Automatic backups, updates, scaling

**3.1 Create Database via AWS Console**

1.  **Go to**: AWS Console → RDS → Create database
2.  **Choose settings**:

    ```
    Engine: MySQL 8.0
    Template: Free tier (for development)
    DB instance identifier: reputeai-db
    Master username: admin
    Master password: [Create strong password - save it!]

    ```

3.  **Instance configuration**:

    ```
    DB instance class: db.t3.micro (free tier)
    Storage: 20 GB
    Storage autoscaling: ✅ Enable (max 100 GB)

    ```

4.  **Connectivity**:

    ```
    VPC: Default VPC
    Public access: No (more secure)
    VPC security group: Create new
    Security group name: reputeai-db-sg

    ```

5.  **Additional configuration**:

    ```
    Initial database name: reputeai_db
    Backup retention: 7 days
    Enable encryption: ✅ Yes

    ```

6.  **Click**: "Create database"

**Wait 5-10 minutes for database to be ready.**

**3.2 Get Database Endpoint**

```bash
# Get database endpoint
aws rds describe-db-instances \
  --db-instance-identifier reputeai-db \
  --query 'DBInstances[0].Endpoint.Address' \
  --output text

# Will output something like:
# reputeai-db.abc123.us-east-1.rds.amazonaws.com

```

**Save this endpoint!**

**3.3 Run Database Migrations**

Connect from your local machine temporarily:

```bash
# Allow your IP to connect (temporary)
# Go to: RDS → reputeai-db → Connectivity & security → VPC security groups → Edit inbound rules
# Add rule:
# Type: MySQL/Aurora
# Port: 3306
# Source: My IP

# Connect from terminal
mysql -h reputeai-db.abc123.us-east-1.rds.amazonaws.com -u admin -p

# Enter password when prompted

# Create database
CREATE DATABASE IF NOT EXISTS reputeai_db;
USE reputeai_db;

# Exit
exit;

```

**Run Flyway migrations**:

```bash
# Update application.properties temporarily
spring.datasource.url=jdbc:mysql://reputeai-db.abc123.us-east-1.rds.amazonaws.com:3306/reputeai_db
spring.datasource.username=admin
spring.datasource.password=YOUR_PASSWORD

# Run migrations
mvn flyway:migrate

```

**Remove your IP from security group after migration!**

---

### Step 4: Create ECS Cluster

**What is ECS?**

- ECS = Elastic Container Service
- Runs Docker containers
- Fargate = Serverless mode (no EC2 servers)

**4.1 Create Cluster**

```bash
# Create ECS cluster
aws ecs create-cluster --cluster-name reputeai-cluster --region us-east-1

```

**Or via AWS Console**:

1.  Go to: ECS → Clusters → Create cluster
2.  Cluster name: `reputeai-cluster`
3.  Networking: Use default VPC
4.  Infrastructure: AWS Fargate (serverless)
5.  Click: Create

---

### Step 5: Create Secrets Manager Entries

**What is Secrets Manager?**

- Stores sensitive data (passwords, API keys)
- Automatically encrypted
- Never hardcode secrets!

**5.1 Store Database Credentials**

```bash
aws secretsmanager create-secret \
  --name reputeai/prod/db \
  --description "Database credentials" \
  --secret-string '{
    "username":"admin",
    "password":"YOUR_DB_PASSWORD",
    "host":"reputeai-db.abc123.us-east-1.rds.amazonaws.com",
    "port":"3306",
    "dbname":"reputeai_db"
  }' \
  --region us-east-1

```

**5.2 Store JWT Keys**

```bash
aws secretsmanager create-secret \
  --name reputeai/prod/jwt \
  --description "JWT signing keys" \
  --secret-string '{
    "privateKey":"YOUR_BASE64_PRIVATE_KEY",
    "publicKey":"YOUR_BASE64_PUBLIC_KEY",
    "secret":"YOUR_JWT_SECRET"
  }' \
  --region us-east-1

```

**5.3 Store OAuth Credentials**

```bash
aws secretsmanager create-secret \
  --name reputeai/prod/oauth \
  --description "OAuth credentials" \
  --secret-string '{
    "googleClientId":"YOUR_GOOGLE_CLIENT_ID",
    "googleClientSecret":"YOUR_GOOGLE_CLIENT_SECRET",
    "githubClientId":"YOUR_GITHUB_CLIENT_ID",
    "githubClientSecret":"YOUR_GITHUB_CLIENT_SECRET"
  }' \
  --region us-east-1

```

---

### Step 6: Create ECS Task Definition

**What is a Task Definition?**

- Blueprint for running your Docker container
- Defines CPU, memory, environment variables
- Like a recipe for your app

**6.1 Create Task Execution Role**

```bash
# Create trust policy file
cat > trust-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "ecs-tasks.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

# Create role
aws iam create-role \
  --role-name ecsTaskExecutionRole \
  --assume-role-policy-document file://trust-policy.json

# Attach policies
aws iam attach-role-policy \
  --role-name ecsTaskExecutionRole \
  --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy

aws iam attach-role-policy \
  --role-name ecsTaskExecutionRole \
  --policy-arn arn:aws:iam::aws:policy/SecretsManagerReadWrite

```

**6.2 Create Task Definition JSON**

**File:** `ecs-task-definition.json`

```json
{
	"family": "reputeai-task",
	"networkMode": "awsvpc",
	"requiresCompatibilities": ["FARGATE"],
	"cpu": "512",
	"memory": "1024",
	"executionRoleArn": "arn:aws:iam::YOUR_ACCOUNT_ID:role/ecsTaskExecutionRole",
	"containerDefinitions": [
		{
			"name": "reputeai-container",
			"image": "123456789012.dkr.ecr.us-east-1.amazonaws.com/reputeai:latest",
			"portMappings": [
				{
					"containerPort": 8080,
					"protocol": "tcp"
				}
			],
			"essential": true,
			"environment": [
				{
					"name": "SPRING_PROFILES_ACTIVE",
					"value": "prod"
				}
			],
			"secrets": [
				{
					"name": "DB_URL",
					"valueFrom": "arn:aws:secretsmanager:us-east-1:YOUR_ACCOUNT_ID:secret:reputeai/prod/db:host::"
				},
				{
					"name": "DB_USERNAME",
					"valueFrom": "arn:aws:secretsmanager:us-east-1:YOUR_ACCOUNT_ID:secret:reputeai/prod/db:username::"
				},
				{
					"name": "DB_PASSWORD",
					"valueFrom": "arn:aws:secretsmanager:us-east-1:YOUR_ACCOUNT_ID:secret:reputeai/prod/db:password::"
				}
			],
			"logConfiguration": {
				"logDriver": "awslogs",
				"options": {
					"awslogs-group": "/ecs/reputeai",
					"awslogs-region": "us-east-1",
					"awslogs-stream-prefix": "ecs"
				}
			},
			"healthCheck": {
				"command": [
					"CMD-SHELL",
					"wget --no-verbose --tries=1 --spider http://localhost:8080/actuator/health || exit 1"
				],
				"interval": 30,
				"timeout": 5,
				"retries": 3,
				"startPeriod": 60
			}
		}
	]
}
```

**6.3 Create CloudWatch Log Group**

```bash
aws logs create-log-group --log-group-name /ecs/reputeai --region us-east-1

```

**6.4 Register Task Definition**

```bash
# Get your account ID
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# Update task definition with your account ID
sed -i "s/YOUR_ACCOUNT_ID/$ACCOUNT_ID/g" ecs-task-definition.json

# Register task definition
aws ecs register-task-definition \
  --cli-input-json file://ecs-task-definition.json \
  --region us-east-1

```

---

### Step 7: Create Application Load Balancer

**What is ALB?**

- Distributes traffic across containers
- Handles SSL/HTTPS
- Health checks your app

**7.1 Create Security Groups**

```bash
# Get default VPC ID
VPC_ID=$(aws ec2 describe-vpcs --filters "Name=isDefault,Values=true" --query "Vpcs[0].VpcId" --output text)

# Create ALB security group
ALB_SG=$(aws ec2 create-security-group \
  --group-name reputeai-alb-sg \
  --description "Security group for ALB" \
  --vpc-id $VPC_ID \
  --query 'GroupId' \
  --output text)

# Allow HTTP and HTTPS
aws ec2 authorize-security-group-ingress \
  --group-id $ALB_SG \
  --protocol tcp \
  --port 80 \
  --cidr 0.0.0.0/0

aws ec2 authorize-security-group-ingress \
  --group-id $ALB_SG \
  --protocol tcp \
  --port 443 \
  --cidr 0.0.0.0/0

# Create ECS security group
ECS_SG=$(aws ec2 create-security-group \
  --group-name reputeai-ecs-sg \
  --description "Security group for ECS tasks" \
  --vpc-id $VPC_ID \
  --query 'GroupId' \
  --output text)

# Allow traffic from ALB to ECS
aws ec2 authorize-security-group-ingress \
  --group-id $ECS_SG \
  --protocol tcp \
  --port 8080 \
  --source-group $ALB_SG

echo "ALB Security Group: $ALB_SG"
echo "ECS Security Group: $ECS_SG"

```

**7.2 Create Application Load Balancer**

```bash
# Get subnet IDs
SUBNET_IDS=$(aws ec2 describe-subnets \
  --filters "Name=vpc-id,Values=$VPC_ID" \
  --query "Subnets[*].SubnetId" \
  --output text)

# Create ALB
ALB_ARN=$(aws elbv2 create-load-balancer \
  --name reputeai-alb \
  --subnets $SUBNET_IDS \
  --security-groups $ALB_SG \
  --scheme internet-facing \
  --type application \
  --ip-address-type ipv4 \
  --query 'LoadBalancers[0].LoadBalancerArn' \
  --output text)

echo "ALB ARN: $ALB_ARN"

# Get ALB DNS name
ALB_DNS=$(aws elbv2 describe-load-balancers \
  --load-balancer-arns $ALB_ARN \
  --query 'LoadBalancers[0].DNSName' \
  --output text)

echo "ALB DNS: $ALB_DNS"
echo "Your app will be accessible at: http://$ALB_DNS"

```

**7.3 Create Target Group**

```bash
# Create target group
TG_ARN=$(aws elbv2 create-target-group \
  --name reputeai-tg \
  --protocol HTTP \
  --port 8080 \
  --vpc-id $VPC_ID \
  --target-type ip \
  --health-check-enabled \
  --health-check-protocol HTTP \
  --health-check-path /actuator/health \
  --health-check-interval-seconds 30 \
  --health-check-timeout-seconds 5 \
  --healthy-threshold-count 2 \
  --unhealthy-threshold-count 3 \
  --query 'TargetGroups[0].TargetGroupArn' \
  --output text)

echo "Target Group ARN: $TG_ARN"

```

**7.4 Create Listener**

```bash
# Create HTTP listener (will redirect to HTTPS later)
aws elbv2 create-listener \
  --load-balancer-arn $ALB_ARN \
  --protocol HTTP \
  --port 80 \
  --default-actions Type=forward,TargetGroupArn=$TG_ARN

```

---

### Step 8: Create ECS Service

**What is an ECS Service?**

- Runs and maintains your containers
- Auto-restarts if container crashes
- Scales up/down based on traffic

```bash
# Get subnet IDs (comma-separated)
SUBNET_LIST=$(aws ec2 describe-subnets \
  --filters "Name=vpc-id,Values=$VPC_ID" \
  --query "Subnets[*].SubnetId" \
  --output text | tr '\t' ',')

# Create ECS service
aws ecs create-service \
  --cluster reputeai-cluster \
  --service-name reputeai-service \
  --task-definition reputeai-task \
  --desired-count 1 \
  --launch-type FARGATE \
  --platform-version LATEST \
  --network-configuration "awsvpcConfiguration={subnets=[$SUBNET_LIST],securityGroups=[$ECS_SG],assignPublicIp=ENABLED}" \
  --load-balancers "targetGroupArn=$TG_ARN,containerName=reputeai-container,containerPort=8080" \
  --health-check-grace-period-seconds 120 \
  --region us-east-1

```

**Wait 3-5 minutes for service to start.**

---

### Step 9: Verify Deployment

**9.1 Check Service Status**

```bash
# Check service
aws ecs describe-services \
  --cluster reputeai-cluster \
  --services reputeai-service \
  --query 'services[0].{Status:status,Running:runningCount,Desired:desiredCount}' \
  --output table

```

**Should show**:

```
---------------------------------
|       DescribeServices        |
+---------+-----------+----------+
| Desired | Running   | Status   |
+---------+-----------+----------+
|  1      |  1        | ACTIVE   |
+---------+-----------+----------+

```

**9.2 Test Your App**

```bash
# Get ALB DNS
echo "Your app is running at: http://$ALB_DNS"

# Test health endpoint
curl http://$ALB_DNS/actuator/health

# Should return: {"status":"UP"}

```

**9.3 Check Logs**

```bash
# View logs
aws logs tail /ecs/reputeai --follow

```

---

### Step 10: Setup Auto-Scaling (Optional but Recommended)

**What is Auto-Scaling?**

- Automatically adds containers when traffic increases
- Removes containers when traffic decreases
- Saves money!

```bash
# Register scalable target
aws application-autoscaling register-scalable-target \
  --service-namespace ecs \
  --scalable-dimension ecs:service:DesiredCount \
  --resource-id service/reputeai-cluster/reputeai-service \
  --min-capacity 1 \
  --max-capacity 4 \
  --region us-east-1

# Create scaling policy (scale based on CPU)
aws application-autoscaling put-scaling-policy \
  --service-namespace ecs \
  --scalable-dimension ecs:service:DesiredCount \
  --resource-id service/reputeai-cluster/reputeai-service \
  --policy-name cpu-scaling-policy \
  --policy-type TargetTrackingScaling \
  --target-tracking-scaling-policy-configuration '{
    "TargetValue": 70.0,
    "PredefinedMetricSpecification": {
      "PredefinedMetricType": "ECSServiceAverageCPUUtilization"
    },
    "ScaleInCooldown": 300,
    "ScaleOutCooldown": 60
  }' \
  --region us-east-1

```

**Now your app will**:

- Scale UP when CPU > 70%
- Scale DOWN when CPU < 70%
- Min containers: 1
- Max containers: 4

---

## Domain & SSL Setup

### Step 11: Setup Domain (Route 53)

**11.1 Buy Domain (if needed)**

1.  Go to: Route 53 → Registered domains → Register domain
2.  Search for domain (e.g., `reputeai.com`)
3.  Add to cart → Continue
4.  Fill in contact info
5.  Complete purchase (~$12/year)

**11.2 Create Hosted Zone**

```bash
# Create hosted zone
aws route53 create-hosted-zone \
  --name yourdomain.com \
  --caller-reference $(date +%s)

```

**11.3 Point Domain to ALB**

1.  Go to: Route 53 → Hosted zones → your domain
2.  Click "Create record"
3.  Settings:

    ```
    Record name: (leave empty for root domain)Record type: AAlias: YesRoute traffic to: Application and Classic Load BalancerRegion: us-east-1Load balancer: reputeai-alb

    ```

4.  Click "Create records"

**Wait 5-10 minutes for DNS to propagate.**

### Step 12: Setup SSL Certificate (HTTPS)

**12.1 Request Certificate**

```bash
# Request certificate
CERT_ARN=$(aws acm request-certificate \
  --domain-name yourdomain.com \
  --subject-alternative-names www.yourdomain.com \
  --validation-method DNS \
  --query 'CertificateArn' \
  --output text)

echo "Certificate ARN: $CERT_ARN"

```

**12.2 Validate Certificate**

```bash
# Get validation CNAME records
aws acm describe-certificate \
  --certificate-arn $CERT_ARN \
  --query 'Certificate.DomainValidationOptions[0].ResourceRecord'

```

**Add these CNAME records to Route 53**:

1.  Go to: Route 53 → Hosted zones → your domain
2.  Click "Create record"
3.  Copy Name and Value from above command
4.  Click "Create records"

**Wait 5-15 minutes for validation.**

**12.3 Add HTTPS Listener**

```bash
# Wait for certificate to be issued
aws acm wait certificate-validated --certificate-arn $CERT_ARN

# Create HTTPS listener
aws elbv2 create-listener \
  --load-balancer-arn $ALB_ARN \
  --protocol HTTPS \
  --port 443 \
  --certificates CertificateArn=$CERT_ARN \
  --default-actions Type=forward,TargetGroupArn=$TG_ARN

# Modify HTTP listener to redirect to HTTPS
HTTP_LISTENER=$(aws elbv2 describe-listeners \
  --load-balancer-arn $ALB_ARN \
  --query 'Listeners[?Port==`80`].ListenerArn' \
  --output text)

aws elbv2 modify-listener \
  --listener-arn $HTTP_LISTENER \
  --default-actions Type=redirect,RedirectConfig='{Protocol=HTTPS,Port=443,StatusCode=HTTP_301}'

```

**Now your app is accessible at**: `https://yourdomain.com` 🎉

---

## Updating Your Application

### Deploy New Version

```bash
# 1. Build new version
mvn clean package -DskipTests

# 2. Build Docker image
docker build -t reputeai .

# 3. Tag with new version
docker tag reputeai:latest 123456789012.dkr.ecr.us-east-1.amazonaws.com/reputeai:v2

# 4. Push to ECR
docker push 123456789012.dkr.ecr.us-east-1.amazonaws.com/reputeai:v2

# 5. Update task definition (change image tag to :v2)
# Edit ecs-task-definition.json
# Change: "image": "...reputeai:v2"

# 6. Register new task definition
aws ecs register-task-definition \
  --cli-input-json file://ecs-task-definition.json

# 7. Update service
aws ecs update-service \
  --cluster reputeai-cluster \
  --service reputeai-service \
  --task-definition reputeai-task \
  --force-new-deployment

# Wait 3-5 minutes for deployment

```

---

## Monitoring & Logs

### View Logs

```bash
# Real-time logs
aws logs tail /ecs/reputeai --follow

# Last 100 lines
aws logs tail /ecs/reputeai --since 10m

```

### CloudWatch Dashboard

1.  Go to: CloudWatch → Dashboards → Create dashboard
2.  Add widgets:
    - ECS CPU utilization
    - ECS memory utilization
    - ALB request count
    - ALB target response time

---

## Cost Estimation

### Monthly Costs (Free Tier - First 12 Months)

Service

Free Tier

After Free Tier

ECS Fargate

400 CPU-hours

~$15/month (1 container)

RDS MySQL (t3.micro)

750 hours

~$15/month

ALB

750 hours

~$20/month

ECR

500MB storage

~$1/month

**Total**

**FREE**

**~$50/month**

### Tips to Reduce Costs:

- Use free tier (first 12 months)
- Stop RDS during development (saves $15/month)
- Use t4g.micro instead of t3.micro (ARM-based, cheaper)
- Enable auto-scaling (scale down during low traffic)

---

## Complete Deployment Checklist

```
✅ AWS account created
✅ AWS CLI configured
✅ Docker image built and pushed to ECR
✅ RDS MySQL database created
✅ Database migrations run
✅ Secrets stored in Secrets Manager
✅ ECS cluster created
✅ Task definition registered
✅ ALB created with target group
✅ ECS service running
✅ Auto-scaling configured
✅ Domain configured in Route 53
✅ SSL certificate issued
✅ HTTPS listener added
✅ App accessible at https://yourdomain.com

```

---
