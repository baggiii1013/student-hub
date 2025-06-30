import connectDB from '@/lib/dbConnection';
import User from '@/models/User';
import { MongoDBAdapter } from '@auth/mongodb-adapter';
import { MongoClient } from 'mongodb';
import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

const client = new MongoClient(process.env.MONGODB_URI);
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
          await connectDB();
          
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
        } catch (error) {
          console.error('Error during sign in:', error);
          console.error('Error stack:', error.stack);
          // Allow sign-in even if our custom logic fails to prevent blocking users
          return true;
        }
      }
      
      return true;
    },
    async jwt({ token, user, account }) {
      
      if (account && user) {
        try {
          const connectPromise = connectDB();
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Database connection timeout')), 5000)
          );
          
          await Promise.race([connectPromise, timeoutPromise]);
          
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
            // Don't create a token for non-registered users
            return null;
          }
        } catch (error) {
          console.error('Error in JWT callback:', error);
          // Return null to prevent token creation on database errors
          return null;
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
          await connectDB();
          const existingUser = await User.findOne({ email: user.email });
          if (!existingUser) {
            // This won't actually execute because the signIn callback will block it
            // But it's here for completeness
          }
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
        secure: process.env.NODE_ENV === 'production'
      }
    },
  }
};

const handler = NextAuth(authOptions);

export { authOptions, handler as GET, handler as POST };

