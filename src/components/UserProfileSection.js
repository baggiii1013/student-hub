'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRole } from '@/hooks/useRole';
import { useRouter } from 'next/navigation';
import RoleIndicator from './RoleIndicator';

export default function UserProfileSection({ variant = 'horizontal' }) {
  const { user, logout } = useAuth();
  const { role, roleDisplayName } = useRole();
  const router = useRouter();

  const getUserInitials = (username) => {
    return username ? username.slice(0, 2).toUpperCase() : 'U';
  };

  const getUserColor = () => {
    const colors = [
      'bg-gradient-to-r from-blue-500 to-purple-500',
      'bg-gradient-to-r from-green-500 to-teal-500',
      'bg-gradient-to-r from-pink-500 to-rose-500',
      'bg-gradient-to-r from-orange-500 to-red-500',
      'bg-gradient-to-r from-indigo-500 to-blue-500',
    ];
    
    if (!user?.username) return colors[0];
    
    const hash = user.username.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    return colors[Math.abs(hash) % colors.length];
  };

  if (!user) return null;

  if (variant === 'card') {
    return (
      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-4">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg ${getUserColor()}`}>
            {getUserInitials(user.username)}
          </div>
          <div className="flex-1">
            <h3 className="text-white font-semibold text-lg">{user.username}</h3>
            <p className="text-gray-400 text-sm mb-2">{user.email}</p>
            <RoleIndicator size="sm" showPermissions={true} variant="badge" />
          </div>
        </div>
        
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => router.push(`/profile/${user.username}`)}
            className="flex-1 bg-purple-600 text-white px-3 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
          >
            View Profile
          </button>
          <button
            onClick={logout}
            className="px-3 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors text-sm font-medium"
          >
            Logout
          </button>
        </div>
      </div>
    );
  }

  // Default horizontal variant
  return (
    <div className="flex items-center gap-4">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg ${getUserColor()}`}>
        {getUserInitials(user.username)}
      </div>
      <div className="flex flex-col">
        <span className="text-white text-sm font-medium">{user.username}</span>
        <RoleIndicator size="sm" showPermissions={false} variant="badge" />
      </div>
    </div>
  );
}
