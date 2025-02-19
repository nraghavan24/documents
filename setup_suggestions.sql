-- Create the suggestions table
create table public.suggestions (
    id uuid default gen_random_uuid() primary key,
    document_id uuid references documents(id) on delete cascade,
    prompt text not null,
    "content" text not null,
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
