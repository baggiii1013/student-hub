'use client';

import { NetworkManager, SessionManager } from '@/lib/sessionManager';
import { jwtDecode } from 'jwt-decode';
import { signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const router = useRouter();
  const { data: session, status } = useSession();

  // Function to check and refresh session if needed
  const checkSession = useCallback(async () => {
    try {
      // Don't make requests when offline
      if (!isOnline) {
        // Try to use backup session if available
        const backup = SessionManager.restoreSessionBackup();
        if (backup && backup.user) {
          setUser(backup.user);
          return true;
        }
        return false;
      }

      const response = await fetch('/api/auth/session', {
        method: 'GET',
        credentials: 'include',
        cache: 'no-cache'
      });
      
      if (response.ok) {
        const sessionData = await response.json();
        if (sessionData && sessionData.user) {
          const userData = {
            id: sessionData.user.id,
            username: sessionData.user.username,
            email: sessionData.user.email,
            fullName: sessionData.user.fullName,
            isOAuthUser: sessionData.user.isOAuthUser,
            passwordSetupComplete: sessionData.user.passwordSetupComplete,
            role: sessionData.user.role
          };
          
          setUser(userData);
          SessionManager.saveSessionBackup(userData, 'nextauth');
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Session check failed:', error);
      
      // Try backup if network request fails
      const backup = SessionManager.restoreSessionBackup();
      if (backup && backup.user) {
        setUser(backup.user);
        return true;
      }
      
      return false;
    }
  }, [isOnline]);

  // Initialize session management
  useEffect(() => {
    SessionManager.init();
    setIsOnline(NetworkManager.isOnline());
  }, []);

  // Set up network monitoring
  useEffect(() => {
    const handleNetworkChange = (online) => {
      setIsOnline(online);
      if (online && user) {
        // Revalidate session when coming back online
        checkSession();
      }
    };

    NetworkManager.onNetworkChange(handleNetworkChange);
    
    // Cleanup is not needed as NetworkManager handles it internally
  }, [user, checkSession]);

  useEffect(() => {
    const handleAuthentication = async () => {
      if (status === 'loading') {
        setLoading(true);
        return;
      }

      if (session && session.user) {
        // User is authenticated via NextAuth
        const userData = {
          id: session.user.id,
          username: session.user.username,
          email: session.user.email,
          fullName: session.user.fullName,
          isOAuthUser: session.user.isOAuthUser,
          passwordSetupComplete: session.user.passwordSetupComplete,
          role: session.user.role
        };
        
        setUser(userData);
        SessionManager.saveSessionBackup(userData, 'nextauth');
        setLoading(false);
        setSessionChecked(true);
      } else {
        // If no NextAuth session, try to refresh it first
        if (!sessionChecked) {
          const sessionRefreshed = await checkSession();
          setSessionChecked(true);
          
          if (sessionRefreshed) {
            setLoading(false);
            return;
          }
        }

        // Check for legacy JWT token authentication
        const token = localStorage.getItem('token');
        const username = localStorage.getItem('username');
        
        if (token && username) {
          try {
            // Decode token payload
            const decodedToken = jwtDecode(token);

            // Check if token has expired
            if (decodedToken.exp * 1000 < Date.now()) {
              localStorage.removeItem('token');
              localStorage.removeItem('username');
              setUser(null);
              setLoading(false);
              return;
            }
            const userData = {
              username,
              token,
              ...decodedToken.user
            };
            
            setUser(userData);
            SessionManager.saveSessionBackup(userData, 'jwt');
          } catch (error) {
            localStorage.removeItem('token');
            localStorage.removeItem('username');
            setUser(null);
            SessionManager.clearSessionBackup();
          }
        } else {
          // No session found, try backup as last resort
          const backup = SessionManager.restoreSessionBackup();
          if (backup && backup.user && !SessionManager.isSessionStale(30)) { // 30 min tolerance
            setUser(backup.user);
          } else {
            setUser(null);
            SessionManager.clearSessionBackup();
          }
        }
        setLoading(false);
      }
    };

    handleAuthentication();
  }, [session, status, sessionChecked, checkSession]);

  // Automatic session refresh every 5 minutes to prevent logout
  useEffect(() => {
    if (!user || loading) return;

    const refreshInterval = setInterval(async () => {
      if (session) {
        // For NextAuth sessions, check if still valid
        await checkSession();
      } else if (user.token) {
        // For JWT tokens, check expiration
        try {
          const decodedToken = jwtDecode(user.token);
          if (decodedToken.exp * 1000 < Date.now() + 60000) { // If expires in less than 1 minute
            localStorage.removeItem('token');
            localStorage.removeItem('username');
            setUser(null);
            router.push('/login');
          }
        } catch (error) {
          console.error('Token refresh check failed:', error);
        }
      }
    }, 5 * 60 * 1000); // Every 5 minutes

    return () => clearInterval(refreshInterval);
  }, [user, loading, session, checkSession, router]);

  const login = (token, username) => {
    // This function is for legacy JWT login
    // OAuth login is handled by NextAuth
    try {
      // Decode JWT token to get full user information
      const tokenPayload = JSON.parse(atob(token.split('.')[1]));
      const userInfo = tokenPayload.user;
      
      localStorage.setItem('token', token);
      localStorage.setItem('username', username);
      
      // Set user with full information from the token
      setUser({
        id: userInfo.id,
        username: userInfo.username,
        email: userInfo.email,
        role: userInfo.role,
        token
      });
    } catch (error) {
      // Fallback to basic user info
      localStorage.setItem('token', token);
      localStorage.setItem('username', username);
      setUser({ username, token });
    }
    router.push('/');
  };

  const logout = async () => {
    try {
      // Clear all session data
      SessionManager.clearSessionBackup();
      
      if (session) {
        // Sign out from NextAuth
        await signOut({ callbackUrl: '/login' });
      } else {
        // Legacy logout
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        setUser(null);
        router.push('/');
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Force logout even if there's an error
      localStorage.removeItem('token');
      localStorage.removeItem('username');
      SessionManager.clearSessionBackup();
      setUser(null);
      router.push('/');
    }
  };

  const value = {
    user,
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
