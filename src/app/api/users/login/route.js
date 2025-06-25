import { createErrorResponse, createResponse } from '@/lib/auth';
import connectDB from '@/lib/dbConnection';
import User from '@/models/User';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export async function POST(request) {
  try {
    await connectDB();

    const { email, password } = await request.json();

    // Validation
    if (!email || !password) {
      return createErrorResponse('All fields are mandatory!', 400);
    }

    // Check if email is from the required domain
    if (!email.endsWith('@paruluniversity.ac.in')) {
      return createErrorResponse('Access denied: Only @paruluniversity.ac.in email addresses are allowed', 403);
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return createErrorResponse('Invalid email or password', 401);
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return createErrorResponse('Invalid email or password', 401);
    }

    // Generate JWT token
    const accessToken = jwt.sign(
      {
        user: {
          username: user.username,
          email: user.email,
          id: user._id,
          role: user.role
        },
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "240m"
      }
    );

    return createResponse({
      success: true,
      error: false,
      message: "Login successful",
      accessToken,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return createErrorResponse('Login failed', 500);
  }
}
