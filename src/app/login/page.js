'use client';

import { useAuth } from '@/contexts/AuthContext';
import { authAPI } from '@/lib/api';
import { getSession, signIn } from 'next-auth/react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { toast } from 'react-toastify';

function LoginContent() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);
  
  const { login } = useAuth();
  const searchParams = useSearchParams();

  useEffect(() => {
    setTimeout(() => setMounted(true), 100);
    
    // Check for error messages from OAuth or other sources
    const error = searchParams.get('error');
    const message = searchParams.get('message');
    const email = searchParams.get('email');
    
    if (error) {
      switch (error) {
        case 'user_not_registered':
          setError(`This email (${email || 'your email'}) is not registered. Please register with Google OAuth.`);
          // Auto-redirect to register page after 3 seconds
          setTimeout(() => {
            window.location.href = `/register${email ? `?email=${encodeURIComponent(email)}` : ''}`;
          }, 3000);
          break;
        case 'database_error':
          setError('Database connection error. Please try again later.');
          break;
        case 'OAuthCallback':
          setError('Google sign-in encountered a network issue. Please try again.');
          break;
        case 'OAuthAccountNotLinked':
          setError('This email is already associated with another account. Please use a different sign-in method.');
          break;
        case 'OAuthCreateAccount':
          setError('Unable to create account. Please try again.');
          break;
        case 'OAuthSignin':
          setError('Google sign-in failed. Please try again.');
          break;
        case 'AccessDenied':
          setError('Access denied: Please use your Parul University email address (@paruluniversity.ac.in)');
          break;
        default:
          setError('Authentication failed. Please try again.');
      }
    } else if (message === 'setup-complete') {
      toast.success('Registration completed successfully! You can now sign in with your credentials.');
    } else if (message === 'registration-complete') {
      toast.success('Account created successfully! You can now sign in.');
    }
  }, [searchParams]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleGoogleSignIn = async () => {
    try {
      setGoogleLoading(true);
      setError('');
      
      console.log('Initiating Google sign-in...');
      const result = await signIn('google', {
        redirect: false,
        callbackUrl: '/'
      });

      console.log('Google sign-in result:', result);

      if (result?.error) {
        console.error('Google sign-in error:', result.error);
        switch (result.error) {
          case 'OAuthCallback':
            setError('Network timeout during Google sign-in. Please check your internet connection and try again.');
            break;
          case 'OAuthAccountNotLinked':
            setError('This Google account is already linked to another user. Please use a different account.');
            break;
          default:
            setError(`Google sign-in failed: ${result.error}. Please try again.`);
        }
      } else if (result?.ok) {
        toast.success('Signed in successfully!');
        // Give time for session to be established
        setTimeout(() => {
          window.location.href = '/';
        }, 1000);
      } else if (result?.url) {
        // Handle redirect
        window.location.href = result.url;
      }
    } catch (error) {
      console.error('Google sign-in exception:', error);
      setError('Google sign-in failed due to a network issue. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!formData.email || !formData.password) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }

    try {
      const response = await authAPI.login(formData);
      if (response.accessToken) {
        const tokenPayload = JSON.parse(atob(response.accessToken.split('.')[1]));
        login(response.accessToken, tokenPayload.user.username);
      }
    } catch (error) {
      console.error('Login error:', error);
      if (error.message.includes('Only @paruluniversity.ac.in email addresses are allowed')) {
        setError('Access denied: Please use your Parul University email address (@paruluniversity.ac.in)');
      } else if (error.message.includes('Invalid email or password')) {
        setError('Invalid email or password. Please try again.');
      } else {
        setError(error.message || 'Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
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
            <p className="text-gray-300 text-xs sm:text-sm md:text-base">Welcome back! Please sign in with your Parul University account.</p>
            <div className="mt-3 bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
              <p className="text-blue-400 text-xs sm:text-sm">
                🏫 Only @paruluniversity.ac.in email addresses are allowed
              </p>
            </div>
          </div>

          {/* Login Form */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl sm:rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative bg-gray-800/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 border border-gray-700">
              <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4 md:space-y-6">
                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 sm:p-4">
                    <p className="text-red-400 text-xs sm:text-sm">{error}</p>
                  </div>
                )}

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-3 sm:px-4 py-3 sm:py-3.5 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 text-sm sm:text-base min-h-[44px]"
                    placeholder="Enter your @paruluniversity.ac.in email"
                    style={{fontSize: '16px'}}
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full px-3 sm:px-4 py-3 sm:py-3.5 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 text-sm sm:text-base min-h-[44px]"
                    placeholder="Enter your password"
                    style={{fontSize: '16px'}}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-3 sm:py-3.5 md:py-4 rounded-lg hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base md:text-lg min-h-[48px] flex items-center justify-center"
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-sm sm:text-base">Signing in...</span>
                    </div>
                  ) : (
                    'Sign In'
                  )}
                </button>

                {/* Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-600"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-gray-800/80 text-gray-400">Or continue with</span>
                  </div>
                </div>

                {/* Google Sign-In Button */}
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={googleLoading}
                  className="w-full bg-white text-gray-900 font-semibold py-3 sm:py-3.5 md:py-4 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base md:text-lg min-h-[48px] flex items-center justify-center gap-3"
                >
                  {googleLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-sm sm:text-base">Signing in with Google...</span>
                    </div>
                  ) : (
                    <>
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      Sign in with Google
                    </>
                  )}
                </button>

                <div className="text-center">
                  <p className="text-gray-400 text-xs sm:text-sm">
                    Don&apos;t have an account?{' '}
                    <Link href="/register" className="text-purple-400 hover:text-purple-300 font-medium hover:underline transition-colors">
                      Sign up here
                    </Link>
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Login() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
