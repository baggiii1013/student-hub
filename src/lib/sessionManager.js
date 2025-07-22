'use client';

// Session persistence utilities
export class SessionManager {
  static SESSION_KEY = 'auth_session_backup';
  static LAST_ACTIVITY_KEY = 'last_activity';

  // Save session data to localStorage as backup
  static saveSessionBackup(user, authType = 'nextauth') {
    try {
      const sessionData = {
        user,
        authType,
        timestamp: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
      };
      
      localStorage.setItem(this.SESSION_KEY, JSON.stringify(sessionData));
      this.updateActivity();
    } catch (error) {
      console.error('Failed to save session backup:', error);
    }
  }

  // Restore session from localStorage
  static restoreSessionBackup() {
    try {
      const sessionData = localStorage.getItem(this.SESSION_KEY);
      if (!sessionData) return null;

      const parsed = JSON.parse(sessionData);
      
      // Check if backup session has expired
      if (new Date(parsed.expiresAt) <= new Date()) {
        this.clearSessionBackup();
        return null;
      }

      return parsed;
    } catch (error) {
      console.error('Failed to restore session backup:', error);
      this.clearSessionBackup();
      return null;
    }
  }

  // Clear session backup
  static clearSessionBackup() {
    try {
      localStorage.removeItem(this.SESSION_KEY);
      localStorage.removeItem(this.LAST_ACTIVITY_KEY);
    } catch (error) {
      console.error('Failed to clear session backup:', error);
    }
  }

  // Update last activity timestamp
  static updateActivity() {
    try {
      localStorage.setItem(this.LAST_ACTIVITY_KEY, new Date().toISOString());
    } catch (error) {
      console.error('Failed to update activity:', error);
    }
  }

  // Check if user has been inactive for too long
  static isSessionStale(maxInactiveMinutes = 60) {
    try {
      const lastActivity = localStorage.getItem(this.LAST_ACTIVITY_KEY);
      if (!lastActivity) return true;

      const lastActivityTime = new Date(lastActivity);
      const now = new Date();
      const diffMinutes = (now - lastActivityTime) / (1000 * 60);

      return diffMinutes > maxInactiveMinutes;
    } catch (error) {
      console.error('Failed to check session staleness:', error);
      return true;
    }
  }

  // Initialize session management
  static init() {
    // Update activity on various user interactions
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    const updateActivityThrottled = this.throttle(() => {
      this.updateActivity();
    }, 30000); // Update at most every 30 seconds

    events.forEach(event => {
      document.addEventListener(event, updateActivityThrottled, { passive: true });
    });

    // Clean up stale sessions on page load
    if (this.isSessionStale(60)) { // 60 minutes
      this.clearSessionBackup();
    }
  }

  // Throttle function to limit how often a function is called
  static throttle(func, limit) {
    let inThrottle;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }
}

// Network status detection
export class NetworkManager {
  static isOnline() {
    return navigator.onLine;
  }

  static onNetworkChange(callback) {
    window.addEventListener('online', () => callback(true));
    window.addEventListener('offline', () => callback(false));
  }

  static async checkConnectivity() {
    try {
      const response = await fetch('/api/auth/status', {
        method: 'HEAD',
        cache: 'no-cache'
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}
