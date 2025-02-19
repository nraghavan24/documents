import mammoth from 'mammoth';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf';
import { supabase } from './supabase';

// Configure PDF.js
const pdfjsVersion = '2.16.105';
const pdfjsWorker = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsVersion}/pdf.worker.min.js`;

// Custom style map for DOCX conversion
const customStyleMap = [
  "p[style-name='Heading 1'] => h1:fresh",
  "p[style-name='Heading 2'] => h2:fresh",
  "p[style-name='Heading 3'] => h3:fresh",
  "p[style-name='Heading 4'] => h4:fresh",
  "p[style-name='Heading 5'] => h5:fresh",
  "p[style-name='Heading 6'] => h6:fresh",
  "p[style-name='Quote'] => blockquote:fresh",
  "p[style-name='List Paragraph'] => p:fresh"
];

// Custom element transform for DOCX
const transformElement = (element) => {
  // Create a new element to hold our transformations
  let newElement = { ...element };

  // Handle text alignment
  if (element.alignment) {
    newElement.styleId = `aligned-${element.alignment}`;
  }

  // Handle font styles
  if (element.bold) {
    newElement = { 
      type: 'element',
      tag: 'strong',
      children: [newElement]
    };
  }
  if (element.italic) {
    newElement = {
      type: 'element',
      tag: 'em',
      children: [newElement]
    };
  }
  if (element.underline) {
    newElement = {
      type: 'element',
      tag: 'u',
      children: [newElement]
    };
  }

  return newElement;
};

const generateUniqueFileName = (originalName) => {
  const timestamp = new Date().getTime();
  const extension = originalName.split('.').pop();
  const baseName = originalName.slice(0, -(extension.length + 1));
  return `${baseName}_${timestamp}.${extension}`;
};

export const documentUploadService = {
  async processFile(file) {
    try {
      const fileType = file.type;
      let content = '';
      let originalUrl = '';

      // Validate file type
      if (!fileType) {
        throw new Error('File type not detected');
      }

      // Validate file size (100MB limit)
      if (file.size > 100 * 1024 * 1024) {
        throw new Error('File size exceeds 100MB limit');
      }

      // Generate unique filename
      const uniqueFileName = generateUniqueFileName(file.name);

      // Upload original file to Supabase storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(`originals/${uniqueFileName}`, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        throw new Error('Failed to upload file to storage');
      }

      originalUrl = uploadData.path;

      // Process based on file type
      if (fileType === 'application/pdf') {
        content = await processPDF(file);
      } else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        content = await processDocx(file);
      } else {
        throw new Error(`Unsupported file type: ${fileType}`);
      }

      return {
        content,
        metadata: {
          originalFileName: file.name,
          storedFileName: uniqueFileName,
          fileType,
          fileSize: file.size,
          originalFileUrl: originalUrl,
          lastModified: file.lastModified
        }
      };
    } catch (error) {
      console.error('Error processing file:', error);
      throw error.message || 'Failed to process file';
    }
  }
};

async function processPDF(file) {
  try {
    // Read file as array buffer
    const arrayBuffer = await file.arrayBuffer().catch(err => {
      console.error('Error reading file:', err);
      throw new Error('Failed to read PDF file');
    });

    // Load PDF document with legacy build
    const pdf = await getDocument({
      data: arrayBuffer,
      workerSrc: pdfjsWorker,
      isEvalSupported: false,
      disableFontFace: true
    }).promise;

    let content = '';

    // Process each page
    for (let i = 1; i <= pdf.numPages; i++) {
      try {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        
        // Process each text item to preserve formatting
        const processedItems = textContent.items.map(item => {
          try {
            const fontSize = Math.abs(item.transform?.[3] || 12);
            const style = `style="font-size: ${fontSize}px; font-family: ${item.fontName || 'inherit'};"`;
            return `<span ${style}>${item.str}</span>`;
          } catch (err) {
            console.warn('Error processing text item:', err);
            return item.str;
          }
        });

        const pageText = processedItems.join(' ');
        content += `<div class="pdf-page">${pageText}</div>`;
      } catch (err) {
        console.warn(`Error processing page ${i}:`, err);
        continue;
      }
    }

    if (!content) {
      throw new Error('No content extracted from PDF');
    }

    return content;
  } catch (error) {
    console.error('Error processing PDF:', error);
    throw error.message || 'Failed to process PDF';
  }
}

async function processDocx(file) {
  try {
    const arrayBuffer = await file.arrayBuffer().catch(err => {
      console.error('Error reading file:', err);
      throw new Error('Failed to read DOCX file');
    });

    const options = {
      styleMap: customStyleMap,
      transformDocument: (document) => {
        return {
          ...document,
          children: document.children.map(transformElement)
        };
      }
    };

    const result = await mammoth.convertToHtml({ arrayBuffer }, options).catch(err => {
      console.error('Error converting DOCX:', err);
      throw new Error('Failed to convert DOCX document');
    });
    
    if (!result.value) {
      throw new Error('No content extracted from DOCX');
    }

    // Add wrapper div with custom class for additional styling
    return `<div class="docx-content">${result.value}</div>`;
  } catch (error) {
    console.error('Error processing DOCX:', error);
    throw error.message || 'Failed to process DOCX';
  }
}
