import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  console.log('URL:', supabaseUrl);
  console.log('Key:', supabaseKey ? 'Present' : 'Missing');
  throw new Error('Missing Supabase environment variables');
}

// Create a single instance of the Supabase client
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  db: {
    schema: 'public',
  },
});

const handleError = (error, operation) => {
  const errorDetails = {
    code: error.code,
    message: error.message,
    details: error.details,
    hint: error.hint,
    status: error.status,
  };
  
  console.error(`Supabase ${operation} error:`, errorDetails);
  
  if (error.code === '42P01') {
    return new Error('Database table not found. Please ensure the required tables are created.');
  }
  
  if (error.code === '23505') {
    return new Error('A document with this title already exists.');
  }
  
  if (error.code === '42501') {
    return new Error('You don\'t have permission to perform this operation.');
  }

  if (error.code === 'PGRST116') {
    return new Error('Invalid API key or unauthorized access.');
  }

  if (error.status === 404) {
    return new Error('API endpoint not found. Please check your Supabase URL.');
  }
  
  return new Error(error.message || error.details || error.hint || `Failed to ${operation}`);
};

export const conversationService = {
  async createSession(documentId) {
    try {
      if (!documentId) {
        throw new Error('Document ID is required');
      }

      console.log('Creating conversation session for document:', documentId);
      
      // First verify the document exists
      const { data: doc, error: docError } = await supabase
        .from('documents')
        .select('id')
        .eq('id', documentId)
        .single();

      if (docError) {
        console.error('Document verification error:', docError);
        throw new Error('Document not found');
      }

      if (!doc) {
        throw new Error(`Document not found with ID: ${documentId}`);
      }

      // Simple direct insert
      console.log('Attempting to insert session with document ID:', documentId);
      
      const insertData = {
        document_id: documentId,
        mode: 'support'
      };
      console.log('Insert data:', insertData);

      const { data, error } = await supabase
        .from('conversation_sessions')
        .insert([insertData])
        .select('*')
        .maybeSingle();

      if (error) {
        console.error('Insert error:', error);
        throw error;
      }

      if (!data) {
        console.error('No data returned from insert');
        throw new Error('Failed to create session - no data returned');
      }

      console.log('Created session:', data);
      return data;
    } catch (error) {
      console.error('Error in createSession:', error);
      throw handleError(error, 'create conversation session');
    }
  },

  async getSession(sessionId) {
    try {
      if (!sessionId) {
        throw new Error('Session ID is required');
      }

      console.log('Getting session:', sessionId);
      const { data, error } = await supabase
        .from('conversation_sessions')
        .select(`
          id,
          document_id,
          created_at,
          mode,
          messages:conversation_messages(
            id,
            role,
            content,
            created_at,
            order_index
          )
        `)
        .eq('id', sessionId)
        .single();

      if (error) {
        console.error('Session fetch error:', error);
        throw error;
      }

      if (!data) {
        throw new Error(`Session not found with ID: ${sessionId}`);
      }
      
      console.log('Got session:', data);
      return data;
    } catch (error) {
      console.error('Error in getSession:', error);
      throw handleError(error, 'get conversation session');
    }
  },

  async getDocumentSessions(documentId) {
    try {
      if (!documentId) {
        throw new Error('Document ID is required');
      }

      const { data, error } = await supabase
        .from('conversation_sessions')
        .select('id, document_id, created_at, mode')
        .eq('document_id', documentId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      throw handleError(error, 'get document sessions');
    }
  },

  async addMessage(sessionId, role, content) {
    try {
      if (!sessionId || !role || !content) {
        throw new Error('Session ID, role, and content are required');
      }

      // Get the current highest order_index
      const { data: messages, error: countError } = await supabase
        .from('conversation_messages')
        .select('order_index')
        .eq('session_id', sessionId)
        .order('order_index', { ascending: false })
        .limit(1);

      if (countError) throw countError;

      const nextOrderIndex = messages && messages.length > 0 ? messages[0].order_index + 1 : 0;

      const { data, error } = await supabase
        .from('conversation_messages')
        .insert({
          session_id: sessionId,
          role,
          content,
          order_index: nextOrderIndex
        })
        .select('id, role, content, created_at, order_index')
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw handleError(error, 'add conversation message');
    }
  },

  async getSessionMessages(sessionId) {
    try {
      if (!sessionId) {
        throw new Error('Session ID is required');
      }

      console.log('Getting messages for session:', sessionId);
      const { data, error } = await supabase
        .from('conversation_messages')
        .select('id, role, content, created_at, order_index')
        .eq('session_id', sessionId)
        .order('order_index', { ascending: true });

      if (error) {
        console.error('Message fetch error:', error);
        throw error;
      }
      
      console.log('Got messages:', data);
      return data || [];
    } catch (error) {
      console.error('Error in getSessionMessages:', error);
      throw handleError(error, 'get session messages');
    }
  }
};

export const documentService = {
  async createDocument(input) {
    try {
      console.log('Creating document with input:', {
        title: input.title,
        contentLength: input.content?.length || 0,
        contentPreview: input.content?.substring(0, 100),
      });

      // Ensure content is a string
      const content = input.content || '';
      if (typeof content !== 'string') {
        throw new Error('Document content must be a string');
      }

      const now = new Date().toISOString();
      const document = {
        title: input.title || 'Untitled Document',
        content: content, // Store raw HTML content
        version: 1,
        created_at: now,
        updated_at: now,
        user_id: 'placeholder',
      };

      const { data, error } = await supabase
        .from('documents')
        .insert([document])
        .select('id, title, content, version, created_at, updated_at')
        .single();

      if (error) {
        throw error;
      }

      console.log('Document created successfully:', {
        id: data.id,
        title: data.title,
        contentLength: data.content?.length || 0,
        contentPreview: data.content?.substring(0, 100),
      });

      return data;
    } catch (error) {
      throw handleError(error, 'create document');
    }
  },

  async getDocument(id) {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('id, title, content, version, created_at, updated_at')
        .eq('id', id)
        .single();

      if (error) {
        throw error;
      }

      if (!data) {
        throw new Error('Document not found');
      }

      return {
        ...data,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };
    } catch (error) {
      throw handleError(error, 'fetch document');
    }
  },

  async updateDocument(id, updates) {
    try {
      if (updates.content && typeof updates.content !== 'string') {
        throw new Error('Document content must be a string');
      }

      const updateData = {
        ...updates,
        updated_at: new Date().toISOString(),
      };

      console.log('Updating document with data:', {
        id,
        title: updateData.title,
        contentLength: updateData.content?.length || 0,
        contentPreview: updateData.content?.substring(0, 100),
      });

      const { data, error } = await supabase
        .from('documents')
        .update(updateData)
        .eq('id', id)
        .select('id, title, content, version, created_at, updated_at')
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      throw handleError(error, 'update document');
    }
  },

  async deleteDocument(id) {
    try {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      throw handleError(error, 'delete document');
    }
  },

  async listDocuments() {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('id, title, content, version, created_at, updated_at')
        .order('updated_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data.map((doc) => ({
        ...doc,
        createdAt: new Date(doc.created_at),
        updatedAt: new Date(doc.updated_at),
      }));
    } catch (error) {
      throw handleError(error, 'list documents');
    }
  },

  async getDocumentSuggestions(documentId) {
    try {
      const { data, error } = await supabase
        .from('suggestions')
        .select('*')
        .eq('document_id', documentId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      throw handleError(error, 'fetch suggestions');
    }
  },

  async createSuggestion(documentId, suggestion) {
    try {
      const { data, error } = await supabase
        .from('suggestions')
        .insert([{
          document_id: documentId,
          prompt: suggestion.prompt,
          content: suggestion.content,
          type: suggestion.type,
          context: suggestion.context,
          feedback: suggestion.feedback,
        }])
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      throw handleError(error, 'create suggestion');
    }
  },

  async updateSuggestionFeedback(suggestionId, feedback) {
    try {
      const { data, error } = await supabase
        .from('suggestions')
        .update({ feedback })
        .eq('id', suggestionId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      throw handleError(error, 'update suggestion feedback');
    }
  },
};

export { supabase };
