import React from 'react';
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Heading1,
} from 'lucide-react';

const Toolbar = ({ editor }) => {
  if (!editor) {
    return null;
  }

  const tools = [
    {
      icon: Bold,
      title: 'Bold',
      action: () => editor.chain().focus().toggleBold().run(),
      isActive: editor.isActive('bold'),
    },
    {
      icon: Italic,
      title: 'Italic',
      action: () => editor.chain().focus().toggleItalic().run(),
      isActive: editor.isActive('italic'),
    },
    {
      icon: List,
      title: 'Bullet List',
      action: () => editor.chain().focus().toggleBulletList().run(),
      isActive: editor.isActive('bulletList'),
    },
    {
      icon: ListOrdered,
      title: 'Numbered List',
      action: () => editor.chain().focus().toggleOrderedList().run(),
      isActive: editor.isActive('orderedList'),
    },
    {
      icon: Heading1,
      title: 'Heading 1',
      action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
      isActive: editor.isActive('heading', { level: 1 }),
    },
    {
      icon: AlignLeft,
      title: 'Align Left',
      action: () => editor.chain().focus().setTextAlign('left').run(),
      isActive: editor.isActive({ textAlign: 'left' }),
    },
    {
      icon: AlignCenter,
      title: 'Align Center',
      action: () => editor.chain().focus().setTextAlign('center').run(),
      isActive: editor.isActive({ textAlign: 'center' }),
    },
    {
      icon: AlignRight,
      title: 'Align Right',
      action: () => editor.chain().focus().setTextAlign('right').run(),
      isActive: editor.isActive({ textAlign: 'right' }),
    },
  ];

  return (
    <div className="flex items-center space-x-1 border-b p-2" role="toolbar" aria-label="Formatting options">
      {tools.map((tool, index) => (
        <button
          key={index}
          onClick={tool.action}
          className={`p-2 rounded hover:bg-gray-100 transition-colors ${
            tool.isActive ? 'bg-gray-100 text-blue-600' : 'text-gray-600'
          }`}
          title={tool.title}
          type="button"
          aria-label={tool.title}
          aria-pressed={tool.isActive}
        >
          <tool.icon className="w-5 h-5" />
        </button>
      ))}
    </div>
  );
};

export default Toolbar;
