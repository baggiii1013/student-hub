import { authenticateToken, createErrorResponse, createResponse } from '@/lib/auth';

export async function GET(request) {
  try {
    // No database connection needed - just reading from JWT token
    const authResult = authenticateToken(request);
    if (!authResult.authenticated) {
      return createErrorResponse(authResult.error, 401);
    }

    return createResponse({
      username: authResult.user.username,
      email: authResult.user.email,
      id: authResult.user.id,
      role: authResult.user.role
    });

  } catch (error) {
    console.error('Current user error:', error);
    return createErrorResponse('Failed to get current user', 500);
  }
}
