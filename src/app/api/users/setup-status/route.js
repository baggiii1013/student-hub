import { createErrorResponse, createResponse } from '@/lib/auth';
import connectDB from '@/lib/dbConnection';
import User from '@/models/User';

export async function GET(request) {
  try {
    await connectDB();

    const url = new URL(request.url);
    const email = url.searchParams.get('email');

    if (!email) {
      return createErrorResponse('Email parameter is required', 400);
    }

    const user = await User.findOne({ email });

    if (!user) {
      return createErrorResponse('User not found', 404);
    }

    return createResponse({
      success: true,
      setupComplete: user.passwordSetupComplete || false,
      isOAuthUser: user.isOAuthUser || false,
      hasPassword: !!user.password,
      username: user.username
    }, 200);

  } catch (error) {
    console.error('Setup status check error:', error);
    return createErrorResponse('Failed to check setup status', 500);
  }
}
