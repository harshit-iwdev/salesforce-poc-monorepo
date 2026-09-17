# Salesforce POC Fullstack Workspace

A complete, fullstack Salesforce integration solution featuring a NestJS backend (`salesforce-poc-be`) and a modern Next.js React frontend console (`salesforce-poc-fe`) with dynamic multi-org credential authentication.

---

## Workspace Structure
```text
salesforce-poc/
├── docker-compose.yml     # Docker Compose orchestration
├── package.json           # Root workspace config & scripts
├── dev.sh                 # Fast local start script
├── salesforce-poc-be/     # NestJS Backend API (JSForce, Dynamic Sessions, REST, Swagger)
│   └── Dockerfile
└── salesforce-poc-fe/     # Next.js 16 App Router Frontend Console (Vanilla CSS, SOQL Studio)
    └── Dockerfile
```

---

## Running with Docker Compose (Recommended)

To start both the Backend and Frontend in isolated containers simultaneously:

```bash
docker compose up --build
# or
sudo docker compose up --build
```

### Container Endpoints:
- 🚀 **Backend (NestJS API)**: [http://localhost:8000](http://localhost:8000) (Swagger UI at `/api`)
- 💻 **Frontend (Next.js Console)**: [http://localhost:3001](http://localhost:3001)

To stop the containers:
```bash
docker compose down
```

---

## Running Locally (without Docker)

```bash
./dev.sh
# or
npm run dev
```
