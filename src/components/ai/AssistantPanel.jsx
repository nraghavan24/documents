import React, { useState, useEffect } from 'react';
import { Send, X, Loader2, ThumbsUp, ThumbsDown, MessageSquare, Edit3, Maximize2, Minimize2, Trash2 } from 'lucide-react';
import { aiService } from '../../services/ai/openai';
import { useAIStore } from '../../store/aiStore';
import { documentService, conversationService } from '../../services/supabase';

const ModeToggle = ({ mode, onModeChange, disabled }) => (
  <div className="flex items-center justify-center space-x-2 mb-4 border-b pb-4">
    <button
      onClick={() => onModeChange('create')}
      disabled={disabled}
      className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
        mode === 'create'
          ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-200'
          : disabled 
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'hover:bg-emerald-50 text-emerald-600'
      }`}
    >
      <Edit3 className="w-4 h-4 mr-2" />
      Create
    </button>
    <button
      onClick={() => onModeChange('support')}
      disabled={disabled}
      className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
        mode === 'support'
          ? 'bg-purple-100 text-purple-700 border-2 border-purple-200'
          : disabled
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'hover:bg-purple-50 text-purple-600'
      }`}
    >
      <MessageSquare className="w-4 h-4 mr-2" />
      Support
    </button>
  </div>
);

const ConversationHistory = ({ history }) => (
  <div className="space-y-4">
    {history.map((message) => (
      <div
        key={message.id}
        className={`p-3 rounded-lg ${
          message.role === 'user' ? 'bg-purple-50 ml-4' : 'bg-gray-50 mr-4'
        }`}
      >
        <div className="text-sm font-medium mb-1">
          {message.role === 'user' ? 'You' : 'AI'}
        </div>
        <div className="text-gray-800 whitespace-pre-wrap" 
          dangerouslySetInnerHTML={{ __html: message.content }} 
        />
        <div className="text-xs text-gray-500 mt-1">
          {new Date(message.timestamp).toLocaleTimeString()}
        </div>
      </div>
    ))}
  </div>
);

const AssistantPanel = ({ onClose, onApplyChanges, currentContent = '', documentId = null }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [localLoading, setLocalLoading] = useState(false);
  const [localError, setLocalError] = useState(null);
  const [selectedContent, setSelectedContent] = useState(null);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const {
    mode,
    setMode,
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
    conversationHistory,
    addToConversationHistory,
    clearConversationHistory,
    currentSession,
    setCurrentSession,
    loadConversationHistory,
  } = useAIStore();

  // Load suggestions when document changes
  useEffect(() => {
    if (documentId) {
      setCurrentDocument(documentId);
      if (mode === 'create') {
        loadSuggestions(documentId);
      }
    } else {
      setCurrentDocument(null);
      clearSuggestions();
    }
  }, [documentId, mode, setCurrentDocument, loadSuggestions, clearSuggestions]);

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

      // Strip HTML tags from content and validate
      const cleanContent = currentContent ? stripHtml(currentContent) : '';
      
      if (!cleanContent.trim()) {
        throw new Error('Please add meaningful content to the document first. The document appears to be empty or contains only formatting.');
      }

      console.log('Document content:', {
        raw: currentContent,
        cleaned: cleanContent,
        length: cleanContent.length
      });
      
      if (mode === 'create') {
        console.log('Sending prompt to AI:', {
          prompt,
          context: cleanContent ? 'Selected/Current content available' : 'No content context',
          contentLength: cleanContent?.length || 0,
        });
        
        // Include current content in the prompt if available
        const fullPrompt = cleanContent 
          ? `Context:\n${cleanContent}\n\nPrompt: ${prompt}`
          : prompt;
        
        const result = await aiService.generateContent(fullPrompt, mode);
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
      } else {
        // Support mode
        if (!currentSession) {
          throw new Error('No active conversation session');
        }

        const result = await aiService.answerQuestion(cleanContent, prompt, conversationHistory.map(msg => ({
          question: msg.role === 'user' ? msg.content : '',
          answer: msg.role === 'assistant' ? msg.content : ''
        })));
        
        // Save messages to database and update local state
        const userMessage = await conversationService.addMessage(currentSession, 'user', prompt);
        const aiMessage = await conversationService.addMessage(currentSession, 'assistant', result);
        
        // Add messages to conversation history
        addToConversationHistory({
          id: userMessage.id,
          role: 'user',
          content: prompt,
          timestamp: userMessage.created_at
        });
        
        addToConversationHistory({
          id: aiMessage.id,
          role: 'assistant',
          content: result,
          timestamp: aiMessage.created_at
        });
      }
      
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

  const handleModeChange = async (newMode) => {
    if (newMode === mode || localLoading) return;
    
    try {
      // Validate document ID
      if (!documentId) {
        setLocalError('Please save the document first before using support mode');
        return;
      }

      setLocalLoading(true);
      setLocalError(null);
      console.log('Changing mode to:', newMode, 'for document:', documentId);

      if (newMode === 'support') {
        clearSuggestions();
        try {
          // Check for existing session
          const sessions = await conversationService.getDocumentSessions(documentId);
          let session;

          if (sessions && sessions.length > 0) {
            // Use existing session
            session = sessions[0]; // Most recent session
            console.log('Using existing session:', session);
          } else {
            // Create new session if none exists
            console.log('Creating new conversation session...');
            session = await conversationService.createSession(documentId);
            console.log('Created new session:', session);
          }

          if (!session || !session.id) {
            throw new Error('Failed to get/create conversation session');
          }

          setCurrentSession(session.id);
          await loadConversationHistory(session.id);
        } catch (error) {
          console.error('Support mode setup error:', error);
          throw error;
        }
      } else {
        // Don't clear history when switching to create mode
        setCurrentSession(null);
        if (documentId) {
          loadSuggestions(documentId);
        }
      }
      setMode(newMode);
    } catch (err) {
      console.error('Error changing mode:', err);
      setLocalError(err.message || 'Failed to change mode');
      // Reset mode on error
      setMode('create');
    } finally {
      setLocalLoading(false);
    }
  };

  const getPromptPlaceholder = () => {
    if (!documentId) {
      return 'Save document first to use AI...';
    }
    if (mode === 'support') {
      return 'Ask a question about the document...';
    }
    if (currentContent) {
      return 'Ask AI about the selected text...';
    }
    return 'Ask AI for suggestions...';
  };

  return (
    <>
      <div className={`fixed transition-all duration-300 ease-in-out bg-white border shadow-xl rounded-xl overflow-hidden ${
        isExpanded 
          ? 'top-4 bottom-4 right-4 left-[calc(50%-2rem)] max-w-4xl' 
          : 'bottom-8 right-8 w-96'
      }`}>
        <div className={`flex items-center justify-between p-4 border-b ${
          mode === 'create' ? 'bg-emerald-50' : 'bg-purple-50'
        }`}>
          <h3 className={`text-lg font-semibold ${
            mode === 'create' ? 'text-emerald-700' : 'text-purple-700'
          }`}>AI Assistant</h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 hover:bg-white/50 rounded-full transition-colors"
              aria-label={isExpanded ? "Collapse" : "Expand"}
            >
              {isExpanded ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>
            <button
              onClick={onClose}
              className="p-1 hover:bg-white/50 rounded-full transition-colors"
              aria-label="Close AI Assistant"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between px-4">
          <ModeToggle 
            mode={mode} 
            onModeChange={handleModeChange} 
            disabled={!documentId || localLoading}
          />
          <button
            onClick={() => setShowClearConfirm(true)}
            className="flex items-center px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title={mode === 'support' ? 'Clear History' : 'Clear Suggestions'}
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Clear
          </button>
        </div>

        {localLoading && (
          <div className="flex justify-center items-center p-4">
            <Loader2 className={`w-6 h-6 animate-spin ${
              mode === 'create' ? 'text-emerald-600' : 'text-purple-600'
            }`} />
          </div>
        )}

        <div className={`p-4 overflow-y-auto bg-gray-50/50 ${
          isExpanded ? 'h-[calc(100%-11rem)]' : 'h-96'
        }`}>
          {mode === 'create' ? (
            // Create mode - show suggestions
            suggestions.map((suggestion) => (
              <div
                key={suggestion.id}
                className={`mb-4 p-3 rounded-lg bg-white border transition-shadow hover:shadow-md ${
                  selectedSuggestion === suggestion.id
                    ? 'border-emerald-200 shadow-md'
                    : 'border-gray-100'
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
                      className="px-2 py-1 text-sm text-emerald-600 hover:bg-emerald-50 rounded"
                    >
                      Apply
                    </button>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleFeedback(suggestion.id, 'positive')}
                        className={`p-1 hover:bg-gray-100 rounded ${
                          suggestion.feedback === 'positive' ? 'text-green-600' : ''
                        }`}
                        aria-label="Positive feedback"
                      >
                        <ThumbsUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleFeedback(suggestion.id, 'negative')}
                        className={`p-1 hover:bg-gray-100 rounded ${
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
            ))
          ) : (
            // Support mode - show conversation history
            <ConversationHistory history={conversationHistory} />
          )}
        </div>

        <form onSubmit={handleSubmit} className="p-4 border-t bg-white">
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
              disabled={localLoading}
              className={`flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                mode === 'create' 
                  ? 'focus:ring-emerald-500' 
                  : 'focus:ring-purple-500'
              } ${
                !documentId || localLoading ? 'bg-gray-50' : ''
              }`}
            />
            <button
              type="submit"
              disabled={localLoading || isLoading || !prompt.trim() || !documentId}
              className={`p-2 text-white rounded-lg transition-colors ${
                mode === 'create'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-purple-600 hover:bg-purple-700'
              } ${
                localLoading || isLoading || !prompt.trim() || !documentId
                  ? 'opacity-50 cursor-not-allowed'
                  : ''
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

      {/* Clear History Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]" onClick={() => setShowClearConfirm(false)}>
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">
              {mode === 'support' ? 'Clear Conversation History' : 'Clear Suggestions'}
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to clear {mode === 'support' ? 'the entire conversation history' : 'all suggestions'}? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    setLocalLoading(true);
                    if (mode === 'support' && currentSession) {
                      console.log('Clearing conversation history for session:', currentSession);
                      await conversationService.clearSessionMessages(currentSession);
                      clearConversationHistory();
                      console.log('Conversation history cleared');
                    } else if (mode === 'create' && documentId) {
                      console.log('Clearing suggestions for document:', documentId);
                      await documentService.clearDocumentSuggestions(documentId);
                      clearSuggestions();
                      console.log('Suggestions cleared');
                    }
                    setShowClearConfirm(false);
                  } catch (error) {
                    console.error('Error clearing data:', error);
                    setLocalError('Failed to clear data. Please try again.');
                  } finally {
                    setLocalLoading(false);
                  }
                }}
                disabled={localLoading}
                className={`px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 flex items-center ${
                  localLoading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {localLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Clearing...
                  </>
                ) : (
                  'Clear'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Apply Content Modal */}
      {showApplyModal && mode === 'create' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold mb-4">Apply Content</h3>
            <p className="text-gray-600 mb-6">
              How would you like to apply this content?
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => handleApplyContent('append')}
                className="px-4 py-2 text-emerald-600 hover:bg-emerald-50 rounded"
              >
                Append
              </button>
              <button
                onClick={() => handleApplyContent('replace')}
                className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700"
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
