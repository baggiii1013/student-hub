'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import RoleProtected from '@/components/RoleProtected';
import UserProfileSection from '@/components/UserProfileSection';
import { useAuth } from '@/contexts/AuthContext';
import { useRole } from '@/hooks/useRole';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import styles from './page.module.css';

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

      // Prepare headers for the request
      const headers = {};
      
      // Include JWT token if available (for manually logged in users)
      const token = localStorage.getItem('token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('/api/students/upload', {
        method: 'POST',
        credentials: 'include', // Include session cookies for OAuth users
        headers,
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
      // Prepare headers for the request
      const headers = {};
      
      // Include JWT token if available (for manually logged in users)
      const token = localStorage.getItem('token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('/api/students/upload', {
        method: 'GET',
        credentials: 'include', // Include session cookies for OAuth users
        headers
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
    <div className={styles.container}>
      <div className={styles.maxWidth}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <h1 className={styles.title}>
              Upload Student Data
            </h1>
            <p className={styles.subtitle}>
              Upload a spreadsheet to bulk import or update student records
            </p>
          </div>
          <div className={styles.profileSection}>
            <UserProfileSection variant="horizontal" />
          </div>
        </div>

        {/* Template Download */}
        <div className={styles.card}>
          <div className={styles.templateCard}>
            <div className={styles.templateContent}>
              <h2>Download Template</h2>
              <p>
                Get the Excel template with the correct column format for uploading student data.
              </p>
            </div>
            <button
              onClick={downloadTemplate}
              className={styles.downloadBtn}
            >
              <svg className={styles.downloadIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download Template
            </button>
          </div>
        </div>

        {/* Upload Form */}
        <div className={`${styles.card} ${styles.uploadCard}`}>
          <form onSubmit={handleUpload} className={styles.uploadForm}>
            {/* File Drop Zone */}
            <div
              className={`${styles.dropZone} ${
                dragActive ? styles.dropZoneActive : ''
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
                className={styles.fileInput}
                id="file-upload"
                disabled={uploading}
              />
              
              <label htmlFor="file-upload" className={styles.fileLabel}>
                <div className={styles.dropContent}>
                  <svg className={styles.uploadIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className={styles.dropTitle}>
                    {file ? file.name : 'Choose a file or drag and drop'}
                  </h3>
                  <p className={styles.dropSubtitle}>
                    Supports Excel (.xlsx, .xls) and CSV files
                  </p>
                  {file && (
                    <div className={styles.fileInfo}>
                      File selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                    </div>
                  )}
                </div>
              </label>
            </div>

            {/* Upload Button */}
            <div className={styles.uploadButtonContainer}>
              <button
                type="submit"
                disabled={!file || uploading}
                className={styles.uploadBtn}
              >
                {uploading ? (
                  <>
                    <div className={styles.spinner}></div>
                    Uploading...
                  </>
                ) : (
                  <>
                    <svg className={styles.uploadIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          <div className={styles.errorCard}>
            <div className={styles.errorContent}>
              <svg className={styles.errorIcon} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          </div>
        )}

        {/* Success Result */}
        {result && (
          <div className={styles.resultCard}>
            <div className={styles.resultHeader}>
              <svg className={styles.successIcon} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <h2 className={styles.resultTitle}>Upload Successful!</h2>
            </div>

            {/* Summary */}
            <div className={styles.summaryGrid}>
              <div className={`${styles.summaryCard} ${styles.totalCard}`}>
                <div className={`${styles.summaryNumber} ${styles.totalNumber}`}>{result.summary.totalRows}</div>
                <div className={styles.summaryLabel}>Total Rows</div>
              </div>
              <div className={`${styles.summaryCard} ${styles.createdCard}`}>
                <div className={`${styles.summaryNumber} ${styles.createdNumber}`}>{result.summary.created}</div>
                <div className={styles.summaryLabel}>Created</div>
              </div>
              <div className={`${styles.summaryCard} ${styles.updatedCard}`}>
                <div className={`${styles.summaryNumber} ${styles.updatedNumber}`}>{result.summary.updated}</div>
                <div className={styles.summaryLabel}>Updated</div>
              </div>
              <div className={`${styles.summaryCard} ${styles.errorsCard}`}>
                <div className={`${styles.summaryNumber} ${styles.errorsNumber}`}>{result.summary.errors}</div>
                <div className={styles.summaryLabel}>Errors</div>
              </div>
            </div>

            {/* Processed Students Preview */}
            {result.processedStudents && result.processedStudents.length > 0 && (
              <div className={styles.studentsSection}>
                <h3 className={styles.sectionTitle}>Processed Students (Preview)</h3>
                <div className={styles.studentsList}>
                  {result.processedStudents.map((student, index) => (
                    <div key={index} className={styles.studentItem}>
                      <span className={styles.studentName}>{student.name}</span>
                      <div className={styles.studentInfo}>
                        <span className={styles.studentUg}>{student.ugNumber}</span>
                        <span className={`${styles.actionBadge} ${
                          student.action === 'created' 
                            ? styles.createdBadge
                            : styles.updatedBadge
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
              <div className={styles.errorsSection}>
                <h3 className={styles.sectionTitle}>
                  Errors {result.hasMoreErrors && `(Showing first 5 of ${result.summary.errors})`}
                </h3>
                <div className={styles.errorsList}>
                  {result.errors.map((error, index) => (
                    <div key={index} className={styles.errorItem}>
                      <div className={styles.errorRow}>Row {error.row}</div>
                      <div className={styles.errorMessage}>{error.error}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Back to Dashboard */}
        <div className={styles.backSection}>
          <button
            onClick={() => router.push('/')}
            className={styles.backBtn}
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
          <div className={styles.accessDeniedContainer}>
            <div className={styles.accessDeniedContent}>
              <div className={styles.deniedIcon}>
                <svg className={styles.deniedIconSvg} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 15.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h2 className={styles.deniedTitle}>Access Denied</h2>
              <p className={styles.deniedMessage}>
                You need administrator privileges to access the upload feature.
              </p>
              <button
                onClick={() => window.history.back()}
                className={styles.goBackBtn}
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
