import { authenticateRequest, createErrorResponse, createResponse } from '@/lib/auth';
import withDatabase from '@/lib/withDatabase';
import User from '@/models/User';
import bcrypt from 'bcrypt';
import { authOptions } from '../../auth/[...nextauth]/route.js';

// Get all users (Super Admin only)
async function getUsers(request) {
  try {
    // Database connection is already established by withDatabase wrapper

    // Check authorization using the unified authentication method
    const authResult = await authenticateRequest(request, authOptions);
    
    if (!authResult.authenticated) {
      return createErrorResponse(authResult.error, 401);
    }

    // Verify user exists and is super admin
    const user = await User.findById(authResult.user.id);
    if (!user || user.role !== 'superAdmin') {
      return createErrorResponse('Access denied: Super Admin role required', 403);
    }

    // Get all users with pagination
    const page = parseInt(request.nextUrl.searchParams.get('page')) || 1;
    const limit = parseInt(request.nextUrl.searchParams.get('limit')) || 10;
    const skip = (page - 1) * limit;

    const users = await User.find({})
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments();

    return createResponse({
      success: true,
      data: users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get users error:', error);
    return createErrorResponse('Failed to fetch users', 500);
  }
}

// Update user role (Super Admin only)
async function updateUser(request) {
  try {
    // Database connection is already established by withDatabase wrapper

    // Check authorization using the unified authentication method
    const authResult = await authenticateRequest(request, authOptions);
    
    if (!authResult.authenticated) {
      return createErrorResponse(authResult.error, 401);
    }

    // Verify user exists and is super admin
    const adminUser = await User.findById(authResult.user.id);
    if (!adminUser || adminUser.role !== 'superAdmin') {
      return createErrorResponse('Access denied: Super Admin role required', 403);
    }

    const { userId, role } = await request.json();

    if (!userId || !role) {
      return createErrorResponse('User ID and role are required', 400);
    }

    if (!['user', 'admin', 'superAdmin'].includes(role)) {
      return createErrorResponse('Invalid role', 400);
    }

    // Prevent self-demotion
    if (userId === authResult.user.id && role !== 'superAdmin') {
      return createErrorResponse('Cannot change your own role', 400);
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return createErrorResponse('User not found', 404);
    }

    return createResponse({
      success: true,
      message: 'User role updated successfully',
      data: updatedUser
    });

  } catch (error) {
    console.error('Update user error:', error);
    return createErrorResponse('Failed to update user', 500);
  }
}

// Delete user (Super Admin only)
async function deleteUser(request) {
  try {
    // Database connection is already established by withDatabase wrapper

    // Check authorization using the unified authentication method
    const authResult = await authenticateRequest(request, authOptions);
    
    if (!authResult.authenticated) {
      return createErrorResponse(authResult.error, 401);
    }

    // Verify user exists and is super admin
    const adminUser = await User.findById(authResult.user.id);
    if (!adminUser || adminUser.role !== 'superAdmin') {
      return createErrorResponse('Access denied: Super Admin role required', 403);
    }

    const { userId } = await request.json();

    if (!userId) {
      return createErrorResponse('User ID is required', 400);
    }

    // Prevent self-deletion
    if (userId === authResult.user.id) {
      return createErrorResponse('Cannot delete your own account', 400);
    }

    const deletedUser = await User.findByIdAndDelete(userId);

    if (!deletedUser) {
      return createErrorResponse('User not found', 404);
    }

    return createResponse({
      success: true,
      message: 'User deleted successfully',
      data: { id: deletedUser._id, username: deletedUser.username }
    });

  } catch (error) {
    console.error('Delete user error:', error);
    return createErrorResponse('Failed to delete user', 500);
  }
}

// Create new user (Super Admin only)
async function createUser(request) {
  try {
    // Database connection is already established by withDatabase wrapper

    // Check authorization using the unified authentication method
    const authResult = await authenticateRequest(request, authOptions);
    
    if (!authResult.authenticated) {
      return createErrorResponse(authResult.error, 401);
    }

    // Verify user exists and is super admin
    const adminUser = await User.findById(authResult.user.id);
    if (!adminUser || adminUser.role !== 'superAdmin') {
      return createErrorResponse('Access denied: Super Admin role required', 403);
    }

    const { username, email, password, fullName, role = 'user' } = await request.json();

    // Validation
    if (!username || !email || !password) {
      return createErrorResponse('Username, email, and password are required', 400);
    }

    // Check if email is from the required domain
    if (!email.endsWith('@paruluniversity.ac.in')) {
      return createErrorResponse('Access denied: Only @paruluniversity.ac.in email addresses are allowed', 400);
    }

    // Validate role
    if (!['user', 'admin', 'superAdmin'].includes(role)) {
      return createErrorResponse('Invalid role', 400);
    }

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });

    if (existingUser) {
      return createErrorResponse('User with this email or username already exists', 400);
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new user
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      fullName,
      role,
      isOAuthUser: false,
      passwordSetupComplete: true
    });

    await newUser.save();

    // Return user without password
    const userResponse = newUser.toObject();
    delete userResponse.password;

    return createResponse({
      success: true,
      message: 'User created successfully',
      data: userResponse
    }, 201);

  } catch (error) {
    console.error('Create user error:', error);
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return createErrorResponse(`User with this ${field} already exists`, 400);
    }
    
    return createErrorResponse('Failed to create user', 500);
  }
}

// Export the wrapped functions
export const GET = withDatabase(getUsers);
export const POST = withDatabase(createUser);
export const PUT = withDatabase(updateUser);
export const DELETE = withDatabase(deleteUser);
