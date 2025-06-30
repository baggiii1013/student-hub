'use client';


import ProtectedRoute from '@/components/ProtectedRoute';
import RoleProtected from '@/components/RoleProtected';
import UserProfileSection from '@/components/UserProfileSection';
import { useAuth } from '@/contexts/AuthContext';
import { useRole } from '@/hooks/useRole';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

function UploadPageContent() {
  const { user } = useAuth();
  const router = useRouter();
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);

  const handleFileSelect = (selectedFile) => {
    setFile(selectedFile);
    setError('');
    setResult(null);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    
    if (!file) {
      setError('Please select a file to upload');
      return;
    }

    setUploading(true);
    setError('');
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/students/upload', {
        method: 'POST',
        credentials: 'include', // Include session cookies
        body: formData
      });

      // Check if the response is actually JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response received:', text.substring(0, 500));
        throw new Error('Server returned non-JSON response. Check browser console for details.');
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Upload failed');
      }

      setResult(data);
      setFile(null);

    } catch (error) {
      console.error('Upload error:', error);
      setError(error.message || 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = async () => {
    try {
      const response = await fetch('/api/students/upload', {
        method: 'GET'
      });

      if (!response.ok) {
        throw new Error('Failed to download template');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'student_template.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

    } catch (error) {
      console.error('Template download error:', error);
      setError('Failed to download template');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div className="text-center sm:text-left mb-4 sm:mb-0">
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
              Upload Student Data
            </h1>
            <p className="text-gray-300 text-lg">
              Upload a spreadsheet to bulk import or update student records
            </p>
          </div>
          <div className="flex justify-center sm:justify-end">
            <UserProfileSection variant="horizontal" />
          </div>
        </div>

        {/* Template Download */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 mb-8 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white mb-2">Download Template</h2>
              <p className="text-gray-300">
                Get the Excel template with the correct column format for uploading student data.
              </p>
            </div>
            <button
              onClick={downloadTemplate}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download Template
            </button>
          </div>
        </div>

        {/* Upload Form */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-gray-700 mb-8">
          <form onSubmit={handleUpload}>
            {/* File Drop Zone */}
            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                dragActive
                  ? 'border-purple-400 bg-purple-400/10'
                  : 'border-gray-600 hover:border-purple-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={(e) => handleFileSelect(e.target.files[0])}
                className="hidden"
                id="file-upload"
                disabled={uploading}
              />
              
              <label htmlFor="file-upload" className="cursor-pointer">
                <div className="flex flex-col items-center">
                  <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {file ? file.name : 'Choose a file or drag and drop'}
                  </h3>
                  <p className="text-gray-400">
                    Supports Excel (.xlsx, .xls) and CSV files
                  </p>
                  {file && (
                    <div className="mt-4 text-sm text-green-400">
                      File selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                    </div>
                  )}
                </div>
              </label>
            </div>

            {/* Upload Button */}
            <div className="mt-6 flex justify-center">
              <button
                type="submit"
                disabled={!file || uploading}
                className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-8 py-3 rounded-lg transition-colors flex items-center gap-2"
              >
                {uploading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Uploading...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    Upload File
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg mb-8">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          </div>
        )}

        {/* Success Result */}
        {result && (
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
            <div className="flex items-center mb-4">
              <svg className="w-6 h-6 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <h2 className="text-xl font-semibold text-white">Upload Successful!</h2>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-600/20 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-400">{result.summary.totalRows}</div>
                <div className="text-sm text-gray-300">Total Rows</div>
              </div>
              <div className="bg-green-600/20 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-400">{result.summary.created}</div>
                <div className="text-sm text-gray-300">Created</div>
              </div>
              <div className="bg-yellow-600/20 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-yellow-400">{result.summary.updated}</div>
                <div className="text-sm text-gray-300">Updated</div>
              </div>
              <div className="bg-red-600/20 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-red-400">{result.summary.errors}</div>
                <div className="text-sm text-gray-300">Errors</div>
              </div>
            </div>

            {/* Processed Students Preview */}
            {result.processedStudents && result.processedStudents.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-3">Processed Students (Preview)</h3>
                <div className="bg-gray-800/50 rounded-lg p-4 max-h-48 overflow-y-auto">
                  {result.processedStudents.map((student, index) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b border-gray-700 last:border-b-0">
                      <span className="text-gray-300">{student.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400 text-sm">{student.ugNumber}</span>
                        <span className={`px-2 py-1 rounded text-xs ${
                          student.action === 'created' 
                            ? 'bg-green-600/20 text-green-400' 
                            : 'bg-yellow-600/20 text-yellow-400'
                        }`}>
                          {student.action}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Errors */}
            {result.errors && result.errors.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-red-400 mb-3">
                  Errors {result.hasMoreErrors && `(Showing first 5 of ${result.summary.errors})`}
                </h3>
                <div className="bg-red-900/20 rounded-lg p-4 max-h-48 overflow-y-auto">
                  {result.errors.map((error, index) => (
                    <div key={index} className="py-2 border-b border-red-800 last:border-b-0">
                      <div className="text-red-400 font-medium">Row {error.row}</div>
                      <div className="text-red-300 text-sm">{error.error}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Back to Dashboard */}
        <div className="text-center mt-8">
          <button
            onClick={() => router.push('/')}
            className="inline-flex items-center space-x-2 text-purple-400 hover:text-purple-300 transition-colors"
          >
            <span>←</span>
            <span>Back to Dashboard</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function UploadPage() {
  return (
    <ProtectedRoute>
      <RoleProtected 
        requiredRole="admin"
        fallback={
          <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center">
            <div className="text-center max-w-md mx-auto p-8">
              <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 15.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-4">Access Denied</h2>
              <p className="text-gray-300 mb-6">
                You need administrator privileges to access the upload feature.
              </p>
              <button
                onClick={() => window.history.back()}
                className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
              >
                Go Back
              </button>
            </div>
          </div>
        }
      >
        <UploadPageContent />
      </RoleProtected>
    </ProtectedRoute>
  );
}
