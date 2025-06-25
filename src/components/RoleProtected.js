'use client';

import { useRole } from '@/hooks/useRole';

export default function RoleProtected({ 
  children, 
  requiredRole = 'user', 
  fallback = null,
  allowedRoles = null 
}) {
  const { hasRole, role } = useRole();

  // If allowedRoles array is provided, check if user's role is in that array
  if (allowedRoles && Array.isArray(allowedRoles)) {
    if (!allowedRoles.includes(role)) {
      return fallback;
    }
  } else {
    // Otherwise use hierarchy-based check
    if (!hasRole(requiredRole)) {
      return fallback;
    }
  }

  return children;
}
