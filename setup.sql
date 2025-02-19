-- Drop existing tables if they exist
drop table if exists suggestions;
drop table if exists documents;

-- Create documents table with all required columns
create table public.documents (
    id uuid default gen_random_uuid() primary key,
    title text not null,
    content text, -- This will store HTML content
    version integer default 1,
    user_id text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table documents enable row level security;

-- Create policy to allow all operations for now
create policy "Allow all operations" on documents
    for all
    using (true)
    with check (true);

-- Grant access to authenticated and anon users
grant all on documents to authenticated, anon;

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

-- Create index for better performance
create index idx_documents_updated_at on documents(updated_at desc);

-- Create suggestions table for AI conversations
create table public.suggestions (
    id uuid default gen_random_uuid() primary key,
    document_id uuid references documents(id) on delete cascade,
    prompt text not null,
    content text not null, -- This will store HTML content
    type text not null,
    context text,
    feedback text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table suggestions enable row level security;

-- Create policy to allow all operations for now
create policy "Allow all operations" on suggestions
    for all
    using (true)
    with check (true);

-- Grant access to authenticated and anon users
grant all on suggestions to authenticated, anon;

-- Create indexes for better performance
create index idx_suggestions_document_id on suggestions(document_id);
create index idx_suggestions_created_at on suggestions(created_at desc);

-- Verify the table structures
select table_name, column_name, data_type, is_nullable
from information_schema.columns
where table_name in ('documents', 'suggestions')
order by table_name, ordinal_position;
