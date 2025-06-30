'use client';

import { useRole } from '@/hooks/useRole';
import RoleIndicator from './RoleIndicator';
import styles from './RoleStatsCard.module.css';

export default function RoleStatsCard() {
  const { role, roleDisplayName, canUpload, canManageUsers, canEditStudents, canDeleteStudents } = useRole();

  const getStatsForRole = () => {
    const stats = [];
    
    if (canUpload()) {
      stats.push({
        icon: '📤',
        label: 'Can Upload',
        description: 'Upload student data'
      });
    }
    
    if (canEditStudents()) {
      stats.push({
        icon: '✏️',
        label: 'Can Edit',
        description: 'Edit student records'
      });
    }
    
    if (canDeleteStudents()) {
      stats.push({
        icon: '🗑️',
        label: 'Can Delete',
        description: 'Delete student records'
      });
    }
    
    if (canManageUsers()) {
      stats.push({
        icon: '👥',
        label: 'User Management',
        description: 'Manage user accounts'
      });
    }

    return stats;
  };

  const getRoleDescription = () => {
    switch (role) {
      case 'superAdmin':
        return 'You have full administrative access to the system with all permissions.';
      case 'admin':
        return 'You have administrative access with data management permissions.';
      case 'user':
      default:
        return 'You have basic access to view student information.';
    }
  };

  const stats = getStatsForRole();

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h3 className={styles.title}>Your Access Level</h3>
        <RoleIndicator size="sm" showPermissions={false} variant="pill" />
      </div>
      
      <p className={styles.description}>{getRoleDescription()}</p>
      
      {stats.length > 0 && (
        <div className={styles.permissionsSection}>
          <h4 className={styles.permissionsTitle}>Permissions</h4>
          <div className={styles.permissionsGrid}>
            {stats.map((stat, index) => (
              <div key={index} className={styles.permissionItem}>
                <span className={styles.permissionIcon}>{stat.icon}</span>
                <div className={styles.permissionContent}>
                  <div className={styles.permissionLabel}>{stat.label}</div>
                  <div className={styles.permissionDescription}>{stat.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {stats.length === 0 && (
        <div className={styles.noPermissions}>
          <span className={styles.noPermissionsText}>View-only access</span>
        </div>
      )}
    </div>
  );
}
