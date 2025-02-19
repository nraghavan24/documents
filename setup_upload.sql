-- Add file metadata columns to documents table
alter table documents add column if not exists original_file_name text;
alter table documents add column if not exists file_type text;
alter table documents add column if not exists file_size bigint;
alter table documents add column if not exists original_file_url text;
alter table documents add column if not exists last_modified timestamp with time zone;

-- Create storage bucket for original files
insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

-- Create RLS policy for storage
create policy "Users can upload documents"
  on storage.objects for insert
  with check (bucket_id = 'documents');

create policy "Users can view their documents"
  on storage.objects for select
  using (bucket_id = 'documents');

-- Grant access to authenticated users
grant all on storage.objects to authenticated;

-- Update documents RLS policy to include file metadata
drop policy if exists "Allow all operations" on documents;

create policy "Allow all operations" on documents
  for all
  using (true)
  with check (true);
