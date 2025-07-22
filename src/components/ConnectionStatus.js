'use client';

import { NetworkManager } from '@/lib/sessionManager';
import { useEffect, useState } from 'react';
import styles from './ConnectionStatus.module.css';

export default function ConnectionStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [showStatus, setShowStatus] = useState(false);

  useEffect(() => {
    setIsOnline(NetworkManager.isOnline());

    NetworkManager.onNetworkChange((online) => {
      setIsOnline(online);
      setShowStatus(true);
      
      // Hide status message after 5 seconds if back online
      if (online) {
        setTimeout(() => setShowStatus(false), 5000);
      }
    });
  }, []);

  if (!showStatus && isOnline) return null;

  return (
    <div className={`${styles.status} ${isOnline ? styles.online : styles.offline}`}>
      {isOnline ? (
        <div className={styles.message}>
          <span className={styles.icon}>✓</span>
          Connection restored
        </div>
      ) : (
        <div className={styles.message}>
          <span className={styles.icon}>⚠</span>
          No internet connection. Some features may not work properly.
        </div>
      )}
    </div>
  );
}
