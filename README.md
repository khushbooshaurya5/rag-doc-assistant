# Multimodal RAG Document Assistant

### ▶ Live demo: **https://rag-doc-assistant-chi.vercel.app**

Upload PDFs → chat with them → **grounded answers with page-level citations**. Full-stack: **Next.js + Supabase (pgvector) + Gemini**, deployable to Vercel.

A hosted, production-style take on my multi-agent / RAG work.

## Stack
Next.js (App Router) + TypeScript + Tailwind · Supabase (Postgres + pgvector) · Google Gemini (`gemini-embedding-001` @ 768-dim + `gemini-3.6-flash`, swappable in `lib/llm.ts`) · `unpdf` for PDF text.

## How it works
1. **Upload** (`/api/upload`) → extract text per page (`unpdf`) → chunk → embed each chunk (Gemini) → store in Supabase `chunks` (pgvector).
2. **Chat** (`/api/chat`) → embed the question → `match_chunks` top-k cosine search → build a grounded prompt → Gemini answers **with inline `[n]` citations** (doc + page).

## Setup
1. **Supabase**: create a free project → SQL editor → run [`supabase/migration.sql`](supabase/migration.sql) (creates `documents`, `chunks`, the `match_chunks` function + vector index).
2. **Gemini**: get a free API key from Google AI Studio.
3. Copy `.env.example` → `.env.local` and fill in:
   - `GOOGLE_API_KEY`
   - `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (Project Settings → API)
4. Run:
   ```bash
   npm install
   npm run dev
   ```
   Open http://localhost:3000 → Upload a PDF → ask questions.

## Deploy (Vercel)
1. Push this repo to GitHub, import it at **vercel.com/new**.
2. Add the same env vars (`GOOGLE_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`) in Vercel → Project → Settings → Environment Variables.
3. Deploy. (Not GitHub Pages — this app needs a server.)

> Provider is isolated in `lib/llm.ts` (`embed`, `chat`) — swap Gemini for OpenAI/Anthropic by reimplementing those two functions.

## Author
Khushboo Kumari — Machine Learning Engineer · [github.com/khushbooshaurya5](https://github.com/khushbooshaurya5)

MIT License.
