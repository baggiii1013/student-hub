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
        try {
          console.log('Connecting to database...');
          await connectDB();
          console.log('Database connected successfully');
          
          // Check if user already exists in our User model
          const existingUser = await User.findOne({ email: user.email });
          
          if (!existingUser) {
            console.log('Creating new OAuth user for', user.email);
            // Create a new user in our User model
            const newUser = new User({
              username: user.email.split('@')[0] + '_temp', // Temporary username
              email: user.email,
              fullName: user.name,
              isOAuthUser: true,
              oauthProvider: 'google',
              passwordSetupComplete: false
            });
            
            const savedUser = await newUser.save();
            console.log('New OAuth user created successfully:', savedUser._id);
          } else {
            console.log('Existing user found:', existingUser.email, 'Setup complete:', existingUser.passwordSetupComplete);
            if (existingUser.isOAuthUser && !existingUser.passwordSetupComplete) {
              // User exists but hasn't completed password setup
              // We'll handle the redirect in the frontend based on session data
              console.log('User needs to complete setup');
            }
          }
          
          return true;
        } catch (error) {
          console.error('Error during sign in:', error);
          console.error('Error stack:', error.stack);
          // Still allow sign in even if our custom logic fails
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
            console.log('User not found in database, using OAuth data');
            token.user = {
              id: user.id,
              username: user.email.split('@')[0],
              email: user.email,
              fullName: user.name,
              isOAuthUser: true,
              passwordSetupComplete: false
            };
          }
        } catch (error) {
          console.error('Error in JWT callback:', error);
          // Fallback to basic user data
          token.user = {
            id: user.id,
            username: user.email?.split('@')[0] || 'user',
            email: user.email,
            fullName: user.name,
            isOAuthUser: true,
            passwordSetupComplete: false
          };
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

