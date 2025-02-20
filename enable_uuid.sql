-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Verify extension is enabled
select * from pg_extension where extname = 'uuid-ossp';
