# 🚀 Deployment Guide - WhatsApp Command Center

Fast deployment guide for production and development environments.

## ⚡ Quick Start (One Command)

```bash
# Development
./deploy.sh  # Choose option 1

# Production
./deploy.sh  # Choose option 2
```

---

## 🐳 Docker Deployment (Recommended)

### Development Environment
```bash
# Start all services with hot reload
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f

# Stop
docker-compose -f docker-compose.dev.yml down
```

**Includes:**
- Next.js with hot reload (port 3000)
- PostgreSQL database (port 5432)
- Redis cache (port 6379)
- Prisma Studio available via `--profile tools`

### Production Environment
```bash
# Copy environment file
cp .env.example .env
# Edit .env with your production values

# Start services
docker-compose up -d

# Check health
curl http://localhost:3000/api/health

# View logs
docker-compose logs -f app

# Stop
docker-compose down
```

**Production Features:**
- Multi-stage Docker build (optimized size)
- Health checks for all services
- Auto-restart policies
- Resource limits
- Non-root user execution
- Security headers enabled

---

## 📦 Build Times

| Environment | Build Time | Image Size |
|------------|-----------|------------|
| Development | ~2-3 min | ~1.2 GB |
| Production | ~3-5 min | ~400 MB |

**Optimization Features:**
- Layer caching
- Multi-stage builds
- Standalone Next.js output
- npm cache cleaning
- Alpine Linux base

---

## 🌐 Deployment Platforms

### Vercel (Fastest - 30 seconds)
```bash
npm install -g vercel
vercel --prod
```

### Railway
```bash
railway login
railway init
railway up
```

### Render
1. Connect GitHub repository
2. Select "Web Service"
3. Build: `npm run build`
4. Start: `npm start`

### AWS ECS/Fargate
```bash
# Build and push to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com
docker build -t whatsapp-hub .
docker tag whatsapp-hub:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/whatsapp-hub:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/whatsapp-hub:latest

# Deploy to ECS (use terraform/cloudformation)
```

### Kubernetes (Production Scale)
```yaml
# See k8s/ directory for full manifests
kubectl apply -f k8s/
```

### DigitalOcean App Platform
```bash
doctl apps create --spec .do/app.yaml
```

---

## 🔧 Environment Variables

### Required
```bash
DATABASE_URL=postgresql://user:pass@host:5432/db
REDIS_URL=redis://host:6379
NEXTAUTH_SECRET=your-secret-key-min-32-chars
NEXTAUTH_URL=https://your-domain.com
```

### AI Providers (Choose at least one)
```bash
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GEMINI_API_KEY=AIzaS...
CUSTOM_LLM_ENDPOINT=http://localhost:11434
```

### Optional
```bash
REDIS_PASSWORD=your-redis-password
SENTRY_DSN=https://...  # Error tracking
GOOGLE_ANALYTICS_ID=G-...  # Analytics
```

---

## 📊 Monitoring & Health Checks

### Health Endpoint
```bash
curl http://localhost:3000/api/health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-20T12:00:00Z",
  "uptime": 3600,
  "services": {
    "database": "healthy",
    "redis": "healthy"
  }
}
```

### Docker Health Checks
```bash
docker ps  # Check HEALTH status column
docker inspect <container-id> | grep Health
```

---

## 🔄 CI/CD Pipeline

GitHub Actions automatically:
1. **Lint** - ESLint + TypeScript check
2. **Test** - Unit & integration tests
3. **Build** - Next.js production build
4. **Docker** - Build & push to registry
5. **Deploy** - Auto-deploy to production

### Manual Trigger
```bash
gh workflow run ci-cd.yml
```

---

## ⚙️ Performance Optimizations

### Next.js Config
- ✅ SWC minification
- ✅ Standalone output
- ✅ Image optimization (AVIF, WebP)
- ✅ Package import optimization
- ✅ Compression enabled

### Docker
- ✅ Multi-stage builds
- ✅ Layer caching
- ✅ Alpine Linux (~50MB base)
- ✅ Non-root user
- ✅ Health checks

### Database
- ✅ Connection pooling (Prisma)
- ✅ Query optimization
- ✅ Proper indexing

### Caching
- ✅ Redis for sessions
- ✅ Redis for presence tracking
- ✅ HTTP response caching

---

## 🔐 Security Checklist

- [x] Security headers configured
- [x] HTTPS enforcement
- [x] Rate limiting enabled
- [x] CORS configuration
- [x] JWT authentication
- [x] Input validation (Zod)
- [x] SQL injection prevention (Prisma)
- [x] XSS prevention
- [x] CSRF protection
- [x] Non-root Docker user
- [x] Secrets management (.env)
- [x] Regular dependency updates

---

## 🐛 Troubleshooting

### App won't start
```bash
# Check logs
docker-compose logs app

# Check database connection
docker-compose exec postgres pg_isready

# Reset everything
docker-compose down -v
docker-compose up -d
```

### Database connection failed
```bash
# Check PostgreSQL
docker-compose exec postgres psql -U postgres -c "SELECT 1"

# Run migrations
docker-compose exec app npx prisma migrate deploy
```

### Redis connection failed
```bash
# Check Redis
docker-compose exec redis redis-cli ping

# Should return PONG
```

### Build fails
```bash
# Clear Docker cache
docker system prune -a

# Rebuild from scratch
docker-compose build --no-cache
```

---

## 📈 Scaling

### Horizontal Scaling
```bash
# Scale app instances
docker-compose up -d --scale app=3

# Load balancer required (nginx, traefik)
```

### Database
- Use read replicas for reporting
- Connection pooling (PgBouncer)
- Separate analytics database

### Redis
- Redis Cluster for high availability
- Redis Sentinel for failover
- Separate cache and sessions

---

## 📞 Support

- **Documentation**: [Full docs](./README.md)
- **Issues**: [GitHub Issues](https://github.com/your-repo/issues)
- **Health Check**: `GET /api/health`

---

## 🎯 Deployment Checklist

Before deploying to production:

- [ ] Set strong `NEXTAUTH_SECRET` (32+ chars)
- [ ] Configure production database
- [ ] Set up Redis with password
- [ ] Add AI provider API keys
- [ ] Configure domain and SSL
- [ ] Set up monitoring (Sentry, etc.)
- [ ] Configure backup strategy
- [ ] Test health endpoints
- [ ] Run security audit
- [ ] Set up CI/CD
- [ ] Configure rate limits
- [ ] Test WhatsApp connection
- [ ] Set up error logging
- [ ] Configure email notifications
- [ ] Test disaster recovery

---

**Deployment time: 2-5 minutes** ⚡

**Zero downtime updates: Yes** ✅

**Auto-scaling: Platform dependent** 📈
