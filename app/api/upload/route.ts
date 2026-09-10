import { NextRequest, NextResponse } from "next/server";
import { extractText, getDocumentProxy } from "unpdf";
import { embed } from "@/lib/llm";
import { chunkText } from "@/lib/chunk";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const buf = new Uint8Array(await file.arrayBuffer());
    const pdf = await getDocumentProxy(buf);
    const { text } = await extractText(pdf, { mergePages: false });
    const pages: string[] = Array.isArray(text) ? text : [text];

    const db = supabaseAdmin();
    const { data: doc, error: docErr } = await db
      .from("documents")
      .insert({ name: file.name, pages: pages.length })
      .select("id")
      .single();
    if (docErr) throw docErr;

    // chunk every page, remembering its page number
    const records: { content: string; page: number }[] = [];
    pages.forEach((pageText, idx) => {
      for (const c of chunkText(pageText)) records.push({ content: c, page: idx + 1 });
    });
    if (records.length === 0) {
      return NextResponse.json({ error: "No extractable text in PDF" }, { status: 422 });
    }

    // embed in batches to keep requests small
    const BATCH = 32;
    for (let i = 0; i < records.length; i += BATCH) {
      const slice = records.slice(i, i + BATCH);
      const vectors = await embed(slice.map((r) => r.content));
      const rows = slice.map((r, j) => ({
        document_id: doc.id,
        content: r.content,
        page: r.page,
        embedding: vectors[j],
      }));
      const { error: insErr } = await db.from("chunks").insert(rows);
      if (insErr) throw insErr;
    }

    return NextResponse.json({ id: doc.id, name: file.name, pages: pages.length, chunks: records.length });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: e instanceof Error ? e.message : "Upload failed" }, { status: 500 });
  }
}
