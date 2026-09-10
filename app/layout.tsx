import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Multimodal RAG Assistant — Khushboo Kumari",
  description: "Upload PDFs and chat with them — grounded answers with page citations. Next.js + Supabase (pgvector) + Gemini.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
