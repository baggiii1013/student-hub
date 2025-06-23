import jwt from 'jsonwebtoken';
import { getServerSession } from 'next-auth';

export async function authenticateRequest(request, authOptions) {
  try {
    console.log('Authenticating request...');
    
    // For API routes in App Router, try session authentication first
    try {
      // In Next.js 15, getServerSession works directly in API routes without needing cookies
      const session = await getServerSession(authOptions);
      console.log('Session check result:', session ? 'found' : 'not found');
      
      if (session && session.user) {
        console.log('Session user found:', session.user.email);
        return { 
          authenticated: true, 
          user: {
            id: session.user.id,
            username: session.user.username,
            email: session.user.email
          },
          authType: 'session'
        };
      }
    } catch (sessionError) {
      console.log('Session authentication failed:', sessionError.message);
    }

    console.log('No session found, trying JWT...');
    
    // Fallback to JWT token authentication
    const authHeader = request.headers.get('authorization');
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      console.log('No JWT token found');
      return { authenticated: false, error: 'No authentication provided' };
    }

    console.log('Verifying JWT token...');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return { 
      authenticated: true, 
      user: decoded.user,
      authType: 'jwt'
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return { authenticated: false, error: 'Authentication failed' };
  }
}

// Legacy function for backward compatibility
export function authenticateToken(request) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return { authenticated: false, error: 'No token provided' };
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return { authenticated: true, user: decoded.user };
  } catch (error) {
    return { authenticated: false, error: 'Invalid token' };
  }
}

export function createResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

export function createErrorResponse(message, status = 400) {
  return createResponse({
    success: false,
    error: true,
    message
  }, status);
}
