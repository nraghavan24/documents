import React, { useState } from 'react';
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
  Palette,
  Text,
  Type,
  Brush,
} from 'lucide-react';

const Toolbar = ({ editor }) => {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showFontSizeSelector, setShowFontSizeSelector] = useState(false);
  const [showFontFamilySelector, setShowFontFamilySelector] = useState(false);
  const [storedFormat, setStoredFormat] = useState(null);

  const fontFamilies = [
    'Arial',
    'Times New Roman',
    'Courier New',
    'Georgia',
    'Verdana',
    'Helvetica',
    'Tahoma',
    'Trebuchet MS',
  ];

  const fontSizes = [
    '12px',
    '14px',
    '16px',
    '18px',
    '20px',
    '24px',
    '28px',
    '32px',
  ];
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

      <div className="h-6 w-px bg-gray-200 mx-2" />

      {/* Color picker */}
      <div className="relative">
        <button
          onClick={() => setShowColorPicker(!showColorPicker)}
          className={`toolbar-button ${showColorPicker ? 'is-active' : ''}`}
          title="Text Color"
        >
          <Palette className="w-5 h-5" />
        </button>
        {showColorPicker && (
          <div className="absolute top-full left-0 mt-1 bg-white border rounded-lg shadow-lg p-2 z-50">
            <input
              type="color"
              onChange={(e) => {
                editor.chain().focus().setColor(e.target.value).run();
                setShowColorPicker(false);
              }}
              className="w-8 h-8 cursor-pointer"
            />
          </div>
        )}
      </div>

      {/* Font size selector */}
      <div className="relative">
        <button
          onClick={() => setShowFontSizeSelector(!showFontSizeSelector)}
          className={`toolbar-button ${showFontSizeSelector ? 'is-active' : ''}`}
          title="Font Size"
        >
          <Text className="w-5 h-5" />
        </button>
        {showFontSizeSelector && (
          <div className="absolute top-full left-0 mt-1 bg-white border rounded-lg shadow-lg py-1 z-50">
            {fontSizes.map((size) => (
              <button
                key={size}
                onClick={() => {
                  editor.chain().focus().setFontSize(size).run();
                  setShowFontSizeSelector(false);
                }}
                className="block w-full px-4 py-1 text-left hover:bg-gray-100"
              >
                {size}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Font family selector */}
      <div className="relative">
        <button
          onClick={() => setShowFontFamilySelector(!showFontFamilySelector)}
          className={`toolbar-button ${showFontFamilySelector ? 'is-active' : ''}`}
          title="Font Family"
        >
          <Type className="w-5 h-5" />
        </button>
        {showFontFamilySelector && (
          <div className="absolute top-full left-0 mt-1 bg-white border rounded-lg shadow-lg py-1 z-50 min-w-[150px]">
            {fontFamilies.map((font) => (
              <button
                key={font}
                onClick={() => {
                  editor.chain().focus().setFontFamily(font).run();
                  setShowFontFamilySelector(false);
                }}
                className="block w-full px-4 py-1 text-left hover:bg-gray-100"
                style={{ fontFamily: font }}
              >
                {font}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="h-6 w-px bg-gray-200 mx-2" />

      {/* Format painter */}
      <button
        onClick={() => {
          const { from, to } = editor.state.selection;
          if (!storedFormat && from !== to) {
            // Store current format from selection
            const format = {
              isBold: editor.isActive('bold'),
              isItalic: editor.isActive('italic'),
              isUnderline: editor.isActive('underline'),
              color: editor.getAttributes('textStyle').color,
              fontSize: editor.getAttributes('textStyle').fontSize,
              fontFamily: editor.getAttributes('textStyle').fontFamily,
              alignment: editor.isActive({ textAlign: 'left' }) ? 'left' :
                        editor.isActive({ textAlign: 'center' }) ? 'center' :
                        editor.isActive({ textAlign: 'right' }) ? 'right' :
                        editor.isActive({ textAlign: 'justify' }) ? 'justify' : 'left'
            };
            setStoredFormat(format);

            // Add selection change handler
            const handleSelectionChange = ({ editor }) => {
              const { from, to } = editor.state.selection;
              if (from !== to) {
                // Apply stored format to new selection
                editor.chain().focus()
                  .setTextAlign(format.alignment)
                  .setColor(format.color || null)
                  .setFontSize(format.fontSize || '16px')
                  .setFontFamily(format.fontFamily || null)
                  .run();

                if (format.isBold) editor.chain().focus().setBold().run();
                if (format.isItalic) editor.chain().focus().setItalic().run();
                if (format.isUnderline) editor.chain().focus().setUnderline().run();

                // Remove handler and stored format
                editor.off('selectionUpdate', handleSelectionChange);
                setStoredFormat(null);
              }
            };

            // Add selection change listener
            editor.on('selectionUpdate', handleSelectionChange);
          }
        }}
        className={`toolbar-button ${storedFormat ? 'format-painter-active' : ''}`}
        title={storedFormat ? 'Apply Format' : 'Copy Format'}
      >
        <Brush className="w-5 h-5" />
      </button>
    </div>
  );
};

export default Toolbar;
