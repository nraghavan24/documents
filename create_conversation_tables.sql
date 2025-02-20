-- Create conversation_sessions table
create table if not exists conversation_sessions (
  id uuid default gen_random_uuid() primary key,
  document_id uuid references documents(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  mode varchar not null default 'support'
);

-- Create conversation_messages table
create table if not exists conversation_messages (
  id uuid default gen_random_uuid() primary key,
  session_id uuid references conversation_sessions(id) on delete cascade,
  role varchar not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  order_index integer not null
);

-- Create indexes
create index if not exists idx_conversation_messages_session_order 
on conversation_messages(session_id, order_index);

create index if not exists idx_conversation_sessions_document 
on conversation_sessions(document_id);

-- Enable RLS
alter table conversation_sessions enable row level security;
alter table conversation_messages enable row level security;

-- Create policies
create policy "Allow all operations" on conversation_sessions for all using (true) with check (true);
create policy "Allow all operations" on conversation_messages for all using (true) with check (true);

-- Grant permissions
grant all on conversation_sessions to authenticated, anon;
grant all on conversation_messages to authenticated, anon;
grant usage, select on all sequences in schema public to authenticated, anon;

-- Verify tables
select table_name, column_name, data_type, is_nullable
from information_schema.columns
where table_name in ('conversation_sessions', 'conversation_messages')
order by table_name, ordinal_position;

-- Verify policies
select schemaname, tablename, policyname, permissive, roles, cmd
from pg_policies
where schemaname = 'public'
and tablename in ('conversation_sessions', 'conversation_messages');
