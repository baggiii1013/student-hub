/**
 * Role hierarchy and permission utilities
 */

export const ROLES = {
  USER: 'user',
  ADMIN: 'admin',
  SUPER_ADMIN: 'superAdmin'
};

export const ROLE_HIERARCHY = {
  [ROLES.USER]: 1,
  [ROLES.ADMIN]: 2,
  [ROLES.SUPER_ADMIN]: 3
};

export const PERMISSIONS = {
  VIEW_STUDENTS: 'view_students',
  UPLOAD_DATA: 'upload_data',
  MANAGE_USERS: 'manage_users',
  DELETE_STUDENTS: 'delete_students',
  EDIT_STUDENTS: 'edit_students'
};

export const ROLE_PERMISSIONS = {
  [ROLES.USER]: [
    PERMISSIONS.VIEW_STUDENTS
  ],
  [ROLES.ADMIN]: [
    PERMISSIONS.VIEW_STUDENTS,
    PERMISSIONS.UPLOAD_DATA,
    PERMISSIONS.EDIT_STUDENTS
  ],
  [ROLES.SUPER_ADMIN]: [
    PERMISSIONS.VIEW_STUDENTS,
    PERMISSIONS.UPLOAD_DATA,
    PERMISSIONS.EDIT_STUDENTS,
    PERMISSIONS.DELETE_STUDENTS,
    PERMISSIONS.MANAGE_USERS
  ]
};

/**
 * Check if a role has a specific permission
 */
export function roleHasPermission(role, permission) {
  return ROLE_PERMISSIONS[role]?.includes(permission) || false;
}

/**
 * Check if a role is equal to or higher than another role
 */
export function roleIsEqualOrHigher(userRole, requiredRole) {
  const userLevel = ROLE_HIERARCHY[userRole] || 0;
  const requiredLevel = ROLE_HIERARCHY[requiredRole] || 0;
  return userLevel >= requiredLevel;
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role) {
  return ROLE_PERMISSIONS[role] || [];
}

/**
 * Get a user-friendly role display name
 */
export function getRoleDisplayName(role) {
  const displayNames = {
    [ROLES.USER]: 'User',
    [ROLES.ADMIN]: 'Administrator',
    [ROLES.SUPER_ADMIN]: 'Super Administrator'
  };
  return displayNames[role] || 'Unknown';
}
