'use client';

import { useRole } from '@/hooks/useRole';
import RoleIndicator from './RoleIndicator';

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
    <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Your Access Level</h3>
        <RoleIndicator size="sm" showPermissions={false} variant="pill" />
      </div>
      
      <p className="text-gray-300 text-sm mb-6">{getRoleDescription()}</p>
      
      {stats.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-400 uppercase tracking-wide">Permissions</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {stats.map((stat, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-gray-700/50 rounded-lg border border-gray-600">
                <span className="text-lg">{stat.icon}</span>
                <div>
                  <div className="text-white font-medium text-sm">{stat.label}</div>
                  <div className="text-gray-400 text-xs">{stat.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {stats.length === 0 && (
        <div className="text-center py-4">
          <span className="text-gray-400 text-sm">View-only access</span>
        </div>
      )}
    </div>
  );
}
