import { useState, useCallback } from 'react';
import { Upload, FileSpreadsheet, X } from 'lucide-react';
import Papa from 'papaparse';

interface FileUploadProps {
  onDataLoaded: (data: Record<string, any>[], fileName: string) => void;
}

export default function FileUpload({ onDataLoaded }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const processFile = useCallback((file: File) => {
    setIsLoading(true);
    setFileName(file.name);

    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => {
        onDataLoaded(results.data as Record<string, any>[], file.name);
        setIsLoading(false);
      },
      error: (error) => {
        console.error('Error parsing file:', error);
        alert('Error parsing file. Please make sure it is a valid CSV file.');
        setIsLoading(false);
        setFileName(null);
      }
    });
  }, [onDataLoaded]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file && (file.type === 'text/csv' || file.name.endsWith('.csv'))) {
      processFile(file);
    } else {
      alert('Please upload a CSV file');
    }
  }, [processFile]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const clearFile = () => {
    setFileName(null);
  };

  return (
    <div className="w-full">
      {!fileName ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`relative border-3 border-dashed rounded-2xl p-12 text-center transition-all duration-300 ${
            isDragging
              ? 'border-blue-500 bg-blue-50 scale-105'
              : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
          }`}
        >
          <input
            type="file"
            accept=".csv"
            onChange={handleFileInput}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={isLoading}
          />
          <div className="flex flex-col items-center space-y-4">
            <div className="p-6 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full">
              <Upload className="w-12 h-12 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">
                {isLoading ? 'Processing...' : 'Upload Your Dataset'}
              </h3>
              <p className="text-gray-600 mb-2">
                Drag and drop your CSV file here, or click to browse
              </p>
              <p className="text-sm text-gray-500">
                Supports CSV files up to 50MB
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-2xl p-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-4 bg-green-500 rounded-full">
                <FileSpreadsheet className="w-8 h-8 text-white" />
              </div>
              <div>
                <h4 className="text-lg font-semibold text-gray-800">File Uploaded</h4>
                <p className="text-gray-600">{fileName}</p>
              </div>
            </div>
            <button
              onClick={clearFile}
              className="p-2 hover:bg-red-100 rounded-full transition-colors"
              title="Remove file"
            >
              <X className="w-6 h-6 text-red-500" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
