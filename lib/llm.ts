// LLM / embedding adapter. Provider = Google Gemini by default.
// To switch providers (OpenAI, Anthropic, …) reimplement `embed` and `chat`
// against the new SDK — the rest of the app only depends on these two.
import { GoogleGenAI } from "@google/genai";

// Model IDs are pinned here (and only here). If Google retires one, swap it.
export const EMBED_MODEL = "gemini-embedding-001";
export const CHAT_MODEL = "gemini-2.5-flash";
export const EMBED_DIM = 768; // must match the `vector(768)` column in Supabase

function client(): GoogleGenAI {
  const key = process.env.GOOGLE_API_KEY;
  if (!key) throw new Error("GOOGLE_API_KEY is not set");
  return new GoogleGenAI({ apiKey: key });
}

/** Embed a batch of texts → array of 768-dim vectors. */
export async function embed(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];
  // gemini-embedding-001 defaults to 3072 dims; pin to 768 to match the DB
  // (and to stay under pgvector's 2000-dim index limit).
  const r = await client().models.embedContent({
    model: EMBED_MODEL,
    contents: texts,
    config: { outputDimensionality: EMBED_DIM },
  });
  const embeddings = r.embeddings ?? [];
  if (embeddings.length !== texts.length) {
    throw new Error(`embed: expected ${texts.length} vectors, got ${embeddings.length}`);
  }
  return embeddings.map((e) => e.values as number[]);
}

/** Grounded chat completion. */
export async function chat(system: string, user: string): Promise<string> {
  const r = await client().models.generateContent({
    model: CHAT_MODEL,
    contents: user,
    config: { systemInstruction: system },
  });
  return r.text ?? "";
}
