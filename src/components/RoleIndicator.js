'use client';

import { useRole } from '@/hooks/useRole';
import styles from './RoleIndicator.module.css';

export default function RoleIndicator({ showPermissions = true, size = 'md', variant = 'pill', role: propRole }) {
  const { role: hookRole, roleDisplayName: hookRoleDisplayName, isAdmin, isSuperAdmin, canUpload, canManageUsers, canEditStudents, canDeleteStudents } = useRole();
  
  // Use prop role if provided, otherwise use hook role
  const role = propRole || hookRole;
  
  // Get role display name and permissions based on the role
  const getRoleDisplayName = (role) => {
    const displayNames = {
      'user': 'User',
      'admin': 'Administrator', 
      'superAdmin': 'Super Administrator'
    };
    return displayNames[role] || 'Unknown';
  };
  
  const roleDisplayName = propRole ? getRoleDisplayName(propRole) : hookRoleDisplayName;
  
  // Permission functions for prop role
  const getRolePermissions = (role) => {
    const permissions = [];
    if (role === 'admin' || role === 'superAdmin') {
      permissions.push('Upload Data');
      permissions.push('Edit Students');
    }
    if (role === 'superAdmin') {
      permissions.push('Manage Users');
      permissions.push('Delete Students');
    }
    return permissions;
  };

  const getRoleClassName = () => {
    const baseRole = role === 'superAdmin' ? 'superAdmin' : 
                    role === 'admin' ? 'admin' : 'user';
    const variantSuffix = variant === 'badge' ? 'Badge' : 'Pill';
    return styles[baseRole + variantSuffix];
  };

  const getSizeClassName = () => {
    switch (size) {
      case 'sm':
        return styles.sizeSm;
      case 'lg':
        return styles.sizeLg;
      case 'md':
      default:
        return styles.sizeMd;
    }
  };

  const getIconClassName = () => {
    switch (size) {
      case 'sm':
        return styles.iconSm;
      case 'lg':
        return styles.iconLg;
      case 'md':
      default:
        return styles.iconMd;
    }
  };

  const getRoleIcon = () => {
    const isSuperAdminRole = role === 'superAdmin' || (propRole ? false : isSuperAdmin());
    const isAdminRole = role === 'admin' || role === 'superAdmin' || (propRole ? false : isAdmin());
    
    if (isSuperAdminRole) {
      return (
        <svg className={getIconClassName()} viewBox="0 0 24 24">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      );
    }
    if (isAdminRole) {
      return (
        <svg className={getIconClassName()} viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
        </svg>
      );
    }
    return (
      <svg className={getIconClassName()} viewBox="0 0 24 24">
        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
      </svg>
    );
  };

  const getPermissionsList = () => {
    if (propRole) {
      return getRolePermissions(propRole);
    }
    
    const permissions = [];
    if (canUpload()) permissions.push('Upload Data');
    if (canManageUsers()) permissions.push('Manage Users');
    if (canEditStudents()) permissions.push('Edit Students');
    if (canDeleteStudents()) permissions.push('Delete Students');
    return permissions;
  };

  const getPermissionClassName = (permission) => {
    switch (permission) {
      case 'Upload Data':
        return styles.uploadData;
      case 'Manage Users':
        return styles.manageUsers;
      case 'Edit Students':
        return styles.editStudents;
      case 'Delete Students':
        return styles.deleteStudents;
      default:
        return styles.defaultPermission;
    }
  };

  if (variant === 'badge') {
    return (
      <div className={styles.badgeContainer}>
        <div className={`${styles.roleIndicator} ${styles.badgeVariant} ${getSizeClassName()} ${getRoleClassName()}`}>
          {getRoleIcon()}
          <span>{roleDisplayName}</span>
        </div>
        {showPermissions && getPermissionsList().length > 0 && (
          <div className={styles.permissionsContainer}>
            {getPermissionsList().map((permission) => (
              <span
                key={permission}
                className={`${styles.permissionBadge} ${getPermissionClassName(permission)}`}
              >
                {permission}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Default pill variant
  return (
    <div className={styles.pillContainer}>
      <div className={`${styles.roleIndicator} ${styles.pillVariant} ${getSizeClassName()} ${getRoleClassName()}`}>
        {getRoleIcon()}
        <span>{roleDisplayName}</span>
      </div>
      {showPermissions && getPermissionsList().length > 0 && (
        <div className={`${styles.permissionsContainer} ${styles.permissionsContainerPill}`}>
          {getPermissionsList().map((permission) => (
            <span
              key={permission}
              className={`${styles.permissionBadge} ${styles.permissionBadgePill} ${getPermissionClassName(permission)}`}
            >
              {permission}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
