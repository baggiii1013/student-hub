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
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log('SignIn callback triggered', { user: user.email, provider: account?.provider });
      
      if (account?.provider === 'google') {
        try {
          await connectDB();
          
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
            
            await newUser.save();
            console.log('New OAuth user created successfully');
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
          return false;
        }
      }
      
      return true;
    },
    async jwt({ token, user, account }) {
      console.log('JWT callback triggered', { hasUser: !!user, hasAccount: !!account });
      
      if (account && user) {
        try {
          await connectDB();
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
          }
        } catch (error) {
          console.error('Error in JWT callback:', error);
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
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  debug: process.env.NODE_ENV === 'development',
  logger: {
    error(code, metadata) {
      console.error('NextAuth Error:', code, metadata);
    },
    warn(code) {
      console.warn('NextAuth Warning:', code);
    },
    debug(code, metadata) {
      console.log('NextAuth Debug:', code, metadata);
    }
  }
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
