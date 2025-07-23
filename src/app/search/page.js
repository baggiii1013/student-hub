'use client';

import AdvancedSearch from '@/components/AdvancedSearch';
import ProtectedRoute from '@/components/ProtectedRoute';
import SearchResults from '@/components/SearchResults';
import { useAuth } from '@/contexts/AuthContext';
import { useRole } from '@/hooks/useRole';
import Link from 'next/link';
import { useState } from 'react';
import styles from './page.module.css';

export default function SearchPage() {
  const { user } = useAuth();
  const { isSuperAdmin, isAdmin } = useRole();
  const isAdminOrHigher = isAdmin() || isSuperAdmin();
  const [searchResults, setSearchResults] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearchResults = (results, paginationData) => {
    setSearchResults(results);
    setPagination(paginationData);
  };

  return (
    <ProtectedRoute>
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.breadcrumb}>
            <Link href="/" className={styles.breadcrumbLink}>
              Home
            </Link>
            <span className={styles.breadcrumbSeparator}>→</span>
            <span className={styles.breadcrumbCurrent}>Search Students</span>
          </div>

          <div className={styles.userInfo}>
            <span className={styles.welcome}>Welcome, {user?.username}</span>
            {isSuperAdmin && (
              <span className={styles.roleIndicator}>SuperAdmin</span>
            )}
            {isAdmin() && !isSuperAdmin && (
              <span className={styles.roleIndicator}>Admin</span>
            )}
          </div>
        </div>

        <div className={styles.content}>
          <div className={styles.searchSection}>
            <AdvancedSearch
              onSearchResults={handleSearchResults}
              isSearching={isSearching}
              setIsSearching={setIsSearching}
            />
          </div>

          <div className={styles.resultsSection}>
            <SearchResults
              students={searchResults}
              pagination={pagination}
              isLoading={isSearching}
            />
          </div>
        </div>

        {isAdminOrHigher && (
          <div className={styles.adminNotice}>
            <h4>{isSuperAdmin ? 'SuperAdmin' : 'Admin'} Privileges</h4>
            <p>
              As {isSuperAdmin ? 'a SuperAdmin' : 'an Admin'}, you can search students by branch and admission date 
              without requiring a UG number. You can also view additional student details 
              including admission dates{isSuperAdmin ? ' and have full system access' : ''}.
            </p>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
