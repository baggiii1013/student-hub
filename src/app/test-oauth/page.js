// Test Google OAuth configuration
'use client';

import { signIn, useSession } from 'next-auth/react';
import { useEffect } from 'react';

export default function TestOAuth() {
  const { data: session, status } = useSession();

  useEffect(() => {
    console.log('Session status:', status);
    console.log('Session data:', session);
  }, [session, status]);

  const handleTestGoogleSignIn = async () => {
    console.log('Attempting Google sign-in...');
    try {
      const result = await signIn('google', {
        redirect: false,
        callbackUrl: '/test-oauth'
      });
      console.log('Sign-in result:', result);
    } catch (error) {
      console.error('Sign-in error:', error);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">OAuth Test Page</h1>
      <div className="mb-4">
        <p><strong>Status:</strong> {status}</p>
        <p><strong>User:</strong> {session?.user?.email || 'Not signed in'}</p>
      </div>
      <button
        onClick={handleTestGoogleSignIn}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        Test Google Sign-In
      </button>
      <div className="mt-4">
        <h2 className="font-bold">Session Data:</h2>
        <pre className="bg-gray-100 p-2 mt-2 text-xs overflow-auto">
          {JSON.stringify(session, null, 2)}
        </pre>
      </div>
    </div>
  );
}
