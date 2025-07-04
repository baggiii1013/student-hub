'use client';

import { signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'loading') {
      setLoading(true);
      return;
    }

    if (session && session.user) {
      // User is authenticated via NextAuth
      setUser({
        id: session.user.id,
        username: session.user.username,
        email: session.user.email,
        fullName: session.user.fullName,
        isOAuthUser: session.user.isOAuthUser,
        passwordSetupComplete: session.user.passwordSetupComplete,
        role : session.user.role
      });
      setLoading(false);
    } else {
      // Check for legacy JWT token authentication
      const token = localStorage.getItem('token');
      const username = localStorage.getItem('username');
      
      if (token && username) {
        try {
          // Decode JWT token to get full user information
          const tokenPayload = JSON.parse(atob(token.split('.')[1]));
          const userInfo = tokenPayload.user;
          
          // Check if token is still valid (not expired)
          const currentTime = Date.now() / 1000;
          if (tokenPayload.exp && tokenPayload.exp > currentTime) {
            setUser({
              id: userInfo.id,
              username: userInfo.username,
              email: userInfo.email,
              role: userInfo.role,
              token
            });
          } else {
            // Token expired, clear it
            localStorage.removeItem('token');
            localStorage.removeItem('username');
          }
        } catch (error) {
          console.error('Error decoding stored JWT token:', error);
          // Fallback to basic user info if token can't be decoded
          setUser({ username, token });
        }
      }
      setLoading(false);
    }
  }, [session, status]);

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
      console.error('Error decoding JWT token:', error);
      // Fallback to basic user info
      localStorage.setItem('token', token);
      localStorage.setItem('username', username);
      setUser({ username, token });
    }
    router.push('/');
  };

  const logout = async () => {
    if (session) {
      // Sign out from NextAuth
      await signOut({ callbackUrl: '/login' });
    } else {
      // Legacy logout
      localStorage.removeItem('token');
      localStorage.removeItem('username');
      setUser(null);
      router.push('/login');
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
