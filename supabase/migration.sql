-- Run this in the Supabase SQL editor (Dashboard → SQL → New query).
create extension if not exists vector;

create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  pages int,
  created_at timestamptz default now()
);

create table if not exists chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references documents(id) on delete cascade,
  content text not null,
  page int,
  embedding vector(768),          -- Gemini gemini-embedding-001 @ outputDimensionality=768
  created_at timestamptz default now()
);

create index if not exists chunks_embedding_idx
  on chunks using ivfflat (embedding vector_cosine_ops) with (lists = 100);

-- top-k cosine similarity search
create or replace function match_chunks(query_embedding vector(768), match_count int)
returns table (id uuid, document_id uuid, content text, page int, similarity float)
language sql stable
as $$
  select c.id, c.document_id, c.content, c.page,
         1 - (c.embedding <=> query_embedding) as similarity
  from chunks c
  order by c.embedding <=> query_embedding
  limit match_count;
$$;
