import connectDB from '@/lib/dbConnection';
import User from '@/models/User';
import { MongoDBAdapter } from '@auth/mongodb-adapter';
import { MongoClient } from 'mongodb';
import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

const client = new MongoClient(process.env.MONGODB_URI, {
  ssl: true,
  serverSelectionTimeoutMS: 10000, // Reduced timeout for faster auth
  connectTimeoutMS: 10000,
  socketTimeoutMS: 20000,
  retryWrites: true,
  maxPoolSize: 20, // Increased pool size for auth operations
  minPoolSize: 2,
  maxIdleTimeMS: 15000, // Shorter idle time
  waitQueueTimeoutMS: 5000,
  heartbeatFrequencyMS: 5000, // More frequent heartbeats
  compressors: [], // Disable compression for auth speed
});
const clientPromise = client.connect();

// Utility function to check if email is a student email (13-digit number before @)
function isStudentEmail(email) {
  const emailParts = email.split('@');
  if (emailParts.length !== 2 || emailParts[1] !== 'paruluniversity.ac.in') {
    return false;
  }
  
  const prefix = emailParts[0];
  // Check if prefix is exactly 13 digits
  return /^\d{13}$/.test(prefix);
}

// Utility function to handle database connection for NextAuth callbacks
async function withDBConnection(callback) {
  let retries = 3;
  let lastError;
  
  while (retries > 0) {
    try {
      await connectDB();
      return await callback();
    } catch (error) {
      lastError = error;
      retries--;
      
      console.error(`Database connection error in NextAuth (retries left: ${retries}):`, error);        // If it's an SSL/TLS error, wait a bit before retrying
        if (error.message.includes('SSL') || error.message.includes('TLS') || error.message.includes('ssl3_read_bytes')) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
        // If no retries left, throw the error
        if (retries === 0) {
          throw error;
        }
    }
  }
  
  throw lastError;
}

const authOptions = {
  adapter: MongoDBAdapter(clientPromise),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      httpOptions: {
        timeout: 15000, // 15 seconds timeout
      },
      authorization: {
        params: {
          scope: 'openid email profile',
          prompt: 'select_account',
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      
      if (account?.provider === 'google') {
        // Check if email is from the required domain
        if (!user.email.endsWith('@paruluniversity.ac.in')) {
          return false; // Reject sign-in
        }
        
        // Check if this is a student email (13-digit number before @)
        const isStudent = isStudentEmail(user.email);
        
        try {
          return await withDBConnection(async () => {
            // Check if user already exists in our User model
          const existingUser = await User.findOne({ email: user.email });
          
          if (!existingUser) {
            // For student emails, reject registration - they can only login if they exist
            if (isStudent) {
              return '/login?error=StudentAccountNotFound&message=' + encodeURIComponent(
                'Student accounts cannot be registered through this page. If you should have access, please contact the administrator.'
              );
            }
            
            // For non-student emails (faculty/staff), allow registration
            try {
              const newUser = new User({
                username: user.email.split('@')[0] + '_temp_' + Date.now(), // Temporary unique username
                email: user.email,
                fullName: user.name,
                isOAuthUser: true,
                oauthProvider: 'google',
                passwordSetupComplete: false
                // No password required since isOAuthUser=true and passwordSetupComplete=false
              });
              
              await newUser.save();
            } catch (dbError) {
              console.error('Error creating temporary OAuth user:', dbError);
              // Continue anyway to allow the OAuth flow
            }
            return true;
          } else {
            
            // If user exists but is OAuth and hasn't completed setup, allow sign-in for setup completion
            if (existingUser.isOAuthUser && !existingUser.passwordSetupComplete) {
              return true;
            }
            
            // If user exists and has completed setup (either OAuth or regular), allow sign-in
            if (existingUser.passwordSetupComplete || !existingUser.isOAuthUser) {
              return true;
            }
            
            return true;
          }
          });
        } catch (error) {
          console.error('Error during sign in:', error);
          
          // If it's a database connection error, still allow OAuth sign-in
          // The user data will be handled when the database is available again
          if (error.message.includes('SSL') || error.message.includes('TLS') || 
              error.message.includes('MongoServerSelectionError') || 
              error.message.includes('MongoNetworkError')) {
            return true;
          }
          
          // Allow sign-in even if our custom logic fails to prevent blocking users
          return true;
        }
      }
      
      return true;
    },
    async jwt({ token, user, account }) {
      
      if (account && user) {
        try {
          await withDBConnection(async () => {
            const dbUser = await User.findOne({ email: user.email });
          
            if (dbUser) {
              token.user = {
                id: dbUser._id.toString(),
                username: dbUser.username,
                email: dbUser.email,
                fullName: dbUser.fullName,
                isOAuthUser: dbUser.isOAuthUser,
                passwordSetupComplete: dbUser.passwordSetupComplete,
                role: dbUser.role
              };
            } else {
              // If user doesn't exist in database, create a minimal token
              // This handles cases where the database was unavailable during sign-in
              token.user = {
                id: user.id || user.email, // Use email as fallback ID
                username: user.email.split('@')[0],
                email: user.email,
                fullName: user.name,
                isOAuthUser: true,
                passwordSetupComplete: false,
                role: 'student' // Default role
              };
            }
          });
        } catch (error) {
          console.error('Error in JWT callback:', error);
          
          // If it's a database connection error, create a minimal token to allow sign-in
          if (error.message.includes('SSL') || error.message.includes('TLS') || 
              error.message.includes('MongoServerSelectionError') || 
              error.message.includes('MongoNetworkError')) {
            token.user = {
              id: user.id || user.email,
              username: user.email.split('@')[0],
              email: user.email,
              fullName: user.name,
              isOAuthUser: true,
              passwordSetupComplete: false,
              role: 'student'
            };
          } else {
            // For other errors, return null to prevent token creation
            return null;
          }
        }
      }
      
      return token;
    },
    async session({ session, token }) {
      
      if (token.user) {
        session.user = token.user;
      }
      
      return session;
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // Update session every 24 hours
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  events: {
    async signIn({ user, account, profile, isNewUser }) {
      
      // If it's a Google sign-in attempt but user doesn't exist, we need to redirect to register
      if (account?.provider === 'google') {
        try {
          await withDBConnection(async () => {
            const existingUser = await User.findOne({ email: user.email });
            if (!existingUser) {
              // This won't actually execute because the signIn callback will block it
              // But it's here for completeness
            }
          });
        } catch (error) {
          console.error('Error in signIn event:', error);
        }
      }
    },
    async signOut({ session, token }) {
    },
  },
  debug: process.env.NODE_ENV === 'development',
  logger: {
    error(code, metadata) {
      console.error('NextAuth Error:', code, metadata);
      if (code === 'OAUTH_CALLBACK_ERROR') {
        console.error('OAuth Callback Error Details:', metadata.error);
      }
    },
    warn(code) {
      console.warn('NextAuth Warning:', code);
    },
    debug(code, metadata) {
      if (process.env.NODE_ENV === 'development') {
      }
    }
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 30 * 24 * 60 * 60 // 30 days
      }
    },
    callbackUrl: {
      name: `next-auth.callback-url`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production'
      }
    },
    csrfToken: {
      name: `next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production'
      }
    }
  }
};

const handler = NextAuth(authOptions);

export { authOptions, handler as GET, handler as POST };

