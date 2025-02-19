import React, { useState, useEffect } from 'react';
import { Send, X, Loader2, ThumbsUp, ThumbsDown } from 'lucide-react';
import { aiService } from '../../services/ai/openai';
import { useAIStore } from '../../store/aiStore';
import { documentService } from '../../services/supabase';

const AssistantPanel = ({ onClose, onApplyChanges, currentContent = '', documentId = null }) => {
  const [prompt, setPrompt] = useState('');
  const [localLoading, setLocalLoading] = useState(false);
  const [localError, setLocalError] = useState(null);
  const [selectedContent, setSelectedContent] = useState(null);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const {
    suggestions,
    addSuggestion,
    selectedSuggestion,
    setSelectedSuggestion,
    isLoading,
    error,
    setLoading,
    setError,
    updateStats,
    addFeedback,
    loadSuggestions,
    setCurrentDocument,
    clearSuggestions,
  } = useAIStore();

  // Load suggestions when document changes
  useEffect(() => {
    if (documentId) {
      setCurrentDocument(documentId);
      loadSuggestions(documentId);
    } else {
      // Clear suggestions for new documents
      setCurrentDocument(null);
      clearSuggestions();
    }
  }, [documentId, setCurrentDocument, loadSuggestions, clearSuggestions]);

  // Clear error when prompt changes
  useEffect(() => {
    if (error) {
      setError(null);
    }
    if (localError) {
      setLocalError(null);
    }
  }, [prompt, setError]);

  // Function to strip HTML tags from content
  const stripHtml = (html) => {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!prompt.trim() || !documentId) return;

    try {
      setLocalLoading(true);
      setLocalError(null);
      setError(null);

      // Strip HTML tags from content
      const cleanContent = currentContent ? stripHtml(currentContent) : '';
      
      console.log('Sending prompt to AI:', {
        prompt,
        context: cleanContent ? 'Selected/Current content available' : 'No content context',
        contentLength: cleanContent?.length || 0,
      });
      
      // Include current content in the prompt if available
      const fullPrompt = cleanContent 
        ? `Context:\n${cleanContent}\n\nPrompt: ${prompt}`
        : prompt;
      
      const result = await aiService.generateContent(fullPrompt);
      console.log('AI response received:', { resultLength: result?.length || 0 });
      
      const suggestion = {
        content: result,
        prompt,
        type: 'generation',
        context: cleanContent ? 'With editor content' : 'No context',
      };
      
      // Add suggestion to store and save to Supabase
      const newSuggestion = addSuggestion(suggestion);
      if (documentId) {
        await documentService.createSuggestion(documentId, newSuggestion);
      }
      
      updateStats(true);
      setPrompt('');
    } catch (err) {
      console.error('AI generation error:', err);
      setLocalError(err.message || 'Failed to generate content. Please try again.');
      updateStats(false);
    } finally {
      setLocalLoading(false);
    }
  };

  const handleApply = async (suggestion) => {
    setSelectedContent(suggestion.content);
    setShowApplyModal(true);
    setSelectedSuggestion(suggestion.id);
  };

  const handleApplyContent = (mode) => {
    if (mode === 'append') {
      // Append the content with a newline
      const newContent = currentContent 
        ? `${currentContent}\n\n${selectedContent}`
        : selectedContent;
      onApplyChanges(newContent);
    } else {
      // Replace the content
      onApplyChanges(selectedContent);
    }
    setShowApplyModal(false);
    setSelectedContent(null);
  };

  const handleFeedback = async (suggestionId, type) => {
    try {
      addFeedback(suggestionId, type);
      if (documentId) {
        await documentService.updateSuggestionFeedback(suggestionId, type);
      }
    } catch (error) {
      console.error('Error updating feedback:', error);
    }
  };

  const getPromptPlaceholder = () => {
    if (!documentId) {
      return 'Save document first to use AI suggestions...';
    }
    if (currentContent) {
      return 'Ask AI about the selected text...';
    }
    return 'Ask AI for suggestions...';
  };

  return (
    <>
      <div className="fixed bottom-0 right-0 w-96 bg-white border-l border-t shadow-lg rounded-tl-lg">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">AI Assistant</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full"
            aria-label="Close AI Assistant"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 h-96 overflow-y-auto">
          {suggestions.map((suggestion) => (
            <div
              key={suggestion.id}
              className={`mb-4 p-3 rounded-lg ${
                selectedSuggestion === suggestion.id
                  ? 'bg-blue-50 border border-blue-200'
                  : 'bg-gray-50'
              }`}
            >
              <div className="text-sm text-gray-600 mb-2">
                <div>Prompt: {suggestion.prompt}</div>
                {suggestion.context && (
                  <div className="text-xs text-gray-500 mt-1">
                    {suggestion.context}
                  </div>
                )}
              </div>
              <div className="text-gray-800 mb-2 whitespace-pre-wrap">
                {stripHtml(suggestion.content)}
              </div>
              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-500">
                  {new Date(suggestion.created_at).toLocaleTimeString()}
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleApply(suggestion)}
                    className="px-2 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded"
                  >
                    Apply
                  </button>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleFeedback(suggestion.id, 'positive')}
                      className={`p-1 hover:bg-gray-200 rounded ${
                        suggestion.feedback === 'positive' ? 'text-green-600' : ''
                      }`}
                      aria-label="Positive feedback"
                    >
                      <ThumbsUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleFeedback(suggestion.id, 'negative')}
                      className={`p-1 hover:bg-gray-200 rounded ${
                        suggestion.feedback === 'negative' ? 'text-red-600' : ''
                      }`}
                      aria-label="Negative feedback"
                    >
                      <ThumbsDown className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="p-4 border-t">
          {(localError || error) && (
            <div className="mb-2 text-sm text-red-600 bg-red-50 p-2 rounded">
              {localError || error}
            </div>
          )}
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={getPromptPlaceholder()}
              className={`flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                !documentId ? 'bg-gray-50' : ''
              }`}
            />
            <button
              type="submit"
              disabled={localLoading || isLoading || !prompt.trim() || !documentId}
              className={`p-2 text-white bg-blue-600 rounded-lg ${
                localLoading || isLoading || !prompt.trim() || !documentId
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:bg-blue-700'
              }`}
              aria-label={localLoading || isLoading ? 'Loading...' : 'Send'}
            >
              {localLoading || isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Apply Content Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Apply Content</h3>
            <p className="text-gray-600 mb-6">
              How would you like to apply this content?
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => handleApplyContent('append')}
                className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded"
              >
                Append
              </button>
              <button
                onClick={() => handleApplyContent('replace')}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Replace
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AssistantPanel;
