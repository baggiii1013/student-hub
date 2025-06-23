import { authenticateToken, createErrorResponse, createResponse } from '@/lib/auth';
import connectDB from '@/lib/dbConnection';
import User from '@/models/User';

export async function GET(request, { params }) {
  try {
    await connectDB();
    
    const { slug } = await params;
    
    // Find user by username (slug)
    const user = await User.findOne({ username: slug }).select('-password');
    
    if (!user) {
      return createErrorResponse('User not found', 404);
    }
    
    return createResponse({
      id: user._id,
      username: user.username,
      email: user.email,
      fullName: user.fullName || '',
      isOAuthUser: user.isOAuthUser || false,
      oauthProvider: user.oauthProvider || '',
      passwordSetupComplete: user.passwordSetupComplete || false,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    });

  } catch (error) {
    console.error('Get user profile error:', error);
    return createErrorResponse('Failed to get user profile', 500);
  }
}

export async function PUT(request, { params }) {
  try {
    await connectDB();

    const authResult = authenticateToken(request);
    if (!authResult.authenticated) {
      return createErrorResponse(authResult.error, 401);
    }

    const { slug } = await params;
    const userId = authResult.user.id;
    
    // Find the user to update
    const user = await User.findOne({ username: slug });
    
    if (!user) {
      return createErrorResponse('User not found', 404);
    }
    
    // Check if the logged-in user is trying to update their own profile
    if (user._id.toString() !== userId) {
      return createErrorResponse('You can only update your own profile', 403);
    }
    
    const profileData = await request.json();
    
    // Update allowed fields (only fields that exist in User model)
    const allowedUpdates = ['fullName', 'username', 'email'];
    
    const updates = {};
    allowedUpdates.forEach(field => {
      if (profileData[field] !== undefined) {
        updates[field] = profileData[field];
      }
    });
    
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updates,
      { new: true }
    ).select('-password');
    
    return createResponse({
      id: updatedUser._id,
      username: updatedUser.username,
      email: updatedUser.email,
      fullName: updatedUser.fullName,
      isOAuthUser: updatedUser.isOAuthUser,
      oauthProvider: updatedUser.oauthProvider,
      passwordSetupComplete: updatedUser.passwordSetupComplete,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt
    });

  } catch (error) {
    console.error('Update user profile error:', error);
    return createErrorResponse('Failed to update user profile', 500);
  }
}
