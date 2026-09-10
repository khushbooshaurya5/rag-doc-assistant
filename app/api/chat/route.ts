import { NextRequest, NextResponse } from "next/server";
import { chat, embed } from "@/lib/llm";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

interface MatchRow {
  id: string;
  document_id: string;
  content: string;
  page: number;
  similarity: number;
}

export async function POST(req: NextRequest) {
  try {
    const { question } = (await req.json()) as { question?: string };
    if (!question || !question.trim()) {
      return NextResponse.json({ error: "Empty question" }, { status: 400 });
    }

    const db = supabaseAdmin();
    const [qvec] = await embed([question]);
    const { data, error } = await db.rpc("match_chunks", {
      query_embedding: qvec,
      match_count: 6,
    });
    if (error) throw error;

    const rows = (data ?? []) as MatchRow[];
    if (rows.length === 0) {
      return NextResponse.json({
        answer: "I couldn't find anything relevant in the uploaded documents. Try uploading a PDF first, or rephrasing.",
        citations: [],
      });
    }

    // resolve document names for citations
    const ids = [...new Set(rows.map((r) => r.document_id))];
    const { data: docs } = await db.from("documents").select("id,name").in("id", ids);
    const nameById = new Map((docs ?? []).map((d: { id: string; name: string }) => [d.id, d.name]));

    const context = rows
      .map((r, i) => `[${i + 1}] (${nameById.get(r.document_id) ?? "doc"} p.${r.page})\n${r.content}`)
      .join("\n\n");

    const system =
      "You answer strictly from the provided context. Cite sources inline as [n] using the numbered snippets. " +
      "If the answer is not in the context, say you don't know. Be concise.";
    const user = `Context:\n${context}\n\nQuestion: ${question}\n\nAnswer with inline [n] citations:`;

    const answer = await chat(system, user);
    const citations = rows.map((r, i) => ({
      n: i + 1,
      doc: nameById.get(r.document_id) ?? "document",
      page: r.page,
      snippet: r.content.slice(0, 160),
    }));

    return NextResponse.json({ answer, citations });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: e instanceof Error ? e.message : "Chat failed" }, { status: 500 });
  }
}
