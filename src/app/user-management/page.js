'use client';

import RoleProtected from '@/components/RoleProtected';
import { useAuth } from '@/contexts/AuthContext';
import { userManagementAPI } from '@/lib/api';
import { PERMISSIONS, ROLES, getRoleDisplayName } from '@/utils/roles';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [pendingChanges, setPendingChanges] = useState({});
  const [applyingChanges, setApplyingChanges] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    fetchUsers();
  }, [currentPage]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await userManagementAPI.getUsers(currentPage, 10);
      setUsers(data.data);
      setTotalPages(data.pagination.pages);
      // Clear pending changes when refetching users
      setPendingChanges({});
    } catch (error) {
      console.error('Error fetching users:', error);
      
      // Handle specific error cases
      if (error.message.includes('Authentication token not found')) {
        toast.error('Please log in to access this page');
        router.push('/login');
      } else if (error.message.includes('Access denied') || error.message.includes('Super Admin')) {
        toast.error('Access denied: Super Admin role required');
        router.push('/');
      } else {
        toast.error(error.message || 'Failed to fetch users');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = (userId, newRole) => {
    // Store the pending change instead of applying immediately
    setPendingChanges(prev => ({
      ...prev,
      [userId]: newRole
    }));
  };

  const applyAllChanges = async () => {
    if (Object.keys(pendingChanges).length === 0) {
      toast.info('No changes to apply');
      return;
    }

    setApplyingChanges(true);
    const changes = Object.entries(pendingChanges);
    let successCount = 0;
    let errorCount = 0;

    try {
      for (const [userId, newRole] of changes) {
        try {
          await userManagementAPI.updateUserRole(userId, newRole);
          successCount++;
        } catch (error) {
          console.error(`Error updating user ${userId}:`, error);
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`Successfully updated ${successCount} user${successCount > 1 ? 's' : ''}`);
        setPendingChanges({});
        await fetchUsers();
      }
      
      if (errorCount > 0) {
        toast.error(`Failed to update ${errorCount} user${errorCount > 1 ? 's' : ''}`);
      }
    } catch (error) {
      console.error('Error applying changes:', error);
      toast.error('Failed to apply changes');
    } finally {
      setApplyingChanges(false);
    }
  };

  const cancelChanges = () => {
    setPendingChanges({});
    toast.info('Changes cancelled');
  };

  const updateUserRole = async (userId, newRole) => {
    try {
      setActionLoading(userId);
      await userManagementAPI.updateUserRole(userId, newRole);
      toast.success('User role updated successfully');
      fetchUsers();
    } catch (error) {
      console.error('Error updating user role:', error);
      
      // Handle specific error cases
      if (error.message.includes('Cannot change your own role')) {
        toast.error('You cannot change your own role');
      } else if (error.message.includes('User not found')) {
        toast.error('User not found');
        fetchUsers(); // Refresh to remove stale data
      } else {
        toast.error(error.message || 'Failed to update user role');
      }
    } finally {
      setActionLoading(null);
    }
  };

  const deleteUser = async (userId, username) => {
    if (!confirm(`Are you sure you want to delete user "${username}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setActionLoading(userId);
      await userManagementAPI.deleteUser(userId);
      toast.success(`User "${username}" deleted successfully`);
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      
      // Handle specific error cases
      if (error.message.includes('Cannot delete your own account')) {
        toast.error('You cannot delete your own account');
      } else if (error.message.includes('User not found')) {
        toast.error('User not found');
        fetchUsers(); // Refresh to remove stale data
      } else {
        toast.error(error.message || 'Failed to delete user');
      }
    } finally {
      setActionLoading(null);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (user.fullName && user.fullName.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case ROLES.SUPER_ADMIN:
        return 'bg-red-500 text-white';
      case ROLES.ADMIN:
        return 'bg-blue-500 text-white';
      case ROLES.USER:
        return 'bg-gray-500 text-white';
      default:
        return 'bg-gray-400 text-white';
    }
  };

  return (
    <RoleProtected requiredRole={ROLES.SUPER_ADMIN}>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 p-4 sm:p-6 md:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  User Management
                </h1>
                <p className="text-gray-300 mt-2">
                  Manage user roles and permissions across the platform
                </p>
              </div>
              <button
                onClick={() => router.push('/')}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Back to Home
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-gray-800/60 backdrop-blur-sm rounded-xl p-6 border border-gray-700 mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search users by username, email, or name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">All Roles</option>
                <option value={ROLES.USER}>Users</option>
                <option value={ROLES.ADMIN}>Admins</option>
                <option value={ROLES.SUPER_ADMIN}>Super Admins</option>
              </select>
            </div>
          </div>

          {/* Apply/Cancel Changes */}
          {Object.keys(pendingChanges).length > 0 && (
            <div className="bg-yellow-900/20 backdrop-blur-sm rounded-xl p-4 border border-yellow-600/50 mb-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-yellow-300">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <span className="font-medium">
                    You have {Object.keys(pendingChanges).length} pending change{Object.keys(pendingChanges).length > 1 ? 's' : ''}
                  </span>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={cancelChanges}
                    disabled={applyingChanges}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel Changes
                  </button>
                  <button
                    onClick={applyAllChanges}
                    disabled={applyingChanges}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {applyingChanges ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Applying...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                        Apply Changes
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Users Table */}
          <div className="bg-gray-800/60 backdrop-blur-sm rounded-xl border border-gray-700 overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
                <span className="ml-3 text-gray-300">Loading users...</span>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-300 mb-2">No users found</h3>
                  <p className="text-gray-400">
                    {searchTerm || roleFilter !== 'all' 
                      ? 'Try adjusting your search or filter criteria' 
                      : 'No users are registered in the system'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-700/50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Joined
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {filteredUsers.map((userData) => (
                      <tr key={userData._id} className="hover:bg-gray-700/30 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold">
                              {userData.username.charAt(0).toUpperCase()}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-white">
                                {userData.username}
                              </div>
                              {userData.fullName && (
                                <div className="text-sm text-gray-400">
                                  {userData.fullName}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-300">{userData.email}</div>
                          {userData.isOAuthUser && (
                            <div className="text-xs text-blue-400">
                              OAuth ({userData.oauthProvider})
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleBadgeColor(pendingChanges[userData._id] || userData.role)}`}>
                              {getRoleDisplayName(pendingChanges[userData._id] || userData.role)}
                            </span>
                            {pendingChanges[userData._id] && pendingChanges[userData._id] !== userData.role && (
                              <span className="text-xs text-yellow-400">(Modified)</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {new Date(userData.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            {userData._id !== user?.id && (
                              <>
                                <select
                                  value={pendingChanges[userData._id] || userData.role}
                                  onChange={(e) => handleRoleChange(userData._id, e.target.value)}
                                  disabled={applyingChanges}
                                  className="px-3 py-1 bg-gray-600 border border-gray-500 rounded text-white text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                                >
                                  <option value={ROLES.USER}>User</option>
                                  <option value={ROLES.ADMIN}>Admin</option>
                                  <option value={ROLES.SUPER_ADMIN}>Super Admin</option>
                                </select>
                                <button
                                  onClick={() => deleteUser(userData._id, userData.username)}
                                  disabled={actionLoading === userData._id || applyingChanges || Object.keys(pendingChanges).length > 0}
                                  className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                  title={Object.keys(pendingChanges).length > 0 ? "Apply or cancel pending changes before deleting users" : ""}
                                >
                                  {actionLoading === userData._id ? 'Loading...' : 'Delete'}
                                </button>
                              </>
                            )}
                            {userData._id === user?.id && (
                              <span className="text-xs text-gray-400">You</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex justify-center items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 text-white rounded-lg transition-colors disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-gray-300">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 text-white rounded-lg transition-colors disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </RoleProtected>
  );
}
