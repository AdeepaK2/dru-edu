'use client';

import React, { useState, useRef } from 'react';
import { 
  Upload, 
  File, 
  X, 
  Download, 
  AlertCircle, 
  CheckCircle, 
  Clock 
} from 'lucide-react';
import { Button } from '@/components/ui';
import { usePdfUpload } from '@/hooks/usePdfUpload';
import { StudentPdfService } from '@/apiservices/studentPdfService';
import { PdfAttachment } from '@/models/studentSubmissionSchema';

interface PdfUploadComponentProps {
  questionId: string;
  attemptId: string;
  studentId: string;
  existingFiles?: PdfAttachment[];
  onFileUpload?: (attachment: PdfAttachment) => void;
  onFileRemove?: (fileUrl: string) => void;
  disabled?: boolean;
  maxFiles?: number;
}

export const PdfUploadComponent: React.FC<PdfUploadComponentProps> = ({
  questionId,
  attemptId,
  studentId,
  existingFiles = [],
  onFileUpload,
  onFileRemove,
  disabled = false,
  maxFiles = 3
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadPdf, isUploading, progress, error, resetState } = usePdfUpload();
  const [dragOver, setDragOver] = useState(false);

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const file = files[0]; // Only handle one file at a time
    
    // Check if we've reached the max files limit
    if (existingFiles.length >= maxFiles) {
      alert(`Maximum ${maxFiles} PDF files allowed per question`);
      return;
    }

    resetState();

    try {
      const result = await uploadPdf(file, {
        attemptId,
        questionId,
        studentId
      });

      if (result.error) {
        console.error('Upload failed:', result.error);
        return;
      }

      // Create attachment object
      const attachment: PdfAttachment = {
        fileName: file.name,
        fileUrl: result.pdfUrl,
        fileSize: file.size,
        uploadedAt: Date.now(),
        uploadStatus: 'completed'
      };

      onFileUpload?.(attachment);
      
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (err) {
      console.error('Upload error:', err);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    if (disabled) return;
    
    const files = e.dataTransfer.files;
    handleFileSelect(files);
  };

  const removeFile = (fileUrl: string) => {
    if (disabled) return;
    onFileRemove?.(fileUrl);
  };

  const downloadFile = (fileUrl: string, fileName: string) => {
    // Open in new tab for download
    window.open(fileUrl, '_blank');
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragOver
            ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20'
            : disabled
            ? 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800'
            : 'border-gray-300 hover:border-blue-400 dark:border-gray-600 dark:hover:border-blue-500'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {isUploading ? (
          <div className="space-y-4">
            <div className="flex items-center justify-center">
              <Clock className="h-8 w-8 text-blue-500 animate-spin" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                Uploading PDF...
              </p>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {Math.round(progress)}% complete
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-center">
              <Upload className={`h-8 w-8 ${disabled ? 'text-gray-400' : 'text-gray-500'}`} />
            </div>
            <div>
              <p className={`text-sm font-medium ${disabled ? 'text-gray-400' : 'text-gray-900 dark:text-white'}`}>
                {existingFiles.length >= maxFiles 
                  ? `Maximum ${maxFiles} files reached`
                  : 'Upload PDF Answer'
                }
              </p>
              <p className={`text-xs ${disabled ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'}`}>
                {existingFiles.length >= maxFiles 
                  ? 'Remove a file to upload another'
                  : 'Drag and drop or click to select PDF file (max 25MB)'
                }
              </p>
            </div>
            
            {!disabled && existingFiles.length < maxFiles && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-4 h-4 mr-2" />
                Choose PDF File
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,application/pdf"
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
        disabled={disabled || isUploading || existingFiles.length >= maxFiles}
      />

      {/* Error message */}
      {error && (
        <div className="flex items-center p-3 text-sm text-red-800 bg-red-50 dark:bg-red-900/20 rounded-md">
          <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Existing files list */}
      {existingFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white">
            Uploaded Files ({existingFiles.length}/{maxFiles})
          </h4>
          <div className="space-y-2">
            {existingFiles.map((file, index) => (
              <div
                key={`${file.fileUrl}-${index}`}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-md"
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <div className="flex-shrink-0">
                    {file.uploadStatus === 'completed' ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : file.uploadStatus === 'uploading' ? (
                      <Clock className="h-5 w-5 text-blue-500 animate-spin" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-500" />
                    )}
                  </div>
                  <File className="h-5 w-5 text-red-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {file.fileName}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {StudentPdfService.formatFileSize(file.fileSize)} • {
                        new Date(file.uploadedAt).toLocaleString()
                      }
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 flex-shrink-0">
                  {file.uploadStatus === 'completed' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadFile(file.fileUrl, file.fileName)}
                      className="p-1 h-8 w-8"
                    >
                      <Download className="h-3 w-3" />
                    </Button>
                  )}
                  
                  {!disabled && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeFile(file.fileUrl)}
                      className="p-1 h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Helper text */}
      <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
        <p>• PDF files only (max 25MB per file)</p>
        <p>• Maximum {maxFiles} files per question</p>
        <p>• Files are automatically saved with your answer</p>
      </div>
    </div>
  );
};
