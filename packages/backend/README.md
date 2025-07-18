# Backend

This directory contains the Python backend for ABACUS. The scripts are
placeholders that will be expanded as the service evolves.

## Setup

1. Navigate to this folder:

   ```bash
   cd packages/backend
   ```

2. (Optional) Create and activate a virtual environment:

   ```bash
   python3 -m venv .venv
   source .venv/bin/activate
   ```

3. Install Python dependencies:

```bash
pip install -r requirements.txt
```

4. **Generate embeddings** (required on first run):

```bash
python load_embeddings.py
```

## Environment variables

Copy `../../.env.example` to `.env` in the repository root and populate the
required values:

- `BEDROCK_API_BASE`, `BEDROCK_API_KEY`, and `BEDROCK_MODEL_ID`
- `ABACUS_BASE_URL` and `ABACUS_CLIENT_SECRET`
- `VERIFY_SSL` (set to `false` to allow self-signed certificates)

These settings allow the service to call AWS Bedrock and the ABACUS API.

## Running

Activate your environment if you haven't already and run:

```bash
python main.py
```

Make sure `load_embeddings.py` has been executed at least once so that
the FAISS index exists before starting the service. If the index is
missing, it will be built automatically on startup.

Once running, the API exposes a `/ask` endpoint that accepts a JSON payload with
a `question` field and returns the generated answer.

The current scripts raise `NotImplementedError` until the backend logic
is implemented.
