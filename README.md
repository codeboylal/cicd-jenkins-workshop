# Task Tracker — Jenkins CI/CD Workshop

A minimal 3-tier app (nginx frontend → Node/Express backend → Postgres) used
as the hands-on project for a 3-hour "industry-standard CI/CD with Jenkins"
workshop.

See [WORKSHOP.md](WORKSHOP.md) for the full lab guide, flow diagram, and
timeline.

## Run it locally

```bash
cp .env.example .env
docker compose up --build
```

- Frontend: http://localhost:8081
- Backend health check: http://localhost:8090/api/health

## Project layout

```
frontend/   nginx + static HTML/CSS/JS, reverse-proxies /api to backend
backend/    Node/Express API, talks to Postgres
db/         init.sql — schema + seed data
docker-compose.yml        local dev (builds from source)
docker-compose.prod.yml   EC2 deploy target (pulls images from Docker Hub)
Jenkinsfile                the pipeline used in the workshop
```
