# Installation Guide

This document describes how to set up the frontend and backend for local development.

## Requirements

- **Node.js 18+** and [pnpm](https://pnpm.io/) for the Next.js frontend
- **Python 3.10+** for the FastAPI backend
- Optional: Docker and Docker Compose for containerized runs

If your organization routes traffic through a proxy, set `HTTP_PROXY`,
`HTTPS_PROXY`, and optionally `NO_PROXY` in your environment or `.env` file
before running the setup commands. The backend bypasses these variables when
contacting Bedrock so calls to AWS are direct.

## Frontend setup

Ensure **Node.js 18+** is available. Change into the frontend directory before
installing dependencies:

```bash
cd packages/frontend
pnpm install    # add --loglevel debug for detailed output
pnpm dev
```

Access the UI at `http://localhost:3000`.

## Backend setup

```bash
cd packages/backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python load_embeddings.py   # one-time
python main.py
```

The API exposes `/ask` on port `8000` by default.

## Docker Compose

To build and run both services using containers:

```bash
docker-compose up --build
```

This command creates a volume named `memory-data` that stores the SQLite database used for long-term memory.
