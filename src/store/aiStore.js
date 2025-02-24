import { create } from 'zustand';
import { documentService, conversationService } from '../services/supabase';

const useAIStore = create((set, get) => ({
  mode: 'create', // 'create' or 'support'
  currentDocument: null,
  currentSession: null,
  suggestions: [],
  selectedSuggestion: null,
  isLoading: false,
  error: null,
  conversationHistory: [],
  stats: {
    successCount: 0,
    failureCount: 0,
  },

  setMode: (mode) => {
    if (mode !== 'create' && mode !== 'support') {
      throw new Error('Invalid mode. Must be either "create" or "support"');
    }
    // Preserve conversation history when switching modes
    set((state) => ({ 
      mode,
      // Only clear history if explicitly switching away from support mode
      conversationHistory: mode === 'support' ? state.conversationHistory : []
    }));
  },

  setCurrentSession: (sessionId) => {
    set({ currentSession: sessionId });
  },

  loadConversationHistory: async (sessionId) => {
    try {
      set({ isLoading: true, error: null });
      console.log('Loading conversation history for session:', sessionId);
      const messages = await conversationService.getSessionMessages(sessionId);
      console.log('Loaded messages:', messages);
      set({ 
        conversationHistory: messages.map(msg => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          timestamp: msg.created_at
        })),
        isLoading: false 
      });
    } catch (error) {
      console.error('Error loading conversation history:', error);
      set({
        error: error.message || 'Failed to load conversation history',
        isLoading: false
      });
    }
  },

  setCurrentDocument: (documentId) => {
    set({ currentDocument: documentId });
  },

  addToConversationHistory: (message) => {
    const messageWithDefaults = {
      id: message.id || crypto.randomUUID(),
      timestamp: message.created_at || new Date().toISOString(),
      ...message
    };
    
    set((state) => ({
      conversationHistory: [...state.conversationHistory, messageWithDefaults]
    }));
    
    return messageWithDefaults;
  },

  clearConversationHistory: () => {
    set({ conversationHistory: [] });
  },

  addSuggestion: (suggestion) => {
    const newSuggestion = {
      id: crypto.randomUUID(),
      ...suggestion,
      created_at: new Date().toISOString(),
    };

    set((state) => ({
      suggestions: [newSuggestion, ...state.suggestions],
    }));

    return newSuggestion;
  },

  clearSuggestions: () => {
    set({ 
      suggestions: [],
      selectedSuggestion: null,
      error: null 
    });
  },

  setSelectedSuggestion: (id) => {
    set({ selectedSuggestion: id });
  },

  addFeedback: (suggestionId, feedback) => {
    set((state) => ({
      suggestions: state.suggestions.map((s) =>
        s.id === suggestionId ? { ...s, feedback } : s
      ),
    }));
  },

  loadSuggestions: async (documentId) => {
    try {
      set({ isLoading: true, error: null });
      const suggestions = await documentService.getDocumentSuggestions(documentId);
      set({ suggestions: suggestions || [], isLoading: false });
    } catch (error) {
      console.error('Error loading suggestions:', error);
      set({
        error: error.message || 'Failed to load suggestions',
        isLoading: false,
      });
    }
  },

  updateStats: (success) => {
    set((state) => ({
      stats: {
        successCount: state.stats.successCount + (success ? 1 : 0),
        failureCount: state.stats.failureCount + (success ? 0 : 1),
      },
    }));
  },

  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
}));

export { useAIStore };
