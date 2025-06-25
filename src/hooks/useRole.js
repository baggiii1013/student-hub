'use client';

import { useAuth } from '@/contexts/AuthContext';
import {
    getRoleDisplayName,
    PERMISSIONS,
    roleHasPermission,
    roleIsEqualOrHigher,
    ROLES
} from '@/utils/roles';

export function useRole() {
  const { user } = useAuth();
  const role = user?.role || ROLES.USER;

  // Role check functions
  const isUser = () => role === ROLES.USER;
  const isAdmin = () => role === ROLES.ADMIN;
  const isSuperAdmin = () => role === ROLES.SUPER_ADMIN;

  // Hierarchy checks
  const isAdminOrHigher = () => roleIsEqualOrHigher(role, ROLES.ADMIN);
  const isUserOrHigher = () => roleIsEqualOrHigher(role, ROLES.USER);

  // Generic role check with hierarchy
  const hasRole = (requiredRole) => roleIsEqualOrHigher(role, requiredRole);

  // Permission-based checks
  const canUpload = () => roleHasPermission(role, PERMISSIONS.UPLOAD_DATA);
  const canManageUsers = () => roleHasPermission(role, PERMISSIONS.MANAGE_USERS);
  const canViewStudents = () => roleHasPermission(role, PERMISSIONS.VIEW_STUDENTS);
  const canEditStudents = () => roleHasPermission(role, PERMISSIONS.EDIT_STUDENTS);
  const canDeleteStudents = () => roleHasPermission(role, PERMISSIONS.DELETE_STUDENTS);

  // Check specific permission
  const hasPermission = (permission) => roleHasPermission(role, permission);

  return {
    role,
    roleDisplayName: getRoleDisplayName(role),
    isUser,
    isAdmin,
    isSuperAdmin,
    isAdminOrHigher,
    isUserOrHigher,
    hasRole,
    hasPermission,
    canUpload,
    canManageUsers,
    canViewStudents,
    canEditStudents,
    canDeleteStudents
  };
}
