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
      fullName: user.fullName || user.username.charAt(0).toUpperCase() + user.username.slice(1).replace('-', ' '),
      ugNumber: user.ugNumber || 'Not specified',
      course: user.course || 'Not specified',
      year: user.year || 'Not specified',
      department: user.department || 'Not specified',
      phone: user.phone || 'Not provided',
      bio: user.bio || 'Student at the university.',
      interests: user.interests || 'Not specified',
      skills: user.skills || 'Not specified',
      socialLinks: user.socialLinks || { github: '', linkedin: '', twitter: '' }
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
    
    // Update allowed fields
    const allowedUpdates = [
      'fullName', 'ugNumber', 'course', 'year', 'department', 
      'phone', 'bio', 'interests', 'skills', 'socialLinks'
    ];
    
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
      ugNumber: updatedUser.ugNumber,
      course: updatedUser.course,
      year: updatedUser.year,
      department: updatedUser.department,
      phone: updatedUser.phone,
      bio: updatedUser.bio,
      interests: updatedUser.interests,
      skills: updatedUser.skills,
      socialLinks: updatedUser.socialLinks
    });

  } catch (error) {
    console.error('Update user profile error:', error);
    return createErrorResponse('Failed to update user profile', 500);
  }
}
