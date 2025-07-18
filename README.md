# ABACUS Technology Query UI

*Automatically synced with your [v0.dev](https://v0.dev) deployments*

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/koushiksinha92-gmailcoms-projects/v0-technology-query-ui)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.dev-black?style=for-the-badge)](https://v0.dev/chat/projects/zTnLi3IBmVV)

## Overview

ABACUS is an intelligent assistant that helps you explore the Ameritas technology landscape. This repository contains the Next.js source code for the chat UI and supporting services. Any changes you make in [v0.dev](https://v0.dev) will be automatically synced here.

## Deployment

Your project is live at:

**[https://vercel.com/koushiksinha92-gmailcoms-projects/v0-technology-query-ui](https://vercel.com/koushiksinha92-gmailcoms-projects/v0-technology-query-ui)**

## Build your app

Continue building your app on:

**[https://v0.dev/chat/projects/zTnLi3IBmVV](https://v0.dev/chat/projects/zTnLi3IBmVV)**

## Features

- Interactive chat powered by OpenAI via `http://localhost:8000/ask`
- Suggested prompts loaded from `public/prompts.json`
- FAQ section available at `/faq`

## Local development

1. Navigate to `packages/frontend`
2. Install dependencies with `pnpm install`
3. Start the development server with `pnpm dev`
4. Open `http://localhost:3000` in your browser

## Backend Setup

The Python backend lives in `packages/backend`.

```bash
cd packages/backend
python3 -m venv .venv  # optional
source .venv/bin/activate
pip install -r requirements.txt
```

## How It Works

1. Create and modify your project using [v0.dev](https://v0.dev)
2. Deploy your chats from the v0 interface
3. Changes are automatically pushed to this repository
4. Vercel deploys the latest version from this repository
