'use client';

import { useRole } from '@/hooks/useRole';

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

  const getRoleColor = () => {
    switch (role) {
      case 'superAdmin':
        return 'bg-gradient-to-r from-red-500 to-pink-500 shadow-red-500/25';
      case 'admin':
        return 'bg-gradient-to-r from-purple-500 to-indigo-500 shadow-purple-500/25';
      case 'user':
      default:
        return 'bg-gradient-to-r from-blue-500 to-cyan-500 shadow-blue-500/25';
    }
  };

  const getRoleColorLight = () => {
    switch (role) {
      case 'superAdmin':
        return 'bg-gradient-to-r from-red-100 to-pink-100 text-red-700 border-red-200';
      case 'admin':
        return 'bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-700 border-purple-200';
      case 'user':
      default:
        return 'bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 border-blue-200';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'text-xs px-2 py-1';
      case 'lg':
        return 'text-base px-4 py-2';
      case 'md':
      default:
        return 'text-sm px-3 py-1.5';
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'sm':
        return 'w-3 h-3';
      case 'lg':
        return 'w-5 h-5';
      case 'md':
      default:
        return 'w-4 h-4';
    }
  };

  const getRoleIcon = () => {
    const isSuperAdminRole = role === 'superAdmin' || (propRole ? false : isSuperAdmin());
    const isAdminRole = role === 'admin' || role === 'superAdmin' || (propRole ? false : isAdmin());
    
    if (isSuperAdminRole) {
      return (
        <svg className={getIconSize()} fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      );
    }
    if (isAdminRole) {
      return (
        <svg className={getIconSize()} fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
        </svg>
      );
    }
    return (
      <svg className={getIconSize()} fill="currentColor" viewBox="0 0 24 24">
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

  const getBadgeColor = (permission) => {
    switch (permission) {
      case 'Upload Data':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'Manage Users':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'Edit Students':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Delete Students':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  if (variant === 'badge') {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        <div className={`inline-flex items-center gap-1.5 ${getSizeClasses()} rounded-full border font-medium ${getRoleColorLight()}`}>
          {getRoleIcon()}
          <span>{roleDisplayName}</span>
        </div>
        {showPermissions && getPermissionsList().length > 0 && (
          <div className="flex gap-1 flex-wrap">
            {getPermissionsList().map((permission) => (
              <span
                key={permission}
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getBadgeColor(permission)}`}
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
    <div className="inline-flex items-center gap-3">
      <div className={`flex items-center gap-1.5 ${getSizeClasses()} rounded-full text-white font-medium shadow-lg ${getRoleColor()}`}>
        {getRoleIcon()}
        <span>{roleDisplayName}</span>
      </div>
      {showPermissions && getPermissionsList().length > 0 && (
        <div className="flex gap-1.5 flex-wrap">
          {getPermissionsList().map((permission) => (
            <span
              key={permission}
              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getBadgeColor(permission)}`}
            >
              {permission}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
