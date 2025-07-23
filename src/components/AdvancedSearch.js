'use client';

import { useRole } from '@/hooks/useRole';
import { studentAPI } from '@/lib/api';
import { useState } from 'react';
import { toast } from 'react-toastify';
import styles from './AdvancedSearch.module.css';

export default function AdvancedSearch({ onSearchResults, isSearching, setIsSearching }) {
  const { isSuperAdmin, isAdmin } = useRole();
  const isAdminOrHigher = isAdmin() || isSuperAdmin();
  const [searchParams, setSearchParams] = useState({
    query: '',
    branch: '',
    dateFrom: '',
    dateTo: ''
  });
  const [isDownloading, setIsDownloading] = useState(false);

  const branches = ['CSE', 'CE', 'AI', 'CS', 'OTHER'];

  const handleInputChange = (field, value) => {
    setSearchParams(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSearch = async () => {
    // Validate search criteria
    if (!isAdminOrHigher && !searchParams.query.trim()) {
      toast.error('Please enter a UG number to search');
      return;
    }

    if (isAdminOrHigher && !searchParams.query.trim() && !searchParams.branch && !searchParams.dateFrom && !searchParams.dateTo) {
      toast.error('Please provide at least one search criteria');
      return;
    }

    if (searchParams.dateFrom && searchParams.dateTo && new Date(searchParams.dateFrom) > new Date(searchParams.dateTo)) {
      toast.error('Start date cannot be later than end date');
      return;
    }

    setIsSearching(true);

    try {
      const response = await studentAPI.searchStudents({
        ...searchParams,
        page: 1,
        limit: 10000 // High limit to get all results
      });

      if (response.success) {
        onSearchResults(response.data, response.pagination);
        if (response.data.length === 0) {
          toast.info('No students found matching your criteria');
        } else {
          toast.success(`Found ${response.data.length} student(s)`);
        }
      } else {
        toast.error('Search failed');
        onSearchResults([], null);
      }
    } catch (error) {
      console.error('Error searching students:', error);
      toast.error(error.message || 'Search failed');
      onSearchResults([], null);
    } finally {
      setIsSearching(false);
    }
  };

  const handleDownload = async () => {
    // Validate search criteria
    if (!isAdminOrHigher && !searchParams.query.trim()) {
      toast.error('Please enter a UG number to download results');
      return;
    }

    if (isAdminOrHigher && !searchParams.query.trim() && !searchParams.branch && !searchParams.dateFrom && !searchParams.dateTo) {
      toast.error('Please provide at least one search criteria to download');
      return;
    }

    if (searchParams.dateFrom && searchParams.dateTo && new Date(searchParams.dateFrom) > new Date(searchParams.dateTo)) {
      toast.error('Start date cannot be later than end date');
      return;
    }

    setIsDownloading(true);

    try {
      // Use the new download API function that handles authentication properly
      const response = await studentAPI.downloadSearchResults(searchParams);

      // Get filename from response headers or create default
      const contentDisposition = response.headers.get('content-disposition');
      let filename = 'student-search-results.xlsx';
      if (contentDisposition && contentDisposition.includes('filename=')) {
        filename = contentDisposition.split('filename=')[1].replace(/"/g, '');
      }

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Search results downloaded successfully');
    } catch (error) {
      console.error('Error downloading search results:', error);
      toast.error(error.message || 'Failed to download search results');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleClear = () => {
    setSearchParams({
      query: '',
      branch: '',
      dateFrom: '',
      dateTo: ''
    });
    onSearchResults([], null);
  };

  return (
    <div className={styles.container}>
      <div className={styles.searchForm}>
        <h3 className={styles.title}>
          {isAdminOrHigher ? 'Advanced Student Search' : 'Student Search'}
        </h3>

        {/* UG Number Search */}
        <div className={styles.formGroup}>
          <label htmlFor="ugNumber">UG Number</label>
          <input
            id="ugNumber"
            type="text"
            value={searchParams.query}
            onChange={(e) => handleInputChange('query', e.target.value)}
            placeholder="Enter UG number (e.g., 24UG050281)"
            className={styles.input}
          />
        </div>

        {/* Admin/SuperAdmin Only Filters */}
        {isAdminOrHigher && (
          <>
            <div className={styles.superAdminSection}>
              <h4 className={styles.sectionTitle}>Advanced Filters (Admin/SuperAdmin)</h4>
              
              {/* Branch Filter */}
              <div className={styles.formGroup}>
                <label htmlFor="branch">Branch</label>
                <select
                  id="branch"
                  value={searchParams.branch}
                  onChange={(e) => handleInputChange('branch', e.target.value)}
                  className={styles.select}
                >
                  <option value="">All Branches</option>
                  {branches.map(branch => (
                    <option key={branch} value={branch}>{branch}</option>
                  ))}
                </select>
              </div>

              {/* Admission Date Range */}
              <div className={styles.dateRange}>
                <div className={styles.formGroup}>
                  <label htmlFor="dateFrom">Admission Date From</label>
                  <input
                    id="dateFrom"
                    type="date"
                    value={searchParams.dateFrom}
                    onChange={(e) => handleInputChange('dateFrom', e.target.value)}
                    className={styles.input}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="dateTo">Admission Date To</label>
                  <input
                    id="dateTo"
                    type="date"
                    value={searchParams.dateTo}
                    onChange={(e) => handleInputChange('dateTo', e.target.value)}
                    className={styles.input}
                  />
                </div>
              </div>
            </div>
          </>
        )}

        {/* Action Buttons */}
        <div className={styles.actions}>
          <button
            onClick={handleSearch}
            disabled={isSearching || isDownloading}
            className={`${styles.button} ${styles.searchButton}`}
          >
            {isSearching ? 'Searching...' : 'Search'}
          </button>
          <button
            onClick={handleDownload}
            disabled={isSearching || isDownloading}
            className={`${styles.button} ${styles.downloadButton}`}
          >
            {isDownloading ? 'Downloading...' : 'Download XLSX'}
          </button>
          <button
            onClick={handleClear}
            disabled={isSearching || isDownloading}
            className={`${styles.button} ${styles.clearButton}`}
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}
