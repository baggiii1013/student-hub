'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRole } from '@/hooks/useRole';
import { useRouter } from 'next/navigation';
import RoleIndicator from './RoleIndicator';
import styles from './UserProfileSection.module.css';

export default function UserProfileSection({ variant = 'horizontal' }) {
  const { user, logout } = useAuth();
  const { role, roleDisplayName } = useRole();
  const router = useRouter();

  const getUserInitials = (username) => {
    return username ? username.slice(0, 2).toUpperCase() : 'U';
  };

  const getUserColorClass = () => {
    const colors = [
      styles.avatarBlue,
      styles.avatarGreen,
      styles.avatarPink,
      styles.avatarOrange,
      styles.avatarIndigo,
    ];
    
    if (!user?.username) return colors[0];
    
    const hash = user.username.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    return colors[Math.abs(hash) % colors.length];
  };

  if (!user) return null;

  if (variant === 'card') {
    return (
      <div className={styles.card}>
        <div className={styles.cardContent}>
          <div className={`${styles.cardAvatar} ${getUserColorClass()}`}>
            {getUserInitials(user.username)}
          </div>
          <div className={styles.cardInfo}>
            <h3 className={styles.cardUsername}>{user.username}</h3>
            <p className={styles.cardEmail}>{user.email}</p>
            <RoleIndicator size="sm" showPermissions={true} variant="badge" />
          </div>
        </div>
        
        <div className={styles.cardActions}>
          <button
            onClick={() => router.push(`/profile/${user.username}`)}
            className={styles.cardButtonPrimary}
          >
            View Profile
          </button>
          <button
            onClick={logout}
            className={styles.cardButtonSecondary}
          >
            Logout
          </button>
        </div>
      </div>
    );
  }

  // Default horizontal variant
  return (
    <div className={styles.horizontal}>
      <div className={`${styles.horizontalAvatar} ${getUserColorClass()}`}>
        {getUserInitials(user.username)}
      </div>
      <div className={styles.horizontalInfo}>
        <span className={styles.horizontalUsername}>{user.username}</span>
        <RoleIndicator size="sm" showPermissions={false} variant="badge" />
      </div>
    </div>
  );
}
