'use client';

import RoleIndicator from '@/components/RoleIndicator';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import styles from './page.module.css';

export default function ProfilePage() {
  const { slug } = useParams();
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const isOwnProfile = currentUser && currentUser.username === slug;

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      // Add safety check for slug
      if (!slug) {
        setError('Invalid profile URL');
        return;
      }
      
      const data = await api.get(`/users/profile/${slug}`);
      setProfile(data);
    } catch (err) {
      console.error('Error fetching profile:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to load profile';
      setError(errorMessage);
      
      if (err.response?.status === 404) {
        // Don't redirect immediately, let user see the error
        setTimeout(() => {
          router.push('/');
        }, 2000);
      }
    } finally {
      setLoading(false);
    }
  }, [slug, router]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  if (loading) {
    return (
      <div className={styles.centerContainer}>
        <div className={styles.loadingContent}>
          <div className={styles.spinner}></div>
          <p className={styles.loadingText}>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className={styles.centerContainer}>
        <div className={styles.notFoundContent}>
          <div className={styles.notFoundEmoji}>😞</div>
          <h1 className={styles.notFoundTitle}>Profile not found</h1>
          <p className={styles.notFoundDescription}>The user profile you&apos;re looking for doesn&apos;t exist.</p>
          <button 
            onClick={() => router.push('/')}
            className={styles.notFoundButton}
          >
            Go Back Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.maxWidth}>
        {/* Error Message */}
        {error && (
          <div className={styles.errorContainer}>
            <div className={styles.errorContent}>
              <div className={styles.errorIcon}>⚠️</div>
              <div className={styles.errorText}>{error}</div>
            </div>
          </div>
        )}

        {/* Header Card */}
        <div className={styles.headerCard}>
          <div className={styles.headerBackground}>
            <div className={styles.headerContent}>
              {/* Avatar */}
              <div className={styles.avatar}>
                <span className={styles.avatarText}>
                  {profile.fullName ? profile.fullName.charAt(0).toUpperCase() : profile.username.charAt(0).toUpperCase()}
                </span>
              </div>
              
              {/* Profile Info */}
              <div className={styles.profileInfo}>
                <h1 className={styles.profileName}>
                  {profile.fullName || profile.username}
                </h1>
                <p className={styles.profileUsername}>@{profile.username}</p>
                <p className={styles.profileEmail}>{profile.email}</p>
                
                {/* Role Badge - Mobile */}
                <div className={styles.roleBadgeMobile}>
                  {profile.role && (
                    <RoleIndicator 
                      role={profile.role} 
                      size="sm" 
                      showPermissions={false} 
                      variant="badge"
                    />
                  )}
                </div>
              </div>
              
              {/* Role Badge - Desktop */}
              <div className={styles.roleBadgeDesktop}>
                {profile.role && (
                  <RoleIndicator 
                    role={profile.role} 
                    size="sm" 
                    showPermissions={true} 
                    variant="badge"
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Profile Content */}
        <div className={styles.contentGrid}>
          {/* User Information Card */}
          <div className={styles.infoCard} style={{animationDelay: '0.1s'}}>
            <div className={styles.cardHeader}>
              <div className={`${styles.cardIcon} ${styles.userIcon}`}>
                <span className={`${styles.iconText} ${styles.userIconText}`}>👤</span>
              </div>
              <h2 className={styles.cardTitle}>User Information</h2>
            </div>
            
            <div className={styles.infoList}>
              <div className={styles.infoItem}>
                <div className={styles.infoItemContent}>
                  <span className={styles.infoLabel}>Full Name</span>
                  <span className={styles.infoValue}>
                    {profile.fullName || (
                      <span className={styles.infoValueNotSpecified}>Not specified</span>
                    )}
                  </span>
                </div>
              </div>
              
              <div className={styles.infoItem}>
                <div className={styles.infoItemContent}>
                  <span className={styles.infoLabel}>Username</span>
                  <span className={`${styles.infoValue} ${styles.infoValueUsername}`}>
                    @{profile.username}
                  </span>
                </div>
              </div>
              
              <div className={styles.infoItem}>
                <div className={styles.infoItemContent}>
                  <span className={styles.infoLabel}>Email</span>
                  <span className={`${styles.infoValue} ${styles.infoValueEmail}`}>
                    {profile.email}
                  </span>
                </div>
              </div>
              
              <div className={styles.infoItem}>
                <div className={styles.infoItemContent}>
                  <span className={styles.infoLabel}>Account Type</span>
                  <div>
                    {profile.isOAuthUser ? (
                      <span className={`${styles.statusBadge} ${styles.statusBadgeOAuth}`}>
                        <span className={`${styles.statusDot} ${styles.statusDotGreen}`}></span>
                        OAuth ({profile.oauthProvider || 'Unknown'})
                      </span>
                    ) : (
                      <span className={`${styles.statusBadge} ${styles.statusBadgeRegular}`}>
                        <span className={`${styles.statusDot} ${styles.statusDotBlue}`}></span>
                        Regular Account
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className={styles.infoItem}>
                <div className={styles.infoItemContent}>
                  <span className={styles.infoLabel}>Member Since</span>
                  <span className={styles.infoValue}>
                    {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    }) : 'Unknown'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Account Details Card */}
          <div className={styles.infoCard} style={{animationDelay: '0.2s'}}>
            <div className={styles.cardHeader}>
              <div className={`${styles.cardIcon} ${styles.settingsIcon}`}>
                <span className={`${styles.iconText} ${styles.settingsIconText}`}>⚙️</span>
              </div>
              <h2 className={styles.cardTitle}>Account Details</h2>
            </div>
            
            <div className={styles.infoList}>
              <div className={styles.infoItem}>
                <div className={styles.infoItemContent}>
                  <span className={styles.infoLabel}>Account Status</span>
                  <span className={`${styles.statusBadge} ${styles.statusBadgeActive}`}>
                    <span className={`${styles.statusDot} ${styles.statusDotGreen} ${styles.statusDotPulse}`}></span>
                    Active
                  </span>
                </div>
              </div>
              
              <div className={styles.infoItem}>
                <div className={styles.infoItemContent}>
                  <span className={styles.infoLabel}>Password Setup</span>
                  <div>
                    {profile.passwordSetupComplete ? (
                      <span className={`${styles.statusBadge} ${styles.statusBadgeComplete}`}>
                        <span>✓</span> Complete
                      </span>
                    ) : (
                      <span className={`${styles.statusBadge} ${styles.statusBadgeIncomplete}`}>
                        <span>⚠</span> Incomplete
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className={styles.infoItem}>
                <div className={styles.infoItemContent}>
                  <span className={styles.infoLabel}>Last Updated</span>
                  <span className={styles.infoValue}>
                    {profile.updatedAt ? new Date(profile.updatedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    }) : 'Unknown'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className={styles.actionButtons} style={{animationDelay: '0.3s'}}>
          <button
            onClick={() => router.push('/')}
            className={styles.backButton}
          >
            <span>←</span>
            <span>Back to Dashboard</span>
          </button>
        </div>
      </div>
    </div>
  );
}
