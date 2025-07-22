'use client';

import RoleIndicator from '@/components/RoleIndicator';
import RoleProtected from '@/components/RoleProtected';
import RoleStatsCard from '@/components/RoleStatsCard';
import UserProfileSection from '@/components/UserProfileSection';
import Hyperspeed from '@/components/ui/Hyperspeed';
import { useAuth } from '@/contexts/AuthContext';
import { useRole } from '@/hooks/useRole';
import { studentAPI } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import styles from './page.module.css';

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [mounted, setMounted] = useState(false);
  const { user, logout } = useAuth();
  const { role, canUpload } = useRole();
  const router = useRouter();
  const hyperspeedRef = useRef(null);

  useEffect(() => {
    setMounted(true);
    
    // Check if user is OAuth and needs to complete setup
    if (user && user.isOAuthUser && !user.passwordSetupComplete) {
      router.push('/register?step=2');
    }
  }, [user, router]);
  
  const handleSearch = async (e) => {
    e && e.preventDefault();
    if (!searchQuery.trim()) return;

    // Trigger hyperspeed speed-up effect
    if (hyperspeedRef.current) {
      hyperspeedRef.current.speedUp();
    }

    setIsSearching(true);
    
    try {
      const response = await studentAPI.searchStudents({
        query: searchQuery.trim(),
        page: 1,
        limit: 10  // Since we expect only 1 exact match, smaller limit is fine
      });
      
      if (response.success) {
        setSearchResults(response.data);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error searching for student:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
      
      // Slow down hyperspeed effect after search completes
      setTimeout(() => {
        if (hyperspeedRef.current) {
          hyperspeedRef.current.slowDown();
        }
      }, 1000); // Keep the speed effect for 1 second after search completes
    }
  };

  return (
    <div className={styles.container}>
      {/* Hyperspeed background */}
      <div className={styles.hyperspeedBackground}>
        <Hyperspeed
          ref={hyperspeedRef}
          effectOptions={{
            onSpeedUp: () => { },
            onSlowDown: () => { },
            distortion: 'turbulentDistortion',
            length: 400,
            roadWidth: 10,
            islandWidth: 2,
            lanesPerRoad: 4,
            fov: 90,
            fovSpeedUp: 150,
            speedUp: 2,
            carLightsFade: 0.4,
            totalSideLightSticks: 20,
            lightPairsPerRoadWay: 40,
            shoulderLinesWidthPercentage: 0.05,
            brokenLinesWidthPercentage: 0.1,
            brokenLinesLengthPercentage: 0.5,
            lightStickWidth: [0.12, 0.5],
            lightStickHeight: [1.3, 1.7],
            movingAwaySpeed: [60, 80],
            movingCloserSpeed: [-120, -160],
            carLightsLength: [400 * 0.03, 400 * 0.2],
            carLightsRadius: [0.05, 0.14],
            carWidthPercentage: [0.3, 0.5],
            carShiftX: [-0.8, 0.8],
            carFloorSeparation: [0, 5],
            colors: {
              roadColor: 0x080808,
              islandColor: 0x0a0a0a,
              background: 0x000000,
              shoulderLines: 0xFFFFFF,
              brokenLines: 0xFFFFFF,
              leftCars: [0xD856BF, 0x6750A2, 0xC247AC],
              rightCars: [0x03B3C3, 0x0E5EA5, 0x324555],
              sticks: 0x03B3C3,
            }
          }}
        />
      </div>

      {/* Main content */}
      <div className={styles.mainContent}>
        {/* Header with conditional auth buttons */}
        <header className={styles.header}>
          <div className={styles.headerContainer}>
            <div className={styles.headerContent}>
              <h1 className={styles.title}>
                Student Hub
              </h1>
              {user ? (
                <div className={styles.userSection}>
                  <div className={styles.userProfileHidden}>
                    <UserProfileSection variant="horizontal" />
                  </div>
                  
                  {/* Desktop Button Layout */}
                  <div className={styles.desktopButtons}>
                    <button
                      onClick={() => router.push('/search')}
                      className={`${styles.button} ${styles.buttonBlue}`}
                    >
                      Advanced Search
                    </button>
                    <RoleProtected requiredRole="admin">
                      <button
                        onClick={() => router.push('/upload')}
                        className={`${styles.button} ${styles.buttonGreen}`}
                      >
                        Upload Data
                      </button>
                    </RoleProtected>
                    <RoleProtected requiredRole="superAdmin">
                      <button
                        onClick={() => router.push('/user-management')}
                        className={`${styles.button} ${styles.buttonIndigo}`}
                      >
                        Manage Users
                      </button>
                    </RoleProtected>
                    <button
                      onClick={() => router.push(`/profile/${user.username}`)}
                      className={`${styles.button} ${styles.buttonPurple}`}
                    >
                      Profile
                    </button>
                    <button
                      onClick={logout}
                      className={`${styles.button} ${styles.buttonRed}`}
                    >
                      Logout
                    </button>
                  </div>
                  
                  {/* Mobile Profile Section */}
                  <div className={styles.mobileProfile}>
                    <UserProfileSection variant="horizontal" />
                  </div>
                </div>
              ) : (
                <div></div>
              )}
            </div>
          </div>
        </header>

        {/* Mobile Floating Action Menu */}
        {user && (
          <div className={styles.mobileOnly}>
            {/* Floating Action Button */}
            <div className={styles.fab}>
              <div>
                {/* Main FAB */}
                <button
                  onClick={() => {
                    const menu = document.getElementById('mobile-fab-menu');
                    const fab = document.getElementById('mobile-fab-button');
                    const backdrop = document.getElementById('mobile-fab-backdrop');
                    const isOpen = menu.classList.contains(styles.fabMenuOpen);
                    
                    if (isOpen) {
                      menu.classList.remove(styles.fabMenuOpen);
                      backdrop.classList.remove(styles.fabBackdropOpen);
                      fab.querySelector(`.${styles.fabIcon}`).classList.remove(styles.fabIconRotated);
                      fab.setAttribute('aria-expanded', 'false');
                    } else {
                      menu.classList.add(styles.fabMenuOpen);
                      backdrop.classList.add(styles.fabBackdropOpen);
                      fab.querySelector(`.${styles.fabIcon}`).classList.add(styles.fabIconRotated);
                      fab.setAttribute('aria-expanded', 'true');
                    }
                  }}
                  id="mobile-fab-button"
                  aria-label="Open menu"
                  aria-expanded="false"
                  className={styles.fabButton}
                >
                  <span className={styles.fabIcon} aria-hidden="true">⚡</span>
                </button>

                {/* FAB Menu */}
                <div
                  id="mobile-fab-menu"
                  className={styles.fabMenu}
                  role="menu"
                  aria-label="Navigation actions"
                >
                  <div className={styles.fabMenuItems}>
                    {/* Advanced Search */}
                    <div className={styles.fabMenuItem}>
                      <div className={styles.fabMenuLabel}>
                        Advanced Search
                      </div>
                      <button
                        onClick={() => {
                          // Close menu and navigate
                          const menu = document.getElementById('mobile-fab-menu');
                          const fab = document.getElementById('mobile-fab-button');
                          const backdrop = document.getElementById('mobile-fab-backdrop');
                          menu.classList.remove(styles.fabMenuOpen);
                          backdrop.classList.remove(styles.fabBackdropOpen);
                          fab.querySelector(`.${styles.fabIcon}`).classList.remove(styles.fabIconRotated);
                          fab.setAttribute('aria-expanded', 'false');
                          router.push('/search');
                        }}
                        role="menuitem"
                        aria-label="Access advanced search"
                        className={`${styles.fabMenuButton} ${styles.fabMenuButtonBlue}`}
                      >
                        <span aria-hidden="true">🔍</span>
                      </button>
                    </div>

                    {/* Profile */}
                    <div className={styles.fabMenuItem}>
                      <div className={styles.fabMenuLabel}>
                        Profile
                      </div>
                      <button
                        onClick={() => {
                          // Close menu and navigate
                          const menu = document.getElementById('mobile-fab-menu');
                          const fab = document.getElementById('mobile-fab-button');
                          const backdrop = document.getElementById('mobile-fab-backdrop');
                          menu.classList.remove(styles.fabMenuOpen);
                          backdrop.classList.remove(styles.fabBackdropOpen);
                          fab.querySelector(`.${styles.fabIcon}`).classList.remove(styles.fabIconRotated);
                          fab.setAttribute('aria-expanded', 'false');
                          router.push(`/profile/${user.username}`);
                        }}
                        role="menuitem"
                        aria-label="View your profile"
                        className={`${styles.fabMenuButton} ${styles.fabMenuButtonPurple}`}
                      >
                        <span aria-hidden="true">👤</span>
                      </button>
                    </div>

                    {/* Upload Data (for admins) */}
                    <RoleProtected requiredRole="admin">
                      <div className={styles.fabMenuItem}>
                        <div className={styles.fabMenuLabel}>
                          Upload Data
                        </div>
                        <button
                          onClick={() => {
                            // Close menu and navigate
                            const menu = document.getElementById('mobile-fab-menu');
                            const fab = document.getElementById('mobile-fab-button');
                            const backdrop = document.getElementById('mobile-fab-backdrop');
                            menu.classList.remove(styles.fabMenuOpen);
                            backdrop.classList.remove(styles.fabBackdropOpen);
                            fab.querySelector(`.${styles.fabIcon}`).classList.remove(styles.fabIconRotated);
                            fab.setAttribute('aria-expanded', 'false');
                            router.push('/upload');
                          }}
                          role="menuitem"
                          aria-label="Upload student data"
                          className={`${styles.fabMenuButton} ${styles.fabMenuButtonGreen}`}
                        >
                          <span aria-hidden="true">📤</span>
                        </button>
                      </div>
                    </RoleProtected>

                    {/* User Management (for superAdmins) */}
                    <RoleProtected requiredRole="superAdmin">
                      <div className={styles.fabMenuItem}>
                        <div className={styles.fabMenuLabel}>
                          Manage Users
                        </div>
                        <button
                          onClick={() => {
                            // Close menu and navigate
                            const menu = document.getElementById('mobile-fab-menu');
                            const fab = document.getElementById('mobile-fab-button');
                            const backdrop = document.getElementById('mobile-fab-backdrop');
                            menu.classList.remove(styles.fabMenuOpen);
                            backdrop.classList.remove(styles.fabBackdropOpen);
                            fab.querySelector(`.${styles.fabIcon}`).classList.remove(styles.fabIconRotated);
                            fab.setAttribute('aria-expanded', 'false');
                            router.push('/user-management');
                          }}
                          role="menuitem"
                          aria-label="Manage users"
                          className={`${styles.fabMenuButton} ${styles.fabMenuButtonIndigo}`}
                        >
                          <span aria-hidden="true">👥</span>
                        </button>
                      </div>
                    </RoleProtected>

                    {/* Logout */}
                    <div className={styles.fabMenuItem}>
                      <div className={styles.fabMenuLabel}>
                        Logout
                      </div>
                      <button
                        onClick={() => {
                          // Close menu and logout
                          const menu = document.getElementById('mobile-fab-menu');
                          const fab = document.getElementById('mobile-fab-button');
                          const backdrop = document.getElementById('mobile-fab-backdrop');
                          menu.classList.remove(styles.fabMenuOpen);
                          backdrop.classList.remove(styles.fabBackdropOpen);
                          fab.querySelector(`.${styles.fabIcon}`).classList.remove(styles.fabIconRotated);
                          fab.setAttribute('aria-expanded', 'false');
                          logout();
                        }}
                        role="menuitem"
                        aria-label="Logout"
                        className={`${styles.fabMenuButton} ${styles.fabMenuButtonRed}`}
                      >
                        <span aria-hidden="true">🚪</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Backdrop to close menu when clicking outside */}
            <div
              onClick={() => {
                const menu = document.getElementById('mobile-fab-menu');
                const fab = document.getElementById('mobile-fab-button');
                const backdrop = document.getElementById('mobile-fab-backdrop');
                if (menu.classList.contains(styles.fabMenuOpen)) {
                  menu.classList.remove(styles.fabMenuOpen);
                  backdrop.classList.remove(styles.fabBackdropOpen);
                  fab.querySelector(`.${styles.fabIcon}`).classList.remove(styles.fabIconRotated);
                  fab.setAttribute('aria-expanded', 'false');
                }
              }}
              className={styles.fabBackdrop}
              id="mobile-fab-backdrop"
            ></div>
          </div>
        )}

        {/* Hero Section */}
        <div className={styles.heroContainer}>
          <div className={`${styles.heroContent} ${mounted ? styles.heroContentVisible : ''}`}>
            <h2 className={styles.heroTitle}>
              Only for Parul Institute for Technology(PIT) Students
            </h2>
            <p className={styles.heroSubtitle}>
              Connect, discover, and collaborate with students across campus. 
              Enter the exact UG number to find student information.
            </p>
          </div>
        </div>

        {/* Role Stats Section */}
        {user && (
          <div className={styles.roleStatsSection}>
            <div className={`${styles.roleStatsContent} ${mounted ? styles.roleStatsContentVisible : ''}`}>
              <RoleStatsCard />
            </div>
          </div>
        )}

        {/* Search Section */}
        <main className={styles.searchMain}>
          <div className={`${styles.searchContent} ${mounted ? styles.searchContentVisible : ''}`}>
            {/* Search Form */}
            <form onSubmit={handleSearch} className={styles.searchForm}>
                <div className={styles.searchFormGroup}>
                  <div className={styles.searchFormGroupGlow}></div>
                  <div className={styles.searchFormContainer}>
                    <div className={styles.searchFormFields}>
                      <div className={styles.searchInputContainer}>
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Enter exact UG number (e.g., UG/2023/001)..."
                          className={styles.searchInput}
                          style={{fontSize: '16px'}}
                        />
                        <div className={styles.searchInputIcon}>
                          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                        </div>
                      </div>
                      <button
                        type="submit"
                        disabled={isSearching}
                        className={styles.searchButton}
                      >
                        {isSearching ? (
                          <div className={styles.searchButtonLoading}>
                            <div className={styles.searchButtonSpinner}></div>
                            <span className={styles.searchButtonText}>Searching...</span>
                          </div>
                        ) : (
                          'Find Student'
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </form>

              {/* Search Results */}
              {searchQuery.trim() && searchResults.length === 0 && !isSearching && (
                <div className={styles.noResults}>
                  <div className={styles.noResultsCard}>
                    <div className={styles.noResultsIcon}>
                      <svg className={styles.noResultsIconSvg} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.467-.881-6.077-2.33l-.853-.854A7.962 7.962 0 016 6c0-2.21.895-4.21 2.343-5.657L9.172 1.172a4 4 0 015.656 0L15.657.343A7.962 7.962 0 0118 6a7.96 7.96 0 01-.93 3.77l-.854.853z" />
                      </svg>
                    </div>
                    <h3 className={styles.noResultsTitle}>No Student Found</h3>
                    <p className={styles.noResultsText}>
                      No student found with UG number &quot;{searchQuery.trim()}&quot;. 
                      Please check the UG number and try again.
                    </p>
                  </div>
                </div>
              )}
              
              {searchResults.length > 0 && (
                <div className={styles.searchResults}>
                  <h2 className={styles.searchResultsTitle}>
                    <span className={styles.searchResultsIcon}>
                      <svg className={styles.searchResultsIconSvg} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    <span className={styles.searchResultsTitleText}>
                      Student Found
                    </span>
                  </h2>
                  <div className={styles.searchResultsGrid}>
                    {searchResults.map((student, index) => (
                      <div
                        key={student._id}
                        className={`${styles.studentCard} ${mounted ? styles.studentCardVisible : ''}`}
                        style={{ animationDelay: `${index * 100}ms` }}
                        onClick={() => router.push(`/student/${student.ugNumber}`)}
                      >
                        <div className={styles.studentCardInner}>
                          <div className={styles.studentCardHeader}>
                            <div className={styles.studentCardAvatar}>
                              {student.name.charAt(0)}
                            </div>
                            <div className={styles.studentCardInfo}>
                              <h3 className={styles.studentCardName}>
                                {student.name}
                              </h3>
                              <p className={styles.studentCardUgNumber}>{student.ugNumber}</p>
                            </div>
                          </div>
                          
                          <div className={styles.studentCardDetails}>
                            <div className={styles.studentCardDetailItem}>
                              <svg className={styles.studentCardDetailIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                              </svg>
                              <span className={styles.studentCardDetailText}>{student.branch}</span>
                            </div>
                            <div className={styles.studentCardDetailItem}>
                              <svg className={styles.studentCardDetailIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span className={styles.studentCardDetailText}>{student.year}</span>
                            </div>
                            {student.division && (
                              <div className={styles.studentCardDetailItem}>
                                <svg className={styles.studentCardDetailIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h1a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                                <span className={styles.studentCardDetailText}>Division {student.division}</span>
                              </div>
                            )}
                            {student.btechDiploma && (
                              <div className={styles.studentCardDetailItem}>
                                <svg className={styles.studentCardDetailIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                                </svg>
                                <span className={styles.studentCardDetailText}>{student.btechDiploma}</span>
                              </div>
                            )}
                            {student.state && (
                              <div className={styles.studentCardDetailItem}>
                                <svg className={styles.studentCardDetailIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <span className={styles.studentCardDetailText}>{student.state}</span>
                              </div>
                            )}
                            {student.caste && student.caste !== 'General(open)' && (
                              <div className={styles.studentCardDetailItem}>
                                <svg className={styles.studentCardDetailIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                <span className={styles.studentCardDetailText}>{student.caste}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
  );
}
