'use client';

import { useAuth } from '@/contexts/AuthContext';
import { authAPI } from '@/lib/api';
import { signIn, useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';

export default function Register() {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState(1); // 1: Google auth, 2: Set password
  const [userEmail, setUserEmail] = useState('');
  
  const { login } = useAuth();
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    setTimeout(() => setMounted(true), 100);
    
    // Check if user came from OAuth and needs to complete setup
    const stepParam = searchParams.get('step');
    const emailParam = searchParams.get('email');
    
    if (stepParam === '2' && emailParam) {
      setStep(2);
      setUserEmail(decodeURIComponent(emailParam));
      toast.info('Please complete your account setup by choosing a username and password.');
    }
  }, [searchParams]);

  useEffect(() => {
    // Handle OAuth callback - check if user completed OAuth but needs password setup
    if (session && session.user && !userEmail) {
      // Check if this user needs to complete setup
      if (session.user.isOAuthUser && !session.user.passwordSetupComplete) {
        setUserEmail(session.user.email);
        setStep(2);
        toast.info('Please complete your account setup by choosing a username and password.');
      } else if (session.user.passwordSetupComplete) {
        // User is fully set up, redirect to home
        router.push('/');
      }
    }
  }, [session, userEmail, router]);

  const checkUserSetupStatus = async (email) => {
    try {
      // You could call an API to check if user setup is complete
      // For now, we'll assume any OAuth user without a password needs setup
      setUserEmail(email);
      setStep(2);
      toast.info('Please complete your account setup by choosing a username and password.');
    } catch (error) {
      console.error('Error checking user setup status:', error);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleGoogleSignIn = async () => {
    try {
      setGoogleLoading(true);
      
      console.log('Starting Google sign-in process...');
      
      // Test the providers first
      const providers = await fetch('/api/auth/providers').then(r => r.json());
      console.log('Available providers:', providers);
      
      if (!providers.google) {
        throw new Error('Google provider not available');
      }
      
      console.log('Calling signIn with google provider...');
      const result = await signIn('google', {
        redirect: false,
        callbackUrl: '/register'
      });

      console.log('Sign-in result:', result);

      if (result?.error) {
        console.error('Sign-in error details:', result.error);
        toast.error(`Google sign-up failed: ${result.error}`);
      } else if (result?.ok) {
        console.log('Sign-in successful, waiting for session update...');
        toast.success('Google account connected successfully!');
        // The useEffect will handle setting step 2 when session updates
      } else {
        console.log('Unexpected result:', result);
        toast.error('Unexpected response from Google sign-in');
      }
    } catch (error) {
      console.error('Google sign-up error:', error);
      toast.error(`Google sign-up failed: ${error.message}`);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Basic validation
    if (!formData.username || !formData.password || !formData.confirmPassword) {
      toast.error('Please fill in all fields');
      setLoading(false);
      return;
    }

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      setLoading(false);
      return;
    }

    // Validate password length
    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    // Validate username (no spaces, special characters, minimum length)
    const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
    if (!usernameRegex.test(formData.username)) {
      toast.error('Username must be 3-20 characters long and contain only letters, numbers, hyphens, and underscores');
      setLoading(false);
      return;
    }

    try {
      const setupData = {
        username: formData.username,
        email: userEmail,
        password: formData.password
      };
      
      await authAPI.completeOAuthSetup(setupData);
      
      toast.success('Account setup completed successfully! You can now sign in.');
      
      // Redirect to login page
      router.push('/login?message=setup-complete');
      
    } catch (error) {
      console.error('Setup completion error:', error);
      if (error.message.includes('Username already taken')) {
        toast.error('This username is already taken. Please choose a different username.');
      } else if (error.message.includes('User not found')) {
        toast.error('Session expired. Please start the registration process again.');
        setStep(1);
        setUserEmail('');
      } else {
        toast.error(error.message || 'Setup completion failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStartOver = () => {
    setStep(1);
    setUserEmail('');
    setFormData({ username: '', password: '', confirmPassword: '' });
    // Clear URL parameters
    router.push('/register');
    toast.info('Starting over. Please authenticate with Google again.');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -inset-10 opacity-50">
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
          <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-1/3 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
        </div>
      </div>
      
      <div className="relative z-10 w-full max-w-md px-3 sm:px-4 md:px-6">
        <div className={`transform transition-all duration-1000 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          {/* Logo/Title */}
          <div className="text-center mb-4 sm:mb-6 md:mb-8">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
              Student Hub
            </h1>
            <p className="text-gray-300 text-xs sm:text-sm md:text-base">
              {step === 1 
                ? "Join our community! Sign up with Google to get started." 
                : "Complete your account setup by choosing a username and password."
              }
            </p>
          </div>

          {/* Register Form */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl sm:rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative bg-gray-800/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 border border-gray-700">
              
              {step === 1 ? (
                // Step 1: Google Authentication
                <div className="space-y-4 sm:space-y-6">
                  <div className="text-center mb-6">
                    <p className="text-gray-300 text-sm mb-4">
                      We use Google authentication for security. After connecting your Google account, you'll be required to set up your own password for additional security.
                    </p>
                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 mb-4">
                      <p className="text-yellow-400 text-xs sm:text-sm font-medium">
                        ⚠️ Password Required: You must create your own password after Google authentication
                      </p>
                    </div>
                  </div>

                  {/* Google Sign-Up Button */}
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={googleLoading}
                    className="w-full bg-white text-gray-900 font-semibold py-3 sm:py-3.5 md:py-4 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base md:text-lg min-h-[48px] flex items-center justify-center gap-3"
                  >
                    {googleLoading ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-sm sm:text-base">Connecting with Google...</span>
                      </div>
                    ) : (
                      <>
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        Continue with Google
                      </>
                    )}
                  </button>

                  <div className="text-center">
                    <p className="text-gray-400 text-xs sm:text-sm">
                      Already have an account?{' '}
                      <Link href="/login" className="text-purple-400 hover:text-purple-300 font-medium hover:underline transition-colors">
                        Sign in here
                      </Link>
                    </p>
                  </div>
                </div>
              ) : (
                // Step 2: Set Username and Password (REQUIRED)
                <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4 md:space-y-6">
                  {userEmail && (
                    <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 sm:p-4 mb-4">
                      <p className="text-green-400 text-xs sm:text-sm">
                        ✓ Google account connected: {userEmail}
                      </p>
                    </div>
                  )}

                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 sm:p-4 mb-4">
                    <p className="text-blue-400 text-xs sm:text-sm font-medium">
                      🔒 Security Requirement: You must create your own password to complete registration
                    </p>
                  </div>

                  <div>
                    <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
                      Username *
                    </label>
                    <input
                      type="text"
                      id="username"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      className="w-full px-3 sm:px-4 py-3 sm:py-3.5 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 text-sm sm:text-base min-h-[44px]"
                      placeholder="Choose a unique username"
                      style={{fontSize: '16px'}}
                      required
                    />
                    <p className="text-gray-400 text-xs mt-1">3-20 characters, letters, numbers, hyphens, and underscores only</p>
                  </div>

                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                      Password *
                    </label>
                    <input
                      type="password"
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full px-3 sm:px-4 py-3 sm:py-3.5 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 text-sm sm:text-base min-h-[44px]"
                      placeholder="Create a strong password"
                      style={{fontSize: '16px'}}
                      required
                    />
                    <p className="text-gray-400 text-xs mt-1">Minimum 6 characters required</p>
                  </div>

                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                      Confirm Password *
                    </label>
                    <input
                      type="password"
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="w-full px-3 sm:px-4 py-3 sm:py-3.5 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 text-sm sm:text-base min-h-[44px]"
                      placeholder="Confirm your password"
                      style={{fontSize: '16px'}}
                      required
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={handleStartOver}
                      className="flex-1 bg-gray-600 text-white font-semibold py-3 sm:py-3.5 md:py-4 rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition-all duration-300 text-sm sm:text-base min-h-[48px] flex items-center justify-center"
                    >
                      Start Over
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-3 sm:py-3.5 md:py-4 rounded-lg hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base min-h-[48px] flex items-center justify-center"
                    >
                      {loading ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span className="text-sm sm:text-base">Completing...</span>
                        </div>
                      ) : (
                        'Complete Registration'
                      )}
                    </button>
                  </div>

                  <div className="text-center mt-4">
                    <p className="text-gray-400 text-xs">
                      By completing registration, you agree to our Terms of Service and Privacy Policy
                    </p>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
