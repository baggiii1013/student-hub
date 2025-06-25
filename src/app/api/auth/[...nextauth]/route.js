import connectDB from '@/lib/dbConnection';
import User from '@/models/User';
import { MongoDBAdapter } from '@auth/mongodb-adapter';
import { MongoClient } from 'mongodb';
import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

const client = new MongoClient(process.env.MONGODB_URI);
const clientPromise = client.connect();

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
      console.log('SignIn callback triggered', { user: user.email, provider: account?.provider });
      
      if (account?.provider === 'google') {
        // Check if email is from the required domain
        if (!user.email.endsWith('@paruluniversity.ac.in')) {
          console.log('Access denied: Email not from paruluniversity.ac.in domain:', user.email);
          return false; // Reject sign-in
        }
        
        try {
          console.log('Connecting to database...');
          await connectDB();
          console.log('Database connected successfully');
          
          // Check if user already exists in our User model
          const existingUser = await User.findOne({ email: user.email });
          
          if (!existingUser) {
            console.log('New Google user, creating temporary OAuth user for', user.email);
            // Create a temporary OAuth user that needs setup completion
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
              console.log('Temporary OAuth user created for setup:', newUser._id);
            } catch (dbError) {
              console.error('Error creating temporary OAuth user:', dbError);
              // Continue anyway to allow the OAuth flow
            }
            return true;
          } else {
            console.log('Existing user found:', existingUser.email, 'Setup complete:', existingUser.passwordSetupComplete);
            
            // If user exists but is OAuth and hasn't completed setup, allow sign-in for setup completion
            if (existingUser.isOAuthUser && !existingUser.passwordSetupComplete) {
              console.log('OAuth user needs to complete setup');
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
      console.log('JWT callback triggered', { hasUser: !!user, hasAccount: !!account, email: token.email });
      
      if (account && user) {
        try {
          console.log('JWT callback - connecting to database...');
          const connectPromise = connectDB();
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Database connection timeout')), 5000)
          );
          
          await Promise.race([connectPromise, timeoutPromise]);
          console.log('JWT callback - database connected');
          
          const dbUser = await User.findOne({ email: user.email });
          
          if (dbUser) {
            console.log('Adding user data to token:', dbUser.email);
            token.user = {
              id: dbUser._id.toString(),
              username: dbUser.username,
              email: dbUser.email,
              fullName: dbUser.fullName,
              isOAuthUser: dbUser.isOAuthUser,
              passwordSetupComplete: dbUser.passwordSetupComplete
            };
          } else {
            console.log('User not found in database during JWT callback');
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
      console.log('Session callback triggered');
      
      if (token.user) {
        session.user = token.user;
        console.log('Session user set:', session.user.email);
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
      console.log('User signed in:', { email: user.email, isNewUser, provider: account?.provider });
      
      // If it's a Google sign-in attempt but user doesn't exist, we need to redirect to register
      if (account?.provider === 'google') {
        try {
          await connectDB();
          const existingUser = await User.findOne({ email: user.email });
          if (!existingUser) {
            // This won't actually execute because the signIn callback will block it
            // But it's here for completeness
            console.log('User not registered, should redirect to register page');
          }
        } catch (error) {
          console.error('Error in signIn event:', error);
        }
      }
    },
    async signOut({ session, token }) {
      console.log('User signed out:', { email: session?.user?.email });
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
        console.log('NextAuth Debug:', code, metadata);
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

