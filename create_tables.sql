-- Enable UUID extension if not already enabled
create extension if not exists "uuid-ossp";

-- Drop existing tables if they exist (in correct order)
drop table if exists conversation_messages cascade;
drop table if exists conversation_sessions cascade;
drop table if exists suggestions cascade;
drop table if exists documents cascade;

-- Create documents table with all required columns
create table documents (
    id uuid default gen_random_uuid() primary key,
    title text not null,
    "content" text,  -- Explicitly quote the column name
    version integer default 1,
    user_id text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create suggestions table for AI conversations
create table suggestions (
    id uuid default gen_random_uuid() primary key,
    document_id uuid references documents(id) on delete cascade,
    prompt text not null,
    "content" text not null,  -- AI generated content
    type text not null,  -- e.g., 'generation', 'improvement', etc.
    context text,  -- Optional context about the suggestion
    feedback text,  -- Optional user feedback (positive/negative)
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create conversation_sessions table
create table conversation_sessions (
  id uuid default gen_random_uuid() primary key,
  document_id uuid references documents(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  mode varchar not null default 'support'
);

-- Create conversation_messages table
create table conversation_messages (
  id uuid default gen_random_uuid() primary key,
  session_id uuid references conversation_sessions(id) on delete cascade,
  role varchar not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  order_index integer not null
);

-- Enable Row Level Security
alter table documents enable row level security;
alter table suggestions enable row level security;
alter table conversation_sessions enable row level security;
alter table conversation_messages enable row level security;

-- Create policy to allow all operations for now
create policy "Allow all operations" on documents
    for all
    using (true)
    with check (true);

create policy "Allow all operations" on suggestions
    for all
    using (true)
    with check (true);

create policy "Allow all operations" on conversation_sessions
    for all
    using (true)
    with check (true);

create policy "Allow all operations" on conversation_messages
    for all
    using (true)
    with check (true);

-- Grant access to authenticated and anon users
grant all on documents to authenticated, anon;
grant all on suggestions to authenticated, anon;
grant all on conversation_sessions to authenticated, anon;
grant all on conversation_messages to authenticated, anon;

-- Create function to update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = timezone('utc'::text, now());
    return new;
end;
$$ language plpgsql;

-- Create trigger to automatically update updated_at
create trigger update_documents_updated_at
    before update on documents
    for each row
    execute function update_updated_at_column();

-- Create indexes for better performance
create index idx_documents_updated_at on documents(updated_at desc);
create index idx_suggestions_document_id on suggestions(document_id);
create index idx_suggestions_created_at on suggestions(created_at desc);
create index idx_conversation_messages_session_order on conversation_messages(session_id, order_index);
create index idx_conversation_sessions_document on conversation_sessions(document_id);

-- Add mode column to suggestions table if it doesn't exist
do $$ 
begin
  if not exists (
    select 1 
    from information_schema.columns 
    where table_name = 'suggestions' 
    and column_name = 'mode'
  ) then
    alter table suggestions 
    add column mode varchar not null default 'create';
  end if;
end $$;

-- Grant sequence permissions
grant usage, select on all sequences in schema public to authenticated, anon;

-- Verify the table structures
select table_name, column_name, data_type, is_nullable
from information_schema.columns
where table_name in ('documents', 'suggestions', 'conversation_sessions', 'conversation_messages')
order by table_name, ordinal_position;
