import { createErrorResponse, createResponse } from '@/lib/auth';
import connectDB from '@/lib/dbConnection';
import User from '@/models/User';
import bcrypt from 'bcrypt';

export async function POST(request) {
  try {
    await connectDB();

    const { email, username, password } = await request.json();

    // Validation
    if (!email || !username || !password) {
      return createErrorResponse('Email, username, and password are required!', 400);
    }

    // Password strength validation
    if (password.length < 6) {
      return createErrorResponse('Password must be at least 6 characters long', 400);
    }

    // Find the OAuth user by email
    const user = await User.findOne({ 
      email, 
      isOAuthUser: true, 
      passwordSetupComplete: false 
    });

    if (!user) {
      return createErrorResponse('User not found or setup already completed', 404);
    }

    // Check if username is already taken (excluding the current user)
    const existingUsernameUser = await User.findOne({ 
      username, 
      _id: { $ne: user._id } 
    });
    
    if (existingUsernameUser) {
      return createErrorResponse('Username already taken', 400);
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update the user with new username and password
    user.username = username;
    user.password = hashedPassword;
    user.passwordSetupComplete = true;
    user.bio = 'Google OAuth user'; // Update bio

    await user.save();

    return createResponse({
      success: true,
      error: false,
      message: "Account setup completed successfully",
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName
      }
    }, 200);

  } catch (error) {
    console.error('Setup completion error:', error);
    return createErrorResponse('Setup completion failed', 500);
  }
}
