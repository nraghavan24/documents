import { create } from 'zustand';
import { documentService } from '../services/supabase';

const useAIStore = create((set, get) => ({
  currentDocument: null,
  suggestions: [],
  selectedSuggestion: null,
  isLoading: false,
  error: null,
  stats: {
    successCount: 0,
    failureCount: 0,
  },

  setCurrentDocument: (documentId) => {
    set({ currentDocument: documentId });
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
