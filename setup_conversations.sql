-- Create conversation_sessions table
CREATE TABLE IF NOT EXISTS conversation_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  mode VARCHAR NOT NULL DEFAULT 'support'
);

-- Create conversation_messages table
CREATE TABLE IF NOT EXISTS conversation_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES conversation_sessions(id) ON DELETE CASCADE,
  role VARCHAR NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  order_index INTEGER NOT NULL
);

-- Add index for faster message retrieval
CREATE INDEX IF NOT EXISTS idx_conversation_messages_session_order 
ON conversation_messages(session_id, order_index);

-- Add index for document conversations
CREATE INDEX IF NOT EXISTS idx_conversation_sessions_document 
ON conversation_sessions(document_id);

-- Add mode column to suggestions table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'suggestions' 
    AND column_name = 'mode'
  ) THEN
    ALTER TABLE suggestions 
    ADD COLUMN mode VARCHAR NOT NULL DEFAULT 'create';
  END IF;
END $$;
