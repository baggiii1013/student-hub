'use client';

import { SessionProvider } from 'next-auth/react';

export function NextAuthProvider({ children }) {
  return (
    <SessionProvider 
      refetchInterval={5 * 60} // Refetch session every 5 minutes
      refetchOnWindowFocus={true} // Refetch when window gets focus
      refetchWhenOffline={false} // Don't refetch when offline
    >
      {children}
    </SessionProvider>
  );
}
