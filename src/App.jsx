import React, { useState, useEffect, useRef, useCallback } from 'react';
import Editor from './components/editor/Editor';
import DocumentUpload from './components/upload/DocumentUpload';
import { useDocumentStore } from './store/documentStore';
import { ChevronDown, FileText, Upload } from 'lucide-react';
import { useClickOutside } from './hooks/useClickOutside';

function App() {
  const {
    currentDocument,
    loadDocument,
    loadAllDocuments,
    documents,
    isSaving,
    error: docError,
    setCurrentDocument,
    updateDocument
  } = useDocumentStore();
  
  const [title, setTitle] = useState('');
  const [error, setError] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const dropdownRef = useRef(null);
  const titleTimeoutRef = useRef(null);

  // Handle click outside to close dropdown
  useClickOutside(dropdownRef, () => setIsDropdownOpen(false));

  // Load documents on mount
  useEffect(() => {
    const loadDocs = async () => {
      try {
        await loadAllDocuments();
      } catch (err) {
        console.error('Error loading documents:', err);
        setError('Failed to load documents');
      }
    };
    loadDocs();
  }, [loadAllDocuments]);

  // Load specific document from URL if available
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const docId = params.get('id');
    if (docId) {
      const loadDoc = async () => {
        try {
          await loadDocument(docId);
        } catch (err) {
          console.error('Error loading document:', err);
          setError('Failed to load document');
        }
      };
      loadDoc();
    } else {
      // No document ID in URL, start with a new document
      handleNewDocument();
    }
  }, [loadDocument]);

  // Update title when current document changes
  useEffect(() => {
    if (currentDocument?.title) {
      setTitle(currentDocument.title);
    } else {
      setTitle('');
    }
  }, [currentDocument]);

  // Update URL when document changes
  useEffect(() => {
    const url = new URL(window.location);
    if (currentDocument?.id) {
      url.searchParams.set('id', currentDocument.id);
    } else {
      url.searchParams.delete('id');
    }
    window.history.pushState({}, '', url);
  }, [currentDocument?.id]);

  // Clean up title update timeout on unmount
  useEffect(() => {
    return () => {
      if (titleTimeoutRef.current) {
        clearTimeout(titleTimeoutRef.current);
      }
    };
  }, []);

  const handleNewDocument = useCallback(() => {
    // Clear current document
    setCurrentDocument(null);
    // Reset title
    setTitle('');
    // Clear URL parameter
    const url = new URL(window.location);
    url.searchParams.delete('id');
    window.history.pushState({}, '', url);
    // Close dropdown
    setIsDropdownOpen(false);
  }, [setCurrentDocument]);

  const handleDocumentChange = useCallback(async (docId) => {
    try {
      if (docId) {
        await loadDocument(docId);
      } else {
        handleNewDocument();
      }
      // Close dropdown
      setIsDropdownOpen(false);
    } catch (err) {
      console.error('Error changing document:', err);
      setError('Failed to load document');
    }
  }, [loadDocument, handleNewDocument]);

  const handleTitleChange = useCallback((newTitle) => {
    setTitle(newTitle);
    setError(null);
    
    // Debounce title updates
    if (titleTimeoutRef.current) {
      clearTimeout(titleTimeoutRef.current);
    }

    if (currentDocument?.id && newTitle.trim()) {
      titleTimeoutRef.current = setTimeout(async () => {
        try {
          await updateDocument(currentDocument.id, { title: newTitle });
        } catch (err) {
          console.error('Error updating title:', err);
          setError('Failed to update title');
        }
      }, 1000);
    }
  }, [currentDocument?.id, updateDocument]);

  const handleTitleBlur = useCallback(async () => {
    if (titleTimeoutRef.current) {
      clearTimeout(titleTimeoutRef.current);
    }
    
    if (currentDocument?.id && title.trim()) {
      try {
        await updateDocument(currentDocument.id, { title: title.trim() });
      } catch (err) {
        console.error('Error updating title:', err);
        setError('Failed to update title');
      }
    }
  }, [currentDocument?.id, title, updateDocument]);

  const canSave = title.trim().length > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 flex-1">
              {/* Document selector */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center space-x-2 px-3 py-2 bg-white border rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
                >
                  <FileText className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700 min-w-[100px]">
                    {currentDocument ? currentDocument.title : 'New Document'}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isDropdownOpen ? 'transform rotate-180' : ''}`} />
                </button>

                {isDropdownOpen && (
                  <div className="absolute z-10 mt-1 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-1 transform opacity-100 scale-100 transition-all duration-200 ease-out">
                    <button
                      onClick={() => handleDocumentChange('')}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 focus:outline-none focus:bg-gray-50 transition-colors duration-200"
                    >
                      New Document
                    </button>
                    {documents.length > 0 && (
                      <div className="border-t border-gray-100 my-1" />
                    )}
                    <div className="max-h-64 overflow-y-auto">
                      {documents.map((doc) => (
                        <button
                          key={doc.id}
                          onClick={() => handleDocumentChange(doc.id)}
                          className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 focus:outline-none focus:bg-gray-50 transition-colors duration-200 ${
                            currentDocument?.id === doc.id ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                          }`}
                        >
                          {doc.title}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="h-6 w-px bg-gray-200" />

              <input
                type="text"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                onBlur={handleTitleBlur}
                className={`flex-1 text-lg font-medium bg-transparent border-none focus:outline-none focus:ring-0 ${
                  !title.trim() ? 'text-red-500 placeholder-red-300' : 'text-gray-900 placeholder-gray-400'
                }`}
                placeholder="Enter document title"
              />

              <button
                onClick={() => setShowUpload(true)}
                className="flex items-center space-x-2 px-3 py-2 bg-white border rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
              >
                <Upload className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Upload</span>
              </button>
            </div>

            {/* Status messages */}
            <div className="flex items-center space-x-4">
              {!title.trim() && (
                <span className="text-red-600 text-sm bg-red-50 px-3 py-1 rounded-full">
                  Please enter a title
                </span>
              )}
              {(error || docError) && (
                <span className="text-red-600 text-sm bg-red-50 px-3 py-1 rounded-full">
                  {error || docError}
                </span>
              )}
              {isSaving && (
                <span className="text-gray-500 text-sm bg-gray-50 px-3 py-1 rounded-full animate-pulse">
                  Saving...
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm min-h-[calc(100vh-12rem)]">
          <Editor
            documentId={currentDocument?.id}
            title={title}
            initialContent={currentDocument?.content || ''}
            className="p-6"
            canSave={canSave}
          />
        </div>
      </main>

      {showUpload && (
        <DocumentUpload onClose={() => setShowUpload(false)} />
      )}
    </div>
  );
}

export default App;
