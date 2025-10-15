# Development Setup Guide

> **Get from git clone to running locally in 5 minutes**

## Prerequisites

- **Node.js 22+**
- **pnpm** (`npm install -g pnpm`)
- **Docker** (for PostgreSQL)
- **AWS CLI** (for SST deployment)

## Quick Start

```bash
# 1. Clone and install
git clone <repository-url>
cd app
pnpm install

# 2. Login to AWS (SST uses the 'app' profile)
aws sso login --profile app

# 3. Start database
pnpm db:local:up

# 4. Setup database schema
pnpm db:push

# 5. Seed database
pnpm db:seed

# 6. Start development (in 2 separate terminals)
pnpm dev:sst      # Terminal 1 - API/Lambda (must start first)
pnpm dev:app      # Terminal 2 - Mobile app
```

> **Note**: If SST commands fail with AWS auth errors, run `aws sso login --profile app` to refresh your session.

## Daily Development

```bash
# Start everything
pnpm db:local:up && pnpm dev:sst    # Terminal 1
pnpm dev:app                         # Terminal 2

# Stop database when done
pnpm db:local:down
```

## Common Tasks

### Database

```bash
pnpm db:push         # Quick schema sync (dev only)
pnpm db:generate     # Generate migration
pnpm db:migrate      # Apply migrations
pnpm db:studio       # Open DB GUI
```

### Testing

```bash
pnpm --filter @app/api test          # Run tests
pnpm --filter @app/api test:watch    # Watch mode
```

### Deployment

```bash
pnpm deploy                    # Deploy to AWS
pnpm deploy --stage production # Deploy to production
```

## Need More Info?

- **Coding patterns**: See `AGENTS.md`
- **API style guide**: See `packages/api/CODING_STYLE.md`
- **Project docs**: See `docs/` folder
