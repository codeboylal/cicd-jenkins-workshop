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
- Backend: http://localhost:8090
- Backend health check: http://localhost:8090/api/health

## Project layout

```
frontend/               nginx + static HTML/CSS/JS, reverse-proxies /api to backend
backend/                Node/Express API, talks to Postgres
db/                     init.sql — schema + seed data
docker-compose.yml      local dev (builds from source)
docker-compose.deploy.yml   deploy target — pulls images from Docker Hub,
                             shared by every environment (dev, prod, ...)
.env.dev, .env.prod     per-environment config (ports, DB name) for
                         docker-compose.deploy.yml — add a new .env.<name>
                         file to add an environment, never edit the compose
                         file itself
Jenkinsfile             the pipeline used in the workshop; ENVIRONMENT is
                         derived from the Jenkins job name (see comments
                         at the top of the file)
```

## Multiple environments on one host

`docker-compose.deploy.yml` is written once and reused for every
environment. What makes `dev` and `prod` safe to run on the same machine
at the same time:

- **Compose project name** (`-p tasktracker-<env>`) namespaces container
  names, the network, and volumes automatically.
- **`.env.<env>`** supplies the one thing a project name can't namespace:
  the host port (`FRONTEND_PORT`), plus the DB name.

```bash
docker compose -p tasktracker-dev  --env-file .env.dev  -f docker-compose.deploy.yml up -d
docker compose -p tasktracker-prod --env-file .env.prod -f docker-compose.deploy.yml up -d
```

Adding a third environment (`staging`, a student's own sandbox, ...) is
one new `.env.staging` file plus one Jenkins job named to match — never a
copy-pasted compose file with hand-edited ports.
