import React, { useEffect, useState, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import { Bot, Save } from 'lucide-react';
import Toolbar from './Toolbar';
import ContextMenu from '../ai/ContextMenu';
import AssistantPanel from '../ai/AssistantPanel';
import { useDocumentStore } from '../../store/documentStore';

const Editor = ({
  initialContent = '',
  documentId = null,
  title = '',
  readOnly = false,
  className = '',
  canSave = false,
}) => {
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [showAssistant, setShowAssistant] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const [selectedText, setSelectedText] = useState('');
  const [currentContent, setCurrentContent] = useState('');
  const [autoSaveTimeout, setAutoSaveTimeout] = useState(null);
  const { saveDocument, updateDocument, isSaving, error } = useDocumentStore();

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        history: true,
        dropcursor: true,
        gapcursor: true,
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
    ],
    content: initialContent,
    editable: !readOnly,
    autofocus: true,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      console.log('Editor content updated:', html);
      setCurrentContent(html);
      
      // Start auto-save timer when content changes
      if (documentId && canSave) {
        // Clear existing timeout
        if (autoSaveTimeout) {
          clearTimeout(autoSaveTimeout);
        }
        // Set new timeout
        const timeoutId = setTimeout(() => {
          handleSave(html);
        }, 2000);
        setAutoSaveTimeout(timeoutId);
      }
    },
    onSelectionUpdate: ({ editor }) => {
      const { from, to } = editor.state.selection;
      const text = editor.state.doc.textBetween(from, to, ' ');
      setSelectedText(text);
      
      // Update current content to selected text if there's a selection
      if (text) {
        setCurrentContent(text);
      } else {
        setCurrentContent(editor.getHTML());
      }
    },
  });

  // Clean up auto-save timeout on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout);
      }
    };
  }, [autoSaveTimeout]);

  useEffect(() => {
    if (editor && initialContent !== editor.getHTML()) {
      editor.commands.setContent(initialContent);
    }
  }, [editor, initialContent]);

  useEffect(() => {
    const handleContextMenu = (e) => {
      if (!editor || !editor.state.selection.content().size) {
        return;
      }

      e.preventDefault();
      setContextMenuPosition({ x: e.clientX, y: e.clientY });
      setShowContextMenu(true);
    };

    document.addEventListener('contextmenu', handleContextMenu);
    return () => document.removeEventListener('contextmenu', handleContextMenu);
  }, [editor]);

  const handleContextMenuUpdate = useCallback((newContent) => {
    if (editor) {
      const { from, to } = editor.state.selection;
      
      // Store the current selection
      const selection = { from, to };
      
      // Replace content at selection
      editor
        .chain()
        .focus()
        .insertContentAt(selection, newContent)
        .run();

      setShowContextMenu(false);

      // Save after context menu update if we can
      if (canSave && documentId) {
        handleSave(editor.getHTML());
      }
    }
  }, [editor, canSave, documentId]);

  const handleAssistantUpdate = useCallback((newContent) => {
    if (editor) {
      try {
        // Get the current selection
        const { from, to } = editor.state.selection;
        const hasSelection = from !== to;

        // Create a transaction to update the content
        if (hasSelection) {
          // If there's a selection, replace it
          editor
            .chain()
            .focus()
            .deleteSelection()
            .insertContent(newContent)
            .run();
        } else {
          // If no selection, replace entire content
          editor
            .chain()
            .focus()
            .setContent(newContent)
            .run();
        }
        
        // Save the updated content if we have a title
        const html = editor.getHTML();
        console.log('Updated editor content:', html);
        if (canSave && documentId) {
          handleSave(html);
        }
      } catch (error) {
        console.error('Error updating editor content:', error);
      }
    }
  }, [editor, canSave, documentId]);

  const handleSave = useCallback(async (content) => {
    if (!editor || !canSave) return;

    try {
      if (documentId) {
        console.log('Saving formatted content:', content);
        await updateDocument(documentId, { 
          content: content,
          title: title 
        });
      } else if (title.trim()) {
        const document = await saveDocument(title, content);
        // Return the new document ID so App can update the URL
        return document.id;
      }
    } catch (error) {
      console.error('Error saving document:', error);
    }
  }, [editor, documentId, title, saveDocument, updateDocument, canSave]);

  if (!editor) {
    return null;
  }

  return (
    <div className="flex flex-col w-full h-full relative">
      <div className="flex items-center justify-between border-b">
        <Toolbar editor={editor} />
        <div className="flex items-center">
          <button
            onClick={() => handleSave(editor.getHTML())}
            disabled={isSaving || !canSave}
            className={`p-2 mx-2 rounded hover:bg-gray-100 transition-colors ${
              isSaving || !canSave ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            title={canSave ? 'Save Document' : 'Please enter a title to save'}
          >
            <Save className="w-5 h-5" />
          </button>
          <button
            onClick={() => setShowAssistant(!showAssistant)}
            className={`p-2 mx-2 rounded hover:bg-gray-100 transition-colors ${
              showAssistant ? 'bg-blue-50 text-blue-600' : ''
            }`}
            title="AI Assistant"
          >
            <Bot className="w-5 h-5" />
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-2 text-sm">
          {error}
        </div>
      )}

      <div className={`flex-1 overflow-y-auto prose max-w-none ${className}`}>
        <EditorContent editor={editor} className="min-h-[300px] p-4" />
      </div>

      {showContextMenu && selectedText && (
        <ContextMenu
          text={selectedText}
          position={contextMenuPosition}
          onUpdate={handleContextMenuUpdate}
          onClose={() => setShowContextMenu(false)}
        />
      )}

      {showAssistant && (
        <AssistantPanel
          onClose={() => setShowAssistant(false)}
          onApplyChanges={handleAssistantUpdate}
          currentContent={currentContent}
          documentId={documentId}
        />
      )}
    </div>
  );
};

export default Editor;
