# Dubai Real Estate Lead Generation Backend (Phase 0)

Production-ready TypeScript backend foundation for enterprise lead generation workflows.

## Stack

- Node.js 20.x
- TypeScript 5.x (strict)
- Express 4.x
- MongoDB (Mongoose)
- Redis 7 (ioredis)
- Joi validation
- JWT authentication
- Winston logging
- Jest + Supertest
- ESLint + Prettier

## Quick Start

1. Copy environment file:

```bash
cp .env.example .env
```

2. Install dependencies:

```bash
npm install
```

3. Start local infra:

```bash
docker compose up -d mongodb redis
```

4. Run development server:

```bash
npm run dev
```

Server URL: http://localhost:5000

## Scripts

- `npm run dev` - Development mode with auto-reload
- `npm run build` - Compile TypeScript
- `npm run start` - Run compiled server
- `npm run lint` - Lint source and tests
- `npm run test` - Run tests with coverage
- `npm run typecheck` - Strict type checking

## API Base

- Base path: `/api/v1`
- OpenAPI: [docs/openapi.yaml](docs/openapi.yaml)

## Security Features

- Helmet headers
- Strict CORS origin controls
- JWT access + refresh tokens
- Bcrypt password hashing
- Request validation with Joi
- Redis-backed rate limiting with graceful fallback
- Sensitive field redaction in logs

## Docker

Run full stack:

```bash
docker compose up --build
```

## Production Deployment

1. Build image:

```bash
docker build -t dubai-leadgen-backend:latest .
```

2. Run container:

```bash
docker run -d --name leadgen-api --env-file .env -p 5000:5000 dubai-leadgen-backend:latest
```

3. Optional PM2 process manager:

```bash
npm install -g pm2
pm2 start ecosystem.config.js
```

## Health Endpoints

- `GET /api/v1/health`
- `GET /api/v1/health/detailed`

## Testing

- Unit tests: scoring, deduplication, validators, crypto
- Integration tests: auth validation, health, protected endpoints
- Coverage target: 80% global threshold in Jest config
