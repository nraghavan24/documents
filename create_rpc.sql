-- Create function to handle conversation session creation
create or replace function create_conversation_session(doc_id uuid)
returns json
language plpgsql
security definer
as $$
declare
  new_session json;
begin
  -- Insert new session
  insert into conversation_sessions (document_id, mode)
  values (doc_id, 'support')
  returning json_build_object(
    'id', id,
    'document_id', document_id,
    'created_at', created_at,
    'mode', mode
  ) into new_session;
  
  return new_session;
exception
  when others then
    raise exception 'Failed to create conversation session: %', SQLERRM;
end;
$$;

-- Grant execute permission to authenticated and anon users
grant execute on function create_conversation_session(uuid) to authenticated, anon;

-- Test the function
select create_conversation_session(id) from documents limit 1;
