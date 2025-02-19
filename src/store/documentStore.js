import { create } from 'zustand';
import { documentService } from '../services/supabase';

const useDocumentStore = create((set, get) => ({
  currentDocument: null,
  isSaving: false,
  error: null,
  documents: [],

  setCurrentDocument: (document) => {
    set({ currentDocument: document });
  },

  saveDocument: async (title, content) => {
    try {
      set({ isSaving: true, error: null });
      console.log('Saving document:', { 
        title, 
        contentLength: content?.length || 0,
        contentPreview: content?.substring(0, 100)
      });

      const document = await documentService.createDocument({
        title: title.trim(),
        content: content || '',
      });

      set((state) => ({
        currentDocument: document,
        documents: [...state.documents.filter(doc => doc.id !== document.id), document],
        isSaving: false,
      }));

      return document;
    } catch (error) {
      console.error('Error saving document:', error);
      set({
        error: error.message || 'Failed to save document',
        isSaving: false,
      });
      throw error;
    }
  },

  updateDocument: async (id, updates) => {
    try {
      set({ isSaving: true, error: null });
      console.log('Updating document:', { 
        id, 
        title: updates.title,
        contentLength: updates.content?.length || 0,
        contentPreview: updates.content?.substring(0, 100)
      });

      const updatedDocument = await documentService.updateDocument(id, {
        ...updates,
        title: updates.title?.trim(),
      });

      set((state) => ({
        documents: state.documents.map((doc) =>
          doc.id === id ? updatedDocument : doc
        ),
        currentDocument: state.currentDocument?.id === id
          ? updatedDocument
          : state.currentDocument,
        isSaving: false,
      }));

      return updatedDocument;
    } catch (error) {
      console.error('Error updating document:', error);
      set({
        error: error.message || 'Failed to update document',
        isSaving: false,
      });
      throw error;
    }
  },

  deleteDocument: async (id) => {
    try {
      set({ isSaving: true, error: null });
      console.log('Deleting document:', id);

      await documentService.deleteDocument(id);

      set((state) => ({
        documents: state.documents.filter((doc) => doc.id !== id),
        currentDocument: state.currentDocument?.id === id ? null : state.currentDocument,
        isSaving: false,
      }));
    } catch (error) {
      console.error('Error deleting document:', error);
      set({
        error: error.message || 'Failed to delete document',
        isSaving: false,
      });
      throw error;
    }
  },

  loadDocument: async (id) => {
    try {
      set({ isSaving: true, error: null });
      console.log('Loading document:', id);

      const document = await documentService.getDocument(id);

      set({
        currentDocument: document,
        isSaving: false,
      });

      return document;
    } catch (error) {
      console.error('Error loading document:', error);
      set({
        error: error.message || 'Failed to load document',
        isSaving: false,
        currentDocument: null,
      });
      throw error;
    }
  },

  loadAllDocuments: async () => {
    try {
      set({ isSaving: true, error: null });
      console.log('Loading all documents');

      const documents = await documentService.listDocuments();

      set({
        documents,
        isSaving: false,
      });

      return documents;
    } catch (error) {
      console.error('Error loading documents:', error);
      set({
        error: error.message || 'Failed to load documents',
        isSaving: false,
        documents: [],
      });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));

export { useDocumentStore };
