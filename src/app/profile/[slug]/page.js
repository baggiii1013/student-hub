'use client';


import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

export default function ProfilePage() {
  const { slug } = useParams();
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const isOwnProfile = currentUser && currentUser.username === slug;

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      // Add safety check for slug
      if (!slug) {
        setError('Invalid profile URL');
        return;
      }
      
      const data = await api.get(`/users/profile/${slug}`);
      setProfile(data);
    } catch (err) {
      console.error('Error fetching profile:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to load profile';
      setError(errorMessage);
      
      if (err.response?.status === 404) {
        // Don't redirect immediately, let user see the error
        setTimeout(() => {
          router.push('/');
        }, 2000);
      }
    } finally {
      setLoading(false);
    }
  }, [slug, router]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Profile not found</h1>
          <button 
            onClick={() => router.push('/')}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Go Back Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
                  <span className="text-3xl font-bold text-white">
                    {profile.fullName ? profile.fullName.charAt(0).toUpperCase() : profile.username.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">{profile.fullName || profile.username}</h1>
                  <p className="text-indigo-100">@{profile.username}</p>
                  <p className="text-indigo-200 text-sm">Email: {profile.email}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 animate-slideDown">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* User Information */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">User Information</h2>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-900">Full Name:</span>
                <span className="font-medium text-blue-700">{profile.fullName || 'Not specified'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-900">Username:</span>
                <span className="font-medium text-blue-700">@{profile.username}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-900">Email:</span>
                <span className="font-medium text-blue-700">{profile.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-900">Account Type:</span>
                <span className="font-medium text-blue-700">
                  {profile.isOAuthUser ? `OAuth (${profile.oauthProvider || 'Unknown'})` : 'Regular Account'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-900">Member Since:</span>
                <span className="font-medium text-blue-700">
                  {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'Unknown'}
                </span>
              </div>
            </div>
          </div>

          {/* Account Information */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Account Details</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Account Status:</span>
                <span className="font-medium text-green-600">Active</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Password Setup:</span>
                <span className="font-medium">
                  {profile.passwordSetupComplete ? (
                    <span className="text-green-600">✓ Complete</span>
                  ) : (
                    <span className="text-yellow-600">⚠ Incomplete</span>
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Last Updated:</span>
                <span className="font-medium">
                  {profile.updatedAt ? new Date(profile.updatedAt).toLocaleDateString() : 'Unknown'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Back to Dashboard */}
        <div className="mt-8 text-center">
          <button
            onClick={() => router.push('/')}
            className="inline-flex items-center space-x-2 text-indigo-600 hover:text-indigo-700 transition-colors"
          >
            <span>←</span>
            <span>Back to Dashboard</span>
          </button>
        </div>
      </div>
    </div>
  );
}
