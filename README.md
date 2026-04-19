# RSR Data Hub

Production-style intelligence analysis platform. Black/green operator aesthetic. Self-hosted.

## Features

- 6 live data sources: Reuters World, NYT World, Reddit /r/WorldNews, SEC EDGAR 8-K, Coindesk BTC/USD, USAspending Contracts
- Manual signal ingest with file upload (CSV/JSON/TXT)
- LLM analysis via Ollama (heuristic fallback when offline)
- Signal archive with classification filters
- Intelligence brief generation with copy-to-clipboard
- JSON/CSV export with meaningful filenames
- File persistence — no database required

---

## Local Development

```bash
# Install dependencies
pnpm install

# Start API server (port 8080)
pnpm --filter @workspace/api-server run dev

# Start frontend (port 23154)
pnpm --filter @workspace/rsr-data-hub run dev
```

Copy `.env.example` to `.env` and adjust as needed.

---

## Docker

### Build and run (app only)

```bash
docker build -t rsr-data-hub .
docker run -p 3000:3000 -v rsr_data:/app/data rsr-data-hub
```

The app serves the built frontend + API at `http://localhost:3000`.

### Docker Compose (recommended)

```bash
# App only (uses heuristic analysis)
docker compose up

# App + Ollama LLM (pulls and serves model locally)
docker compose --profile ollama up

# After Ollama starts, pull the model:
docker exec $(docker compose ps -q ollama) ollama pull llama3.2:3b
```

### Environment Variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | Server port |
| `DATA_DIR` | `./data` | Persistence directory |
| `OLLAMA_BASE_URL` | `http://localhost:11434` | Ollama endpoint |
| `OLLAMA_MODEL` | `llama3.2:3b` | Model to use |
| `SESSION_SECRET` | — | Required for session security |

---

## Architecture

```
artifacts/
  api-server/   Express API (port 8080 dev / 3000 prod)
  rsr-data-hub/ React + Vite frontend (port 23154 dev)
data/
  signals.json  Signal archive (capped at 250)
  opslog.json   Ops log (capped at 500)
lib/
  api-spec/     OpenAPI spec + codegen
  api-client-react/  Generated React Query client
```

## Non-blocking Limitations

- Coindesk BTC/USD API may return 0 items in some network environments (blocked external call) — handled gracefully
- Ollama analysis requires a local Ollama server with `llama3.2:3b` pulled — falls back to heuristic automatically
- File persistence only (no cloud DB) — suitable for self-hosted single-node deployment
