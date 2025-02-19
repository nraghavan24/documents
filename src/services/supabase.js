import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  console.log('URL:', supabaseUrl);
  console.log('Key:', supabaseKey ? 'Present' : 'Missing');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

const handleError = (error, operation) => {
  console.error(`Supabase ${operation} error:`, {
    code: error.code,
    message: error.message,
    details: error.details,
    hint: error.hint,
    status: error.status,
  });
  
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
        .insert([document]) // Pass as array
        .select('id, title, content, version, created_at, updated_at') // Don't quote content here
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
        .select('id, title, content, version, created_at, updated_at') // Don't quote content here
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
      // Ensure content is a string if it's being updated
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
        .select('id, title, content, version, created_at, updated_at') // Don't quote content here
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
        .select('id, title, content, version, created_at, updated_at') // Don't quote content here
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

  // Suggestion-related methods
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

      return data;
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
