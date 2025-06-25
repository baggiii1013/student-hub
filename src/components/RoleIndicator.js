'use client';

import { useRole } from '@/hooks/useRole';

export default function RoleIndicator() {
  const { role, isAdmin, isSuperAdmin, canUpload, canManageUsers } = useRole();

  const getRoleColor = () => {
    switch (role) {
      case 'superAdmin':
        return 'bg-gradient-to-r from-red-500 to-pink-500';
      case 'admin':
        return 'bg-gradient-to-r from-purple-500 to-indigo-500';
      case 'user':
      default:
        return 'bg-gradient-to-r from-blue-500 to-cyan-500';
    }
  };

  const getRoleIcon = () => {
    if (isSuperAdmin()) {
      return (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      );
    }
    if (isAdmin()) {
      return (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
        </svg>
      );
    }
    return (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
      </svg>
    );
  };

  const getPermissionsList = () => {
    const permissions = [];
    if (canUpload()) permissions.push('Upload Data');
    if (canManageUsers()) permissions.push('Manage Users');
    return permissions;
  };

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-white text-sm font-medium">
      <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full ${getRoleColor()}`}>
        {getRoleIcon()}
        <span className="capitalize">{role}</span>
      </div>
      {getPermissionsList().length > 0 && (
        <div className="text-xs text-gray-400">
          • {getPermissionsList().join(', ')}
        </div>
      )}
    </div>
  );
}
