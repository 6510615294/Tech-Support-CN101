# Tech-Support-CN101

A tech-support / code-grading platform with an AI-powered backend, Next.js frontend, Judge0 code execution, and full observability via Grafana + Loki.

---

## Architecture

```
                    ┌─────────────────────┐
                    │   Nginx Proxy Mgr   │
                    │   (reverse proxy)   │
                    └─────┬───────┬───────┘
                          │       │
               ┌──────────▼──┐ ┌──▼──────────┐
               │  Frontend   │ │  Backend    │
               │  Next.js    │ │  Go API     │
               │  :3000      │ │  :8080      │
               └─────────────┘ └──┬──────┬───┘
                                  │      │
                    ┌─────────────▼┐  ┌──▼──────────┐
                    │  PostgreSQL  │  │  Redis      │
                    │  :5432       │  │  (internal) │
                    └──────────────┘  └─────────────┘
                                  │
               ┌──────────────────▼────────────────────┐
               │              Judge0                    │
               │  server + workers (internal)           │
               │  ├── judge0-db (PostgreSQL 16)         │
               │  └── judge0-redis                      │
               └────────────────────────────────────────┘

               ┌──────────────┐  ┌──────────────────┐
               │   MinIO      │  │  Grafana + Loki   │
               │  :9000 (API) │  │  :3001            │
               │  :9001 (UI)  │  │  (logs & metrics) │
               └──────────────┘  └───────────────────┘
```

---

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) + [Docker Compose](https://docs.docker.com/compose/install/) (v2+)
- Git
- (Optional) [Nginx Proxy Manager](https://nginxproxymanager.com/) — for domain/SSL

---

## Quick Start

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd Tech-Support-CN101
```

### 2. Configure environment variables

```bash
cd docker
cp .env.example .env
```

Edit `docker/.env` and set your values:

```env
# App Database
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres          # change in production
POSTGRES_DB=app_db

# Redis
REDIS_PASSWORD=redispassword        # change in production

# MinIO
MINIO_ACCESS_KEY=admin
MINIO_SECRET_KEY=password           # change in production

# Judge0 (internal — no internet exposure)
JUDGE0_POSTGRES_DB=judge0
JUDGE0_POSTGRES_USER=judge0
JUDGE0_POSTGRES_PASSWORD=judge0password   # change in production
JUDGE0_REDIS_PASSWORD=judge0redispassword # change in production

# Grafana
GRAFANA_ADMIN_USER=admin
GRAFANA_ADMIN_PASSWORD=admin        # change in production

# Frontend — set to your domain or server IP
NEXT_PUBLIC_API_URL=http://localhost:8080/api
```

### 3. Configure backend `.env`

Create `backend/.env` (this is loaded by the API and worker containers):

```env
DATABASE_URL=postgres://postgres:postgres@postgres:5432/app_db?sslmode=disable
JWT_SECRET=your-jwt-secret
REDIS_ADDRESS=redis:6379
REDIS_PASSWORD=redispassword
JUDGE0_URL=http://judge0-server:2358

# MinIO
MINIO_ENDPOINT=minio:9000
MINIO_ACCESS_KEY=admin
MINIO_SECRET_KEY=password
MINIO_BUCKET=my-bucket
MINIO_USE_SSL=false
STORAGE_TYPE=minio

# Other integrations
TU_API=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=
AI_SECRET_KEY=
ENV=production
```

> **Important:** The hostnames (`postgres`, `redis`, `minio`, `judge0-server`) are Docker internal names — they work automatically inside containers. Do not use `localhost`.

### 4. Start everything

```bash
cd docker
docker compose up -d --build
```

This single command builds and starts **all 14 services**.

### 5. Verify

```bash
docker compose ps
```

You should see all services running. Check health:

| Service | URL | Purpose |
|---------|-----|---------|
| Frontend | http://localhost:3000 | Web UI |
| Backend API | http://localhost:8080 | REST API |
| MinIO Console | http://localhost:9001 | File storage UI |
| Grafana | http://localhost:3001 | Logs & monitoring |

---

## Service Overview

| Service | Container | Host Port | Exposed | Purpose |
|---------|-----------|-----------|---------|---------|
| PostgreSQL 18 | `postgres` | 5432 | Yes | App database |
| Redis 7 | `redis` | — | No | Job queue / cache |
| MinIO | `minio` | 9000, 9001 | Yes | S3-compatible file storage |
| Backend API | `go-api` | 8080 | Yes | Go REST API server |
| Backend Worker | `go-worker` | — | No | Background job processor |
| Frontend | `frontend` | 3000 | Yes | Next.js web app |
| Judge0 Server | `judge0-server` | — | No | Code execution engine |
| Judge0 Workers | `judge0-workers` | — | No | Code execution workers |
| Judge0 DB | `judge0-db` | — | No | Judge0 PostgreSQL |
| Judge0 Redis | `judge0-redis` | — | No | Judge0 job queue |
| Loki | `loki` | — | No | Log aggregation |
| Promtail | `promtail` | — | No | Log shipper |
| Grafana | `grafana` | 3001 | Yes | Observability dashboard |

---

## Connecting Nginx Proxy Manager

If you already have Nginx Proxy Manager (NPM) running, connect it to the Docker network so it can route traffic to your services.

### Option A: Connect existing NPM container

```bash
# Find your NPM container name
docker ps | grep nginx-proxy-manager

# Connect it to the public network
docker network connect docker_public <your-npm-container-name>
```

### Option B: Add NPM to the compose

Add this to the `services:` section in `docker/docker-compose.yml`:

```yaml
  nginx-proxy-manager:
    image: jc21/nginx-proxy-manager:latest
    container_name: nginx-proxy-manager
    ports:
      - "80:80"       # HTTP
      - "443:443"     # HTTPS
      - "81:81"       # NPM Admin UI
    volumes:
      - npm_data:/data
      - npm_letsencrypt:/etc/letsencrypt
    restart: unless-stopped
    <<: [*default-logging, *default-networks]
```

Add to the `volumes:` section:

```yaml
  npm_data:
  npm_letsencrypt:
```

### Proxy Host configuration

In NPM Admin UI (`http://your-server:81`), create these **Proxy Hosts**:

| Domain | Scheme | Forward Host | Forward Port | SSL |
|--------|--------|--------------|--------------|-----|
| `yourdomain.com` | http | `frontend` | `3000` | Enable Let's Encrypt |
| `api.yourdomain.com` | http | `api` | `8080` | Enable Let's Encrypt |
| `grafana.yourdomain.com` | http | `grafana` | `3000` | Enable Let's Encrypt |
| `minio.yourdomain.com` | http | `minio` | `9001` | Enable Let's Encrypt |
| `s3.yourdomain.com` | http | `minio` | `9000` | Enable Let's Encrypt |

> **Note:** Use the **container port** (internal), not the host port. For example Grafana's internal port is `3000` even though it's mapped to `3001` on the host.

### When using NPM, update these values

1. `docker/.env` → `NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api`
2. Rebuild frontend: `docker compose up -d --build frontend`

---

## Directory Structure

```
Tech-Support-CN101/
├── backend/                  # Go backend
│   ├── cmd/
│   │   ├── server/           # API entrypoint
│   │   └── worker/           # Worker entrypoint
│   ├── internal/             # Business logic
│   ├── Dockerfile
│   ├── go.mod / go.sum
│   └── .env                  # Backend config (gitignored)
│
├── frontend/                 # Next.js frontend
│   ├── src/
│   ├── public/
│   ├── Dockerfile
│   ├── package.json
│   └── next.config.ts
│
├── docker/                   # Unified Docker setup
│   ├── docker-compose.yml    # Single compose — everything
│   ├── .env                  # Docker env vars
│   ├── judge0.conf           # Judge0 configuration
│   ├── promtail-config.yml   # Log shipping config
│   ├── init-db.sql           # Database init script
│   └── grafana/
│       ├── dashboards/       # Pre-built dashboards
│       └── provisioning/     # Datasource & dashboard auto-config
│
└── README.md
```

---

## Useful Commands

```bash
# Start all services
docker compose up -d --build

# Stop all services
docker compose down

# Stop and remove volumes (⚠️ deletes all data)
docker compose down -v

# View logs
docker compose logs -f api
docker compose logs -f worker
docker compose logs -f judge0-server

# Restart a single service
docker compose restart api

# Pull latest Judge0 image
docker compose pull judge0-server judge0-workers
docker compose up -d
```

---

## Production Checklist

- [ ] Change all default passwords in `docker/.env` and `backend/.env`
- [ ] Set `NEXT_PUBLIC_API_URL` to your actual domain
- [ ] Enable SSL via Nginx Proxy Manager (Let's Encrypt)
- [ ] Remove host port mappings for services that should only be behind NPM
- [ ] Set `ENV=production` in `backend/.env`
- [ ] Set up database backups (`pg_dump` cron job)
- [ ] Review `judge0.conf` submission limits for your use case
- [ ] Configure MinIO bucket after first run (access via console at `:9001`)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js, React, TypeScript |
| Backend | Go (Gin/Echo) |
| Database | PostgreSQL 18 |
| Cache / Queue | Redis 7 |
| Code Execution | Judge0 |
| File Storage | MinIO (S3-compatible) |
| Observability | Grafana, Loki, Promtail |
| Reverse Proxy | Nginx Proxy Manager |
