# BundLink Self-Hosting Deployment Guide

## Quick Start

### 1. Clone and Configure

```bash
git clone <repository>
cd bundlink

# Create environment file
cp .env.example .env
```

### 2. Configure Environment Variables

Edit `.env`:

```bash
# Required
DB_PASSWORD=your_secure_password
SESSION_SECRET=your_32_char_random_string

# Auth Provider (choose one: replit, keycloak, local)
AUTH_PROVIDER=keycloak

# Keycloak (if using Keycloak auth)
KEYCLOAK_REALM=bundlink
KEYCLOAK_CLIENT_ID=bundlink-app
KEYCLOAK_CLIENT_SECRET=your_client_secret
KEYCLOAK_ADMIN_PASSWORD=admin

# Optional: AI features
OLLAMA_MODEL=llama3.2
```

### 3. Start Services

```bash
# Basic (App + PostgreSQL)
docker-compose up -d

# With Keycloak auth
docker-compose --profile keycloak up -d

# With AI features (Ollama)
docker-compose --profile ai up -d

# Full production setup
docker-compose --profile keycloak --profile ai --profile production up -d
```

### 4. Initialize Database

```bash
# Run migrations
docker-compose exec app npm run db:push
```

### 5. Setup Keycloak (if using)

1. Open http://localhost:8080
2. Login with admin / ${KEYCLOAK_ADMIN_PASSWORD}
3. Create realm: `bundlink`
4. Create client: `bundlink-app`
5. Create realm roles: `bundlink-federal`, `bundlink-state`, `bundlink-local`
6. Assign roles to users

---

## GeoIP Setup

Download GeoLite2-Country database from MaxMind:

1. Create free account at https://www.maxmind.com
2. Download GeoLite2-Country.mmdb
3. Place in `./geoip/GeoLite2-Country.mmdb`

```bash
mkdir -p geoip
# Copy downloaded file
cp ~/Downloads/GeoLite2-Country.mmdb ./geoip/
```

---

## AI Features (Ollama)

### Enable AI

```bash
docker-compose --profile ai up -d

# Pull the model
docker-compose exec ollama ollama pull llama3.2
```

### Features
- **Auto-Metadata**: Generates title/description from URL
- **Phishing Detection**: Analyzes reported links for threats
- **Routing Suggestions**: AI-powered routing rule recommendations

---

## SSL/HTTPS Setup

### Using Let's Encrypt

1. Create `nginx.conf`:

```nginx
events {
    worker_connections 1024;
}

http {
    upstream bundlink {
        server app:5000;
    }

    server {
        listen 80;
        server_name your-domain.com;
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl;
        server_name your-domain.com;

        ssl_certificate /etc/nginx/ssl/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/privkey.pem;

        location / {
            proxy_pass http://bundlink;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

2. Generate certificates:

```bash
certbot certonly --standalone -d your-domain.com
mkdir -p ssl
cp /etc/letsencrypt/live/your-domain.com/* ./ssl/
```

3. Start with production profile:

```bash
docker-compose --profile production up -d
```

---

## Backup & Restore

### Backup Database

```bash
docker-compose exec postgres pg_dump -U bundlink bundlink > backup.sql
```

### Restore Database

```bash
cat backup.sql | docker-compose exec -T postgres psql -U bundlink bundlink
```

### Backup Volumes

```bash
docker run --rm \
  -v bundlink_postgres_data:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/postgres-backup.tar.gz /data
```

---

## Monitoring

### Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f app
```

### Health Check

```bash
curl http://localhost:5000/api/health
```

---

## Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DB_PASSWORD` | Yes | - | PostgreSQL password |
| `SESSION_SECRET` | Yes | - | Session encryption key (32+ chars) |
| `AUTH_PROVIDER` | No | `replit` | Auth system: `replit`, `keycloak`, `local` |
| `KEYCLOAK_URL` | If Keycloak | `http://keycloak:8080` | Keycloak server URL |
| `KEYCLOAK_REALM` | If Keycloak | `bundlink` | Keycloak realm name |
| `KEYCLOAK_CLIENT_ID` | If Keycloak | `bundlink-app` | OIDC client ID |
| `KEYCLOAK_CLIENT_SECRET` | If Keycloak | - | OIDC client secret |
| `GEOIP_DB_PATH` | No | `/app/geoip/GeoLite2-Country.mmdb` | GeoIP database path |
| `OLLAMA_URL` | No | `http://ollama:11434` | Ollama API URL |
| `OLLAMA_MODEL` | No | `llama3.2` | AI model to use |

---

## Troubleshooting

### App won't start

```bash
# Check logs
docker-compose logs app

# Verify database connection
docker-compose exec app npm run db:push
```

### Keycloak connection failed

1. Ensure Keycloak is running: `docker-compose ps`
2. Check realm and client configuration
3. Verify callback URL matches

### AI features not working

```bash
# Check Ollama status
docker-compose exec ollama ollama list

# Pull model if missing
docker-compose exec ollama ollama pull llama3.2
```

---

## Security Checklist

- [ ] Change default passwords
- [ ] Enable HTTPS
- [ ] Configure firewall (only expose 80/443)
- [ ] Set up database backups
- [ ] Enable audit logging
- [ ] Configure rate limiting
- [ ] Set up monitoring/alerting
