# Google OAuth Setup Instructions

Your Student Hub app now supports Google OAuth authentication! Users can sign up and sign in using their Google accounts. Here's how to complete the setup:

## 1. Create Google OAuth Credentials

### Step 1: Go to Google Cloud Console
1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Sign in with your Google account

### Step 2: Create or Select a Project
1. Click on the project dropdown at the top of the page
2. Either select an existing project or click "New Project"
3. If creating new: Enter a project name (e.g., "Student Hub") and click "Create"

### Step 3: Enable Google+ API
1. In the sidebar, go to "APIs & Services" > "Library"
2. Search for "Google+ API" or "Google People API"
3. Click on it and press "Enable"

### Step 4: Create OAuth 2.0 Credentials
1. Go to "APIs & Services" > "Credentials"
2. Click "+ CREATE CREDENTIALS" and select "OAuth 2.0 Client IDs"
3. If prompted, configure the OAuth consent screen first:
   - Choose "External" user type
   - Fill in the required fields:
     - App name: "Student Hub"
     - User support email: Your email
     - Developer contact: Your email
   - Add your domain if you have one, or skip for development
   - Add scopes: email, profile, openid
   - Save and continue

### Step 5: Configure OAuth Client
1. Select "Web application" as the application type
2. Name it "Student Hub Web Client"
3. Add Authorized JavaScript origins:
   - `http://localhost:3000` (for development)
   - Your production domain (when you deploy)
4. Add Authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (for development)
   - `https://yourdomain.com/api/auth/callback/google` (for production)
5. Click "Create"

### Step 6: Get Your Credentials
1. Copy the "Client ID" and "Client Secret"
2. You'll need these for your environment variables

## 2. Update Environment Variables

Open your `.env.local` file and update the Google OAuth credentials:

```bash
# Replace these with your actual Google OAuth credentials
GOOGLE_CLIENT_ID=your-actual-google-client-id-here
GOOGLE_CLIENT_SECRET=your-actual-google-client-secret-here
```

**Important:** 
- Replace `your-actual-google-client-id-here` with your actual Google Client ID
- Replace `your-actual-google-client-secret-here` with your actual Google Client Secret
- Never commit these credentials to version control
- Add `.env.local` to your `.gitignore` file

## 3. How OAuth Works in Your App

### For Users:
1. **Sign Up**: Users can click "Sign up with Google" on the registration page
2. **Sign In**: Users can click "Sign in with Google" on the login page
3. **Automatic Account Creation**: When a user signs in with Google for the first time, an account is automatically created in your database
4. **Profile Integration**: The user's Google profile information (name, email) is automatically populated

### For Developers:
1. **Dual Authentication**: Your app now supports both traditional email/password and Google OAuth
2. **Session Management**: NextAuth.js handles session management automatically
3. **Database Integration**: OAuth users are stored in your existing MongoDB User model
4. **Profile Pages**: OAuth users can access and edit their profiles just like regular users

## 4. Testing OAuth

1. Start your development server: `npm run dev`
2. Go to `http://localhost:3000/login` or `http://localhost:3000/register`
3. Click "Sign in with Google" or "Sign up with Google"
4. You should be redirected to Google's OAuth consent screen
5. After granting permission, you'll be redirected back to your app and logged in

## 5. Production Deployment

When deploying to production:

1. Update your Google OAuth settings:
   - Add your production domain to authorized origins
   - Add your production callback URL
2. Update your environment variables:
   - Set `NEXTAUTH_URL` to your production URL
   - Keep your Google credentials the same
3. Ensure your database connection works in production

## 6. Features Added

✅ **Google OAuth Integration**: Users can sign up/in with Google  
✅ **Automatic Account Creation**: Google users get accounts automatically  
✅ **Profile Integration**: Google profile data is imported  
✅ **Session Management**: Secure session handling with NextAuth.js  
✅ **Beautiful UI**: Google sign-in buttons with proper styling  
✅ **Dual Authentication**: Supports both OAuth and traditional login  

## 7. Security Features

- **Secure Session Management**: NextAuth.js handles secure JWT tokens
- **CSRF Protection**: Built-in CSRF protection
- **Secure Callbacks**: Properly configured OAuth callbacks
- **Environment Variables**: Sensitive data stored securely

## 8. Troubleshooting

### Common Issues:

1. **"Error 400: redirect_uri_mismatch"**
   - Check that your redirect URI in Google Console matches exactly: `http://localhost:3000/api/auth/callback/google`

2. **"This app isn't verified"**
   - Normal for development. Click "Advanced" → "Go to Student Hub (unsafe)" for testing

3. **"Google sign-in failed"**
   - Check that your Client ID and Client Secret are correct
   - Ensure Google+ API is enabled
   - Check console for detailed error messages

4. **Users not being created in database**
   - Check your MongoDB connection
   - Verify the User model is properly imported
   - Check server logs for database errors

### Need Help?

- Check the browser console for error messages
- Check the server terminal for backend errors
- Verify all environment variables are set correctly
- Ensure your MongoDB connection is working

Your Student Hub app now has full Google OAuth support! Users can seamlessly sign up and sign in using their Google accounts. 🎉
