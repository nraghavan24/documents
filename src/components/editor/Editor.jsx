import React, { useEffect, useState, useCallback } from 'react';
import './Editor.css';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import { FontSize } from '@tiptap/extension-font-size';
import { FontFamily } from '@tiptap/extension-font-family';
import { Bot, Save } from 'lucide-react';
import Toolbar from './Toolbar';
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
  const [showAssistant, setShowAssistant] = useState(false);
  const { saveDocument, updateDocument, isSaving, error } = useDocumentStore();

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Enable all default extensions
        document: true,
        paragraph: true,
        text: true,
        heading: {
          levels: [1, 2, 3]
        },
        bulletList: true,
        orderedList: true,
        listItem: true,
        bold: true,
        italic: true,
        blockquote: true,
        hardBreak: true,
        horizontalRule: true,
      }),
      TextStyle,
      Underline,
      Color.configure(),
      FontSize.configure({
        types: ['textStyle'],
        defaultSize: '16px',
      }),
      FontFamily.configure({
        types: ['textStyle'],
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph', 'bulletList', 'orderedList', 'listItem'],
        alignments: ['left', 'center', 'right', 'justify'],
      }),
    ],
    content: initialContent,
    editable: !readOnly,
    autofocus: true,
    onUpdate: ({ editor }) => {
      if (documentId && canSave) {
        handleSave(editor.getHTML());
      }
    },
  });

  useEffect(() => {
    if (editor && initialContent !== editor.getHTML()) {
      editor.commands.setContent(initialContent);
    }
  }, [editor, initialContent]);

  const handleSave = useCallback(async (content) => {
    if (!editor || !canSave) return;

    try {
      if (documentId) {
        await updateDocument(documentId, {
          content: content,
          title: title,
        });
      } else if (title.trim()) {
        const document = await saveDocument(title, content);
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
    <div className="flex flex-col w-full h-full">
      <div className="editor-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
          <div className="flex items-center justify-between">
            <Toolbar editor={editor} />
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleSave(editor.getHTML())}
                disabled={isSaving || !canSave}
                className={`p-2.5 rounded-lg transition-all duration-200 ${
                  isSaving || !canSave
                    ? 'opacity-50 cursor-not-allowed bg-gray-100 text-gray-400'
                    : 'hover:bg-emerald-50 hover:text-emerald-600 text-gray-600 hover:shadow-sm active:scale-95'
                }`}
                title={canSave ? 'Save Document' : 'Please enter a title to save'}
              >
                <Save className="w-5 h-5" />
              </button>
              <button
                onClick={() => setShowAssistant(!showAssistant)}
                disabled={!documentId}
                className={`p-2.5 rounded-lg transition-all duration-200 ${
                  !documentId
                    ? 'opacity-50 cursor-not-allowed bg-gray-100 text-gray-400'
                    : showAssistant
                      ? 'bg-purple-100 text-purple-600 shadow-sm'
                      : 'hover:bg-purple-50 hover:text-purple-600 text-gray-600 hover:shadow-sm active:scale-95'
                }`}
                title={documentId ? 'AI Assistant' : 'Please save document first to use AI Assistant'}
              >
                <Bot className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 text-sm border-b border-red-100 animate-fade-in">
          {error}
        </div>
      )}

      <div className={`flex-1 overflow-y-auto ${className}`}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <EditorContent editor={editor} />
        </div>
      </div>

      {showAssistant && (
        <AssistantPanel
          onClose={() => setShowAssistant(false)}
          onApplyChanges={(content) => {
            editor.commands.setContent(content);
            if (canSave && documentId) {
              handleSave(content);
            }
          }}
          currentContent={editor.getHTML()}
          documentId={documentId}
        />
      )}
    </div>
  );
};

export default Editor;
