'use client';
import styles from './RoleBadge.module.css';

export default function RoleBadge({ role, size = 'sm', showIcon = true }) {
  const getRoleClassName = () => {
    switch (role) {
      case 'superAdmin':
        return styles.superAdmin;
      case 'admin':
        return styles.admin;
      case 'user':
      default:
        return styles.user;
    }
  };

  const getRoleDisplayName = () => {
    switch (role) {
      case 'superAdmin':
        return 'Super Admin';
      case 'admin':  
        return 'Admin';
      case 'user':
      default:
        return 'User';
    }
  };

  const getSizeClassName = () => {
    switch (size) {
      case 'xs':
        return styles.sizeXs;
      case 'sm':
        return styles.sizeSm;
      case 'md':
      default:
        return styles.sizeMd;
    }
  };

  const getIconClassName = () => {
    switch (size) {
      case 'xs':
        return styles.iconXs;
      case 'sm':
        return styles.iconSm;
      case 'md':
      default:
        return styles.iconMd;
    }
  };

  const getRoleIcon = () => {
    if (role === 'superAdmin') {
      return (
        <svg className={getIconClassName()} viewBox="0 0 24 24">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      );
    }
    if (role === 'admin') {
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

  if (!role) return null;

  return (
    <span className={`${styles.badge} ${getSizeClassName()} ${getRoleClassName()}`}>
      {showIcon && getRoleIcon()}
      <span>{getRoleDisplayName()}</span>
    </span>
  );
}
