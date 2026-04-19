# RSR Data Hub

## Overview

Full-stack intelligence analysis platform. pnpm workspace monorepo with Express backend and React + Vite frontend.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite + Tailwind CSS (shadcn/ui components)
- **API framework**: Express 5
- **Persistence**: Local file-based storage (`data/signals.json`, `data/published.json`, `data/feeds.json`, `data/opslog.json`)
- **AI engine**: Ollama (local LLM, configurable) with heuristic fallback
- **Validation**: Zod (`zod/v4`), codegen via Orval
- **Build**: esbuild (server), Vite (frontend)

## Artifacts

- `artifacts/rsr-data-hub` — React frontend at `/`
- `artifacts/api-server` — Express API at `/api`

## Key API Endpoints

- `GET  /api/healthz` — health check
- `POST /api/analyze` — analyze raw signal text (Ollama → heuristic fallback)
- `GET  /api/signals` — list saved signals
- `POST /api/signals` — save a signal
- `POST /api/publish` — publish signal to published.json
- `GET  /api/feeds` — list active feeds
- `GET  /api/opslog` — get ops log
- `POST /api/opslog` — append ops log entry

## Key Backend Files

- `artifacts/api-server/src/lib/ollamaService.ts` — Ollama integration (configurable base URL + model)
- `artifacts/api-server/src/lib/heuristicAnalysis.ts` — keyword-based fallback analysis
- `artifacts/api-server/src/lib/fileStore.ts` — local JSON file persistence

## Environment Variables (API server)

- `OLLAMA_BASE_URL` — Ollama endpoint (default: `http://localhost:11434`)
- `OLLAMA_MODEL` — Model name (default: `llama3.2:3b`)
- `DATA_DIR` — Data directory path (default: `./data`)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
