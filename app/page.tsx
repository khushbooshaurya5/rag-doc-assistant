"use client";
import { useRef, useState } from "react";

interface Citation { n: number; doc: string; page: number; snippet: string; }
interface Msg { role: "user" | "assistant"; text: string; citations?: Citation[]; }

export default function Home() {
  const [docs, setDocs] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function upload(file: File) {
    setUploading(true);
    setStatus(`Indexing "${file.name}"…`);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const r = await fetch("/api/upload", { method: "POST", body: fd });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "upload failed");
      setDocs((d) => [...d, `${j.name} · ${j.pages}p · ${j.chunks} chunks`]);
      setStatus(`Indexed "${j.name}".`);
    } catch (e) {
      setStatus(`⚠ ${e instanceof Error ? e.message : "upload failed"}`);
    } finally {
      setUploading(false);
    }
  }

  async function ask() {
    const question = q.trim();
    if (!question || busy) return;
    setMessages((m) => [...m, { role: "user", text: question }]);
    setQ("");
    setBusy(true);
    try {
      const r = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "chat failed");
      setMessages((m) => [...m, { role: "assistant", text: j.answer, citations: j.citations }]);
    } catch (e) {
      setMessages((m) => [...m, { role: "assistant", text: `⚠ ${e instanceof Error ? e.message : "error"}` }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-5 py-10">
      <h1 className="text-3xl font-bold tracking-tight">Multimodal RAG Assistant</h1>
      <p className="mt-2 text-neutral-600">
        Upload PDFs → chat with them → grounded answers with page citations.
        Next.js · Supabase (pgvector) · Gemini.
      </p>

      <section className="mt-6 rounded-xl border border-neutral-300 bg-white p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="rounded-lg bg-[#c4552d] px-4 py-2 font-semibold text-white disabled:opacity-50"
          >
            {uploading ? "Indexing…" : "Upload PDF"}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/pdf"
            hidden
            onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
          />
          <span className="text-sm text-neutral-500">{status}</span>
        </div>
        {docs.length > 0 && (
          <ul className="mt-3 text-sm text-neutral-700 list-disc pl-5">
            {docs.map((d, i) => <li key={i}>{d}</li>)}
          </ul>
        )}
      </section>

      <section className="mt-6 space-y-4">
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "text-right" : ""}>
            <div className={`inline-block max-w-full rounded-2xl px-4 py-3 ${m.role === "user" ? "bg-neutral-200" : "bg-white border border-neutral-300"}`}>
              <p className="whitespace-pre-wrap">{m.text}</p>
              {m.citations && m.citations.length > 0 && (
                <div className="mt-3 space-y-1 border-t border-neutral-200 pt-2 text-left text-xs text-neutral-500">
                  {m.citations.map((c) => (
                    <div key={c.n}><b>[{c.n}]</b> {c.doc} · p.{c.page} — <i>{c.snippet}…</i></div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {busy && <p className="text-sm text-neutral-500">thinking…</p>}
      </section>

      <div className="sticky bottom-4 mt-6 flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && ask()}
          placeholder="Ask something about your PDFs…"
          className="flex-1 rounded-lg border border-neutral-300 bg-white px-4 py-3 outline-none focus:border-[#c4552d]"
        />
        <button onClick={ask} disabled={busy} className="rounded-lg bg-[#14110e] px-5 py-3 font-semibold text-white disabled:opacity-50">
          Ask
        </button>
      </div>

      <footer className="mt-10 border-t border-neutral-200 pt-4 text-sm text-neutral-500">
        <a className="text-[#c4552d]" href="https://github.com/khushbooshaurya5" target="_blank" rel="noreferrer">github.com/khushbooshaurya5</a>
        {" · "}Khushboo Kumari — Machine Learning Engineer
      </footer>
    </main>
  );
}
