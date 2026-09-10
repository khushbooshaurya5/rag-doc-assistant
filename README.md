# Multimodal RAG Document Assistant

Upload PDFs (and images) → chat with them and get **grounded answers with page-level citations**. Full-stack: Next.js + Supabase (pgvector) + an LLM, deployable to Vercel.

A hosted, production-style take on my multi-agent / RAG work.

## Stack
Next.js (App Router) + TypeScript + Tailwind + shadcn/ui · Supabase (Postgres + pgvector + Storage) · Google Gemini (swappable via `lib/llm.ts`)

## Setup
1. Create a Supabase project; run the SQL migration (tables `documents`, `chunks`, the `match_chunks` function, and a vector index).
2. Copy `.env.example` → `.env.local` and fill in `GOOGLE_API_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`. **Never commit secrets.**
3. Run:
```bash
npm install
npm run dev
```

## Deploy
Vercel + your Supabase project (set the same env vars in Vercel).

> Ships an [`AGENTS.md`](AGENTS.md) build brief — open in an agentic IDE (e.g. Google Antigravity) to scaffold and finish it. LLM provider defaults to Gemini and is swappable in `lib/llm.ts`.

## Author
Khushboo Kumari — Machine Learning Engineer · [github.com/khushbooshaurya5](https://github.com/khushbooshaurya5)

MIT License.
