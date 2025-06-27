'use client';

import RoleIndicator from '@/components/RoleIndicator';
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="text-center max-w-md mx-auto">
          <div className="text-6xl mb-4">😞</div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">Profile not found</h1>
          <p className="text-gray-600 mb-6">The user profile you're looking for doesn't exist.</p>
          <button 
            onClick={() => router.push('/')}
            className="w-full sm:w-auto bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            Go Back Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 sm:mb-6">
            <div className="flex items-center">
              <div className="text-red-500 mr-2">⚠️</div>
              <div className="text-sm sm:text-base">{error}</div>
            </div>
          </div>
        )}

        {/* Header Card */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-4 sm:mb-8 animate-slideIn">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-4 sm:px-6 py-6 sm:py-8">
            <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-4">
              {/* Avatar */}
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-xl sm:text-3xl font-bold text-white">
                  {profile.fullName ? profile.fullName.charAt(0).toUpperCase() : profile.username.charAt(0).toUpperCase()}
                </span>
              </div>
              
              {/* Profile Info */}
              <div className="text-center sm:text-left flex-1 min-w-0">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-1 break-words">
                  {profile.fullName || profile.username}
                </h1>
                <p className="text-indigo-100 text-sm sm:text-base mb-1 break-words">@{profile.username}</p>
                <p className="text-indigo-200 text-xs sm:text-sm break-words">{profile.email}</p>
                
                {/* Role Badge - Mobile */}
                <div className="mt-3 sm:hidden flex justify-center">
                  {profile.role && (
                    <RoleIndicator 
                      role={profile.role} 
                      size="sm" 
                      showPermissions={false} 
                      variant="badge"
                    />
                  )}
                </div>
              </div>
              
              {/* Role Badge - Desktop */}
              <div className="hidden sm:flex items-start">
                {profile.role && (
                  <RoleIndicator 
                    role={profile.role} 
                    size="sm" 
                    showPermissions={true} 
                    variant="badge"
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Profile Content */}
        <div className="space-y-4 sm:space-y-0 sm:grid sm:grid-cols-1 lg:grid-cols-2 lg:gap-8">
          {/* User Information Card */}
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 animate-slideIn" style={{animationDelay: '0.1s'}}>
            <div className="flex items-center mb-4 sm:mb-6">
              <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center mr-3">
                <span className="text-indigo-600 text-sm">👤</span>
              </div>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">User Information</h2>
            </div>
            
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-3 sm:p-4 hover:bg-gray-100 transition-colors">
                <div className="flex flex-col sm:flex-row sm:justify-between">
                  <span className="text-gray-600 text-sm sm:text-base mb-1 sm:mb-0 font-medium">Full Name</span>
                  <span className="text-gray-900 text-sm sm:text-base break-words">
                    {profile.fullName || (
                      <span className="italic text-gray-500">Not specified</span>
                    )}
                  </span>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-3 sm:p-4 hover:bg-gray-100 transition-colors">
                <div className="flex flex-col sm:flex-row sm:justify-between">
                  <span className="text-gray-600 text-sm sm:text-base mb-1 sm:mb-0 font-medium">Username</span>
                  <span className="text-indigo-600 text-sm sm:text-base break-words font-medium">
                    @{profile.username}
                  </span>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-3 sm:p-4 hover:bg-gray-100 transition-colors">
                <div className="flex flex-col sm:flex-row sm:justify-between">
                  <span className="text-gray-600 text-sm sm:text-base mb-1 sm:mb-0 font-medium">Email</span>
                  <span className="text-gray-900 text-sm sm:text-base break-all">
                    {profile.email}
                  </span>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-3 sm:p-4 hover:bg-gray-100 transition-colors">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                  <span className="text-gray-600 text-sm sm:text-base mb-2 sm:mb-0 font-medium">Role & Permissions</span>
                  <div className="flex justify-start sm:justify-end">
                    {profile.role && (
                      <RoleIndicator 
                        role={profile.role} 
                        size="sm" 
                        showPermissions={true} 
                        variant="badge"
                      />
                    )}
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-3 sm:p-4 hover:bg-gray-100 transition-colors">
                <div className="flex flex-col sm:flex-row sm:justify-between">
                  <span className="text-gray-600 text-sm sm:text-base mb-1 sm:mb-0 font-medium">Account Type</span>
                  <div className="text-sm sm:text-base">
                    {profile.isOAuthUser ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-800 text-xs sm:text-sm font-medium">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                        OAuth ({profile.oauthProvider || 'Unknown'})
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs sm:text-sm font-medium">
                        <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                        Regular Account
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-3 sm:p-4 hover:bg-gray-100 transition-colors">
                <div className="flex flex-col sm:flex-row sm:justify-between">
                  <span className="text-gray-600 text-sm sm:text-base mb-1 sm:mb-0 font-medium">Member Since</span>
                  <span className="text-gray-900 text-sm sm:text-base">
                    {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    }) : 'Unknown'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Account Details Card */}
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 animate-slideIn" style={{animationDelay: '0.2s'}}>
            <div className="flex items-center mb-4 sm:mb-6">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                <span className="text-green-600 text-sm">⚙️</span>
              </div>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Account Details</h2>
            </div>
            
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-3 sm:p-4 hover:bg-gray-100 transition-colors">
                <div className="flex flex-col sm:flex-row sm:justify-between">
                  <span className="text-gray-600 text-sm sm:text-base mb-1 sm:mb-0 font-medium">Account Status</span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-800 text-xs sm:text-sm font-medium">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                    Active
                  </span>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-3 sm:p-4 hover:bg-gray-100 transition-colors">
                <div className="flex flex-col sm:flex-row sm:justify-between">
                  <span className="text-gray-600 text-sm sm:text-base mb-1 sm:mb-0 font-medium">Password Setup</span>
                  <div className="text-sm sm:text-base">
                    {profile.passwordSetupComplete ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-800 text-xs sm:text-sm font-medium">
                        <span className="mr-1">✓</span> Complete
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1 rounded-full bg-yellow-100 text-yellow-800 text-xs sm:text-sm font-medium">
                        <span className="mr-1">⚠</span> Incomplete
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-3 sm:p-4 hover:bg-gray-100 transition-colors">
                <div className="flex flex-col sm:flex-row sm:justify-between">
                  <span className="text-gray-600 text-sm sm:text-base mb-1 sm:mb-0 font-medium">Last Updated</span>
                  <span className="text-gray-900 text-sm sm:text-base">
                    {profile.updatedAt ? new Date(profile.updatedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    }) : 'Unknown'}
                  </span>
                </div>
              </div>
              
              {/* Additional Account Info */}
              <div className="pt-2 space-y-3">
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-3 sm:p-4 border border-gray-200">
                  <div className="text-xs sm:text-sm text-gray-600 mb-2 font-medium">Profile ID</div>
                  <div className="text-xs sm:text-sm font-mono text-gray-800 break-all bg-white px-2 py-1 rounded border">
                    {profile._id || 'N/A'}
                  </div>
                </div>
                
                {isOwnProfile && (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3 sm:p-4 border border-blue-200">
                    <div className="flex items-center text-xs sm:text-sm text-blue-800">
                      <span className="mr-2 text-base">👤</span>
                      <span className="font-medium">This is your profile</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4 animate-slideIn" style={{animationDelay: '0.3s'}}>
          <button
            onClick={() => router.push('/')}
            className="flex-1 sm:flex-none inline-flex items-center justify-center space-x-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus-visible:focus-visible transition-all duration-200 font-medium text-sm sm:text-base touch-manipulation transform hover:scale-105 active:scale-95"
          >
            <span>←</span>
            <span>Back to Dashboard</span>
          </button>
        </div>
      </div>
    </div>
  );
}
