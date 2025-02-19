import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, X, Loader2, AlertCircle } from 'lucide-react';
import { documentUploadService } from '../../services/documentUpload';
import { useDocumentStore } from '../../store/documentStore';

const DocumentUpload = ({ onClose }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  const { saveDocument } = useDocumentStore();

  const onDrop = useCallback(async (acceptedFiles) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    setIsUploading(true);
    setError(null);
    setProgress(0);

    try {
      // Start progress animation
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 500);

      const { content, metadata } = await documentUploadService.processFile(file);
      
      // Complete progress
      clearInterval(progressInterval);
      setProgress(100);
      
      // Create new document with the processed content
      await saveDocument(
        metadata.originalFileName.replace(/\.[^/.]+$/, ''), // Remove file extension for title
        content,
        metadata
      );

      onClose();
    } catch (err) {
      console.error('Error uploading document:', err);
      let errorMessage = 'Failed to upload document';
      
      // Handle specific error cases
      if (err.message?.includes('File type not detected')) {
        errorMessage = 'Could not detect file type. Please try a different file.';
      } else if (err.message?.includes('Unsupported file type')) {
        errorMessage = 'This file type is not supported. Please use PDF or DOCX files.';
      } else if (err.message?.includes('size exceeds')) {
        errorMessage = 'File is too large. Maximum size is 100MB.';
      } else if (err.message?.includes('Failed to read')) {
        errorMessage = 'Could not read the file. The file may be corrupted.';
      } else if (err.message?.includes('Failed to process')) {
        errorMessage = 'Could not process the file. Please try a different file.';
      } else if (err.message?.includes('storage')) {
        errorMessage = 'Failed to save the file. Please try again.';
      }
      
      setError(errorMessage);
    } finally {
      setIsUploading(false);
      setProgress(0);
    }
  }, [saveDocument, onClose]);

  const { getRootProps, getInputProps, isDragActive, acceptedFiles } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxFiles: 1,
    multiple: false,
    maxSize: 100 * 1024 * 1024, // 100MB
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Upload Document</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full"
            disabled={isUploading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors duration-200 ${
            isDragActive
              ? 'border-blue-500 bg-blue-50'
              : error
              ? 'border-red-300 hover:border-red-400'
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center space-y-4">
            {error ? (
              <>
                <AlertCircle className="w-12 h-12 text-red-500" />
                <p className="text-red-600">{error}</p>
              </>
            ) : isDragActive ? (
              <>
                <Upload className="w-12 h-12 text-blue-500" />
                <p className="text-blue-500">Drop the file here</p>
              </>
            ) : (
              <>
                <Upload className="w-12 h-12 text-gray-400" />
                <div>
                  <p className="text-gray-600 mb-2">
                    Drag and drop a document here, or click to select
                  </p>
                  <p className="text-sm text-gray-500">
                    Supported formats: PDF, DOCX
                  </p>
                  <p className="text-sm text-gray-500">
                    Maximum size: 100MB
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {acceptedFiles.length > 0 && !isUploading && !error && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg flex items-center">
            <File className="w-5 h-5 text-gray-500 mr-2" />
            <span className="text-sm text-gray-700 truncate">
              {acceptedFiles[0].name}
            </span>
          </div>
        )}

        {isUploading && (
          <div className="mt-4">
            <div className="p-3 bg-blue-50 rounded-lg flex items-center justify-center">
              <Loader2 className="w-5 h-5 text-blue-500 animate-spin mr-2" />
              <span className="text-sm text-blue-700">Processing document...</span>
            </div>
            <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-end space-x-4">
          <button
            onClick={onClose}
            disabled={isUploading}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          >
            Cancel
          </button>
          <button
            onClick={() => acceptedFiles.length > 0 && onDrop(acceptedFiles)}
            disabled={isUploading || acceptedFiles.length === 0}
            className={`px-4 py-2 text-white rounded-lg transition-colors duration-200 ${
              isUploading || acceptedFiles.length === 0
                ? 'bg-blue-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isUploading ? 'Processing...' : 'Upload'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DocumentUpload;
