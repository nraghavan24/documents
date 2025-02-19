-- Create a function to execute arbitrary SQL
create or replace function exec(sql text) returns void as $$
begin
  execute sql;
end;
$$ language plpgsql security definer;
