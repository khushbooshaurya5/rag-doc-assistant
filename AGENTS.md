# AGENTS.md — Multimodal RAG Document Assistant

**You are an agent (e.g. Google Antigravity) building this app end-to-end. Follow this spec, run it, test, and deploy. This app has a backend (Supabase) and calls an LLM — set up env vars, do NOT hardcode secrets.**

## Goal
A hosted full-stack app: upload PDFs (and images) → they are chunked, embedded, and stored → the user chats with the documents and gets grounded answers **with citations** (source doc + page). A real, deployable version of the author's multi-agent RAG work.

## Stack (use exactly)
- **Next.js (App Router) + TypeScript + Tailwind CSS + shadcn/ui.**
- **Supabase**: Postgres + **pgvector** for embeddings, Storage for uploaded files, (optional) Auth.
- **LLM provider: Google Gemini** by default (`gemini-2.x` for generation, `text-embedding-004` for embeddings). Keep the LLM/embedding calls behind a thin `lib/llm.ts` adapter so the provider can be swapped to OpenAI or Anthropic by changing one file + env vars.
- PDF text extraction: `pdf-parse` or `unpdf`. Images: send to the multimodal model for captioning/OCR before embedding.

## Data model (Supabase)
- `documents(id, user_id, name, storage_path, pages int, created_at)`
- `chunks(id, document_id, content text, page int, embedding vector(768), created_at)` — index with `ivfflat`/`hnsw` on `embedding`.
- A SQL `match_chunks(query_embedding, match_count, filter)` function returning top-k by cosine distance.

## Flow / acceptance criteria
1. **Upload** one or more PDFs (drag-drop). Store the file in Supabase Storage, extract text per page, chunk (~800 tokens, overlap), embed each chunk, insert into `chunks`. Show upload + indexing progress.
2. **Chat**: user question → embed query → `match_chunks` top-k → build a grounded prompt → stream the answer. **Every answer cites its sources** (doc name + page), rendered as clickable chips that scroll/link to the passage.
3. Handle "I don't know / not in the documents" gracefully (no hallucinated citations).
4. Multi-document: let the user pick which uploaded docs are in scope.
5. **Secrets** via env only: `GOOGLE_API_KEY` (or provider key), `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (server routes only). Provide `.env.example`. Never commit keys.
6. Clean, responsive UI; loading/streaming states; error handling; empty state with a sample doc.
7. Footer: author "Khushboo Kumari", link to github.com/khushbooshaurya5.

## Deploy
- Vercel (Next.js) + a Supabase project. README must document: create Supabase project, run the SQL migration (tables + `match_chunks` + vector index), set env vars, `npm run dev`, then deploy to Vercel.

## Notes
- Put all provider-specific code in `lib/llm.ts` (`embed(texts)`, `chat(messages, context)`); document how to switch providers.
- Keep retrieval prompt strict: answer only from retrieved context; always attach citations you actually used.
- Do NOT invent evaluation numbers in the UI/README.

## Definition of done
`npm run build` passes; locally, uploading a PDF indexes it and a question returns a streamed answer with correct page citations; SQL migration + `.env.example` included; README deploy steps complete; deployed URL works.
