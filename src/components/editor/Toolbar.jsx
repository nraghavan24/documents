import React from 'react';
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Quote,
  Heading1,
  Heading2,
  Heading3,
} from 'lucide-react';

const Toolbar = ({ editor }) => {
  if (!editor) {
    return null;
  }

  const headingLevels = [
    { level: 1, icon: Heading1 },
    { level: 2, icon: Heading2 },
    { level: 3, icon: Heading3 },
  ];

  const alignments = [
    { name: 'left', icon: AlignLeft },
    { name: 'center', icon: AlignCenter },
    { name: 'right', icon: AlignRight },
    { name: 'justify', icon: AlignJustify },
  ];

  return (
    <div className="flex items-center space-x-1 p-1">
      {/* Text style buttons */}
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        className={`toolbar-button ${editor.isActive('bold') ? 'is-active' : ''}`}
        title="Bold"
      >
        <Bold className="w-5 h-5" />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        className={`toolbar-button ${editor.isActive('italic') ? 'is-active' : ''}`}
        title="Italic"
      >
        <Italic className="w-5 h-5" />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={`toolbar-button ${editor.isActive('underline') ? 'is-active' : ''}`}
        title="Underline"
      >
        <Underline className="w-5 h-5" />
      </button>

      <div className="h-6 w-px bg-gray-200 mx-2" />

      {/* Heading buttons */}
      {headingLevels.map(({ level, icon: Icon }) => (
        <button
          key={level}
          onClick={() => editor.chain().focus().toggleHeading({ level }).run()}
          className={`toolbar-button ${
            editor.isActive('heading', { level }) ? 'is-active' : ''
          }`}
          title={`Heading ${level}`}
        >
          <Icon className="w-5 h-5" />
        </button>
      ))}

      <div className="h-6 w-px bg-gray-200 mx-2" />

      {/* List buttons */}
      <button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`toolbar-button ${editor.isActive('bulletList') ? 'is-active' : ''}`}
        title="Bullet List"
      >
        <List className="w-5 h-5" />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`toolbar-button ${editor.isActive('orderedList') ? 'is-active' : ''}`}
        title="Numbered List"
      >
        <ListOrdered className="w-5 h-5" />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={`toolbar-button ${editor.isActive('blockquote') ? 'is-active' : ''}`}
        title="Quote"
      >
        <Quote className="w-5 h-5" />
      </button>

      <div className="h-6 w-px bg-gray-200 mx-2" />

      {/* Alignment buttons */}
      {alignments.map(({ name, icon: Icon }) => (
        <button
          key={name}
          onClick={() => editor.chain().focus().setTextAlign(name).run()}
          className={`toolbar-button ${editor.isActive({ textAlign: name }) ? 'is-active' : ''}`}
          title={`Align ${name}`}
        >
          <Icon className="w-5 h-5" />
        </button>
      ))}
    </div>
  );
};

export default Toolbar;
