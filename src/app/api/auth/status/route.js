import { getServerSession } from 'next-auth';
import { authOptions } from '../[...nextauth]/route';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    const response = {
      isAuthenticated: !!session,
      user: session?.user || null,
      timestamp: new Date().toISOString(),
      sessionExpiry: session ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : null
    };

    return new Response(
      JSON.stringify(response),
      { 
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Pragma': 'no-cache'
        }
      }
    );
  } catch (error) {
    console.error('Session status check error:', error);
    
    return new Response(
      JSON.stringify({ 
        isAuthenticated: false,
        user: null,
        error: 'Session status check failed',
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
