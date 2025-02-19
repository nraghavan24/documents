import React from 'react';
import { Wand2, Check, Sparkles, FileText, Loader2 } from 'lucide-react';
import { aiService } from '../../services/ai/openai';
import { useAIStore } from '../../store/aiStore';

const ContextMenu = ({ text, onUpdate, position, onClose }) => {
  const {
    isLoading,
    error,
    setLoading,
    setError,
    addToHistory,
    updateStats,
  } = useAIStore();

  const handleAction = async (action) => {
    try {
      setLoading(true);
      setError(null);
      let result;
      let actionType;

      switch (action) {
        case 'improve':
          result = await aiService.improveWriting(text);
          actionType = 'improve';
          break;
        case 'grammar':
          result = await aiService.fixGrammar(text);
          actionType = 'grammar';
          break;
        case 'generate':
          result = await aiService.generateContent(`Continue this text: ${text}`);
          actionType = 'generate';
          break;
        case 'summarize':
          result = await aiService.summarize(text);
          actionType = 'summarize';
          break;
        default:
          throw new Error('Unknown action');
      }

      addToHistory({
        type: actionType,
        originalText: text,
        resultText: result,
      });

      updateStats(true);
      onUpdate(result);
    } catch (err) {
      setError(err.message);
      updateStats(false);
      console.error('AI action error:', err);
    } finally {
      setLoading(false);
    }
  };

  const menuStyle = {
    position: 'absolute',
    top: `${position.y}px`,
    left: `${position.x}px`,
    zIndex: 1000,
  };

  const actions = [
    { id: 'improve', icon: Wand2, label: 'Improve Writing' },
    { id: 'grammar', icon: Check, label: 'Fix Grammar' },
    { id: 'generate', icon: Sparkles, label: 'Continue Writing' },
    { id: 'summarize', icon: FileText, label: 'Summarize' },
  ];

  return (
    <>
      <div
        className="fixed inset-0"
        onClick={onClose}
      />
      <div
        style={menuStyle}
        className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden"
      >
        <div className="p-1 min-w-[200px]">
          {actions.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => handleAction(id)}
              disabled={isLoading}
              className={`w-full px-3 py-2 text-left flex items-center space-x-2 hover:bg-gray-100 rounded ${
                isLoading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <Icon className="w-4 h-4 text-blue-600" />
              <span>{label}</span>
              {isLoading && (
                <Loader2 className="w-4 h-4 animate-spin ml-auto" />
              )}
            </button>
          ))}
        </div>
        {error && (
          <div className="px-3 py-2 text-sm text-red-600 bg-red-50 border-t">
            {error}
          </div>
        )}
      </div>
    </>
  );
};

export default ContextMenu;
