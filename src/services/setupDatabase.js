import { supabase } from './supabase';

const setupDatabase = async () => {
  try {
    // Create documents table
    const { error: documentsError } = await supabase
      .from('documents')
      .select('*')
      .limit(1);

    if (documentsError && documentsError.code === '42P01') {
      console.error('Documents table does not exist. Please create it using the Supabase dashboard with this SQL:');
      console.log(`
        create table public.documents (
          id uuid default gen_random_uuid() primary key,
          title text not null,
          "content" text,
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
      `);
      throw new Error('Documents table needs to be created');
    }

    // Create suggestions table
    const { error: suggestionsError } = await supabase
      .from('suggestions')
      .select('*')
      .limit(1);

    if (suggestionsError && suggestionsError.code === '42P01') {
      console.error('Suggestions table does not exist. Please create it using the Supabase dashboard with this SQL:');
      console.log(`
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
      `);
      throw new Error('Suggestions table needs to be created');
    }

    console.log('Database check completed successfully');
    return true;
  } catch (error) {
    console.error('Database check failed:', error);
    throw error;
  }
};

export { setupDatabase };
