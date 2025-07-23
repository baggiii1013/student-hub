'use client';

import { jwtDecode } from 'jwt-decode';
import { useSession } from 'next-auth/react';
import { useCallback, useEffect, useState } from 'react';

export function useAuthSession() {
  const { data: session, status, update } = useSession();
  const [authState, setAuthState] = useState({
    isAuthenticated: false,
    user: null,
    loading: true,
    authType: null,
    lastCheck: null
  });

  // Function to check JWT token validity
  const checkJWTToken = useCallback(() => {
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');
    
    if (!token || !username) {
      return null;
    }

    try {
      const decodedToken = jwtDecode(token);
      
      // Check if token is expired
      if (decodedToken.exp * 1000 <= Date.now()) {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        return null;
      }

      return {
        token,
        user: {
          username,
          ...decodedToken.user
        }
      };
    } catch (error) {
      console.error('JWT token validation failed:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('username');
      return null;
    }
  }, []);

  // Function to refresh session
  const refreshSession = useCallback(async () => {
    try {
      if (session) {
        // For NextAuth sessions, use the built-in update function
        await update();
        return true;
      } else {
        // For JWT sessions, check token validity
        const jwtData = checkJWTToken();
        return !!jwtData;
      }
    } catch (error) {
      console.error('Session refresh failed:', error);
      return false;
    }
  }, [session, update, checkJWTToken]);

  // Main effect to handle authentication state
  useEffect(() => {
    const updateAuthState = () => {
      if (status === 'loading') {
        setAuthState(prev => ({ ...prev, loading: true }));
        return;
      }

      if (session && session.user) {
        // NextAuth session is active
        setAuthState({
          isAuthenticated: true,
          user: session.user,
          loading: false,
          authType: 'nextauth',
          lastCheck: new Date().toISOString()
        });
      } else {
        // Check for JWT token
        const jwtData = checkJWTToken();
        
        if (jwtData) {
          setAuthState({
            isAuthenticated: true,
            user: jwtData.user,
            loading: false,
            authType: 'jwt',
            lastCheck: new Date().toISOString()
          });
        } else {
          setAuthState({
            isAuthenticated: false,
            user: null,
            loading: false,
            authType: null,
            lastCheck: new Date().toISOString()
          });
        }
      }
    };

    updateAuthState();
  }, [session, status, checkJWTToken]);

  // Periodic session validation
  useEffect(() => {
    if (!authState.isAuthenticated || authState.loading) {
      return;
    }

    const interval = setInterval(async () => {
      const isValid = await refreshSession();
      
      if (!isValid) {
        setAuthState({
          isAuthenticated: false,
          user: null,
          loading: false,
          authType: null,
          lastCheck: new Date().toISOString()
        });
      }
    }, 5 * 60 * 1000); // Check every 5 minutes

    return () => clearInterval(interval);
  }, [authState.isAuthenticated, authState.loading, refreshSession]);

  return {
    ...authState,
    refreshSession,
    session: session || null,
    status
  };
}
