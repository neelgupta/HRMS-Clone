import { useState, forwardRef } from "react";

interface FileUploadProps {
  accept?: string;
  maxSize?: number;
  onFileSelect?: (file: File) => void;
  className?: string;
  disabled?: boolean;
}

export const FileUpload = forwardRef<HTMLInputElement, FileUploadProps>(
  ({ accept, maxSize, onFileSelect, className = "", disabled = false, ...props }, ref) => {
    const [dragActive, setDragActive] = useState(false);

    const handleFileSelect = (file: File) => {
      if (maxSize && file.size > maxSize) {
        alert(`File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`);
        return;
      }
      onFileSelect?.(file);
    };

    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      
      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        handleFileSelect(files[0]);
      }
    };

    const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(true);
    };

    const handleDragLeave = () => {
      setDragActive(false);
    };

    return (
      <div
        className={`relative border-2 border-dashed rounded-xl p-6 transition-colors ${
          dragActive
            ? "border-indigo-400 bg-indigo-50 dark:bg-indigo-900/20"
            : "border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50"
        } ${className}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <input
          ref={ref}
          type="file"
          accept={accept}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              handleFileSelect(file);
            }
          }}
          disabled={disabled}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          {...props}
        />
        
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
            <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 01.905-4.904A5 5 0 0116 9l-3 3h1m-6 0l-3-3h1a2 2 0 01-2 2v3a2 2 0 002 2h6a2 2 0 002-2V7a2 2 0 00-2-2h-6a2 2 0 00-2 2z" />
            </svg>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
            Drag and drop your file here, or{' '}
            <button
              type="button"
              className="text-indigo-600 dark:text-indigo-400 hover:underline"
              onClick={() => ref.current?.click()}
            >
              browse
            </button>
          </p>
          {maxSize && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              Maximum file size: {Math.round(maxSize / 1024 / 1024)}MB
            </p>
          )}
        </div>
      </div>
    );
  }
);
