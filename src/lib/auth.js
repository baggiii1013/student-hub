import jwt from 'jsonwebtoken';

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
