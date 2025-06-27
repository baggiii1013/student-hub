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
  const [viewMode, setViewMode] = useState('auto'); // 'auto', 'table', 'cards'
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
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 p-3 sm:p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6 md:mb-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
              <div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  User Management
                </h1>
                <p className="text-gray-300 mt-1 sm:mt-2 text-sm sm:text-base">
                  Manage user roles and permissions across the platform
                </p>
              </div>
              <button
                onClick={() => router.push('/')}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors text-sm sm:text-base w-full sm:w-auto"
              >
                Back to Home
              </button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="bg-gray-800/60 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-gray-700 mb-4 sm:mb-6">
            <div className="flex flex-col gap-3 sm:gap-4">
              {/* Search Input */}
              <div className="w-full">
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 text-base"
                  style={{ fontSize: '16px' }} // Prevent zoom on iOS
                />
              </div>
              
              {/* Filter and View Controls */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                {/* Role Filter */}
                <div className="w-full sm:w-auto">
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-base"
                  >
                    <option value="all">All Roles</option>
                    <option value={ROLES.USER}>Users</option>
                    <option value={ROLES.ADMIN}>Admins</option>
                    <option value={ROLES.SUPER_ADMIN}>Super Admins</option>
                  </select>
                </div>

                {/* View Toggle - Hidden on small screens, shown on medium+ */}
                <div className="hidden md:flex items-center gap-2 bg-gray-700/30 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('cards')}
                    className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                      viewMode === 'cards' 
                        ? 'bg-purple-600 text-white' 
                        : 'text-gray-300 hover:text-white hover:bg-gray-600'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14-7H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2z" />
                    </svg>
                    Cards
                  </button>
                  <button
                    onClick={() => setViewMode('table')}
                    className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                      viewMode === 'table' 
                        ? 'bg-purple-600 text-white' 
                        : 'text-gray-300 hover:text-white hover:bg-gray-600'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M3 6h18m-9 8h9m-9 4h9m-9-8H3m0 4h6" />
                    </svg>
                    Table
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          {!loading && users.length > 0 && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
              <div className="bg-gray-800/40 backdrop-blur-sm rounded-lg p-3 sm:p-4 border border-gray-700">
                <div className="text-xs sm:text-sm text-gray-400">Total Users</div>
                <div className="text-lg sm:text-xl font-bold text-white">{users.length}</div>
              </div>
              <div className="bg-gray-800/40 backdrop-blur-sm rounded-lg p-3 sm:p-4 border border-gray-700">
                <div className="text-xs sm:text-sm text-gray-400">Super Admins</div>
                <div className="text-lg sm:text-xl font-bold text-red-400">
                  {users.filter(u => u.role === ROLES.SUPER_ADMIN).length}
                </div>
              </div>
              <div className="bg-gray-800/40 backdrop-blur-sm rounded-lg p-3 sm:p-4 border border-gray-700">
                <div className="text-xs sm:text-sm text-gray-400">Admins</div>
                <div className="text-lg sm:text-xl font-bold text-blue-400">
                  {users.filter(u => u.role === ROLES.ADMIN).length}
                </div>
              </div>
              <div className="bg-gray-800/40 backdrop-blur-sm rounded-lg p-3 sm:p-4 border border-gray-700">
                <div className="text-xs sm:text-sm text-gray-400">Regular Users</div>
                <div className="text-lg sm:text-xl font-bold text-green-400">
                  {users.filter(u => u.role === ROLES.USER).length}
                </div>
              </div>
            </div>
          )}

          {/* Apply/Cancel Changes - Mobile Optimized */}
          {Object.keys(pendingChanges).length > 0 && (
            <div className="bg-yellow-900/20 backdrop-blur-sm rounded-xl p-4 border border-yellow-600/50 mb-4 sm:mb-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                <div className="flex items-center gap-2 text-yellow-300">
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <span className="font-medium text-sm sm:text-base">
                    {Object.keys(pendingChanges).length} pending change{Object.keys(pendingChanges).length > 1 ? 's' : ''}
                  </span>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
                  <button
                    onClick={cancelChanges}
                    disabled={applyingChanges}
                    className="w-full sm:w-auto px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                  >
                    Cancel Changes
                  </button>
                  <button
                    onClick={applyAllChanges}
                    disabled={applyingChanges}
                    className="w-full sm:w-auto px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base"
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

          {/* Users List - Mobile-First Design */}
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
              <>
                {/* Mobile Card View - Always shown on small screens, optional on medium+ */}
                <div className={`${viewMode === 'table' ? 'hidden' : 'block lg:hidden'} ${viewMode === 'cards' ? 'md:block' : ''}`}>
                  <div className="divide-y divide-gray-700">
                    {filteredUsers.map((userData) => (
                      <div key={userData._id} className="p-4 hover:bg-gray-700/30 transition-colors">
                        {/* User Info Section */}
                        <div className="flex items-start gap-3 mb-3">
                          <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                            {userData.username.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col gap-1">
                              <h3 className="text-base font-semibold text-white truncate">
                                {userData.username}
                                {userData._id === user?.id && (
                                  <span className="ml-2 text-xs text-purple-400">(You)</span>
                                )}
                              </h3>
                              {userData.fullName && (
                                <p className="text-sm text-gray-400 truncate">{userData.fullName}</p>
                              )}
                              <p className="text-sm text-gray-300 truncate">{userData.email}</p>
                              {userData.isOAuthUser && (
                                <p className="text-xs text-blue-400">
                                  OAuth ({userData.oauthProvider})
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Role & Date Section */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <span className={`px-3 py-1 text-sm font-medium rounded-full ${getRoleBadgeColor(pendingChanges[userData._id] || userData.role)}`}>
                              {getRoleDisplayName(pendingChanges[userData._id] || userData.role)}
                            </span>
                            {pendingChanges[userData._id] && pendingChanges[userData._id] !== userData.role && (
                              <span className="text-xs text-yellow-400 font-medium">(Modified)</span>
                            )}
                          </div>
                          <div className="text-sm text-gray-400">
                            Joined {new Date(userData.createdAt).toLocaleDateString()}
                          </div>
                        </div>

                        {/* Actions Section */}
                        {userData._id !== user?.id && (
                          <div className="flex flex-col gap-3 sm:flex-row sm:gap-2">
                            <div className="flex-1">
                              <label className="block text-xs font-medium text-gray-400 mb-1">
                                Change Role
                              </label>
                              <select
                                value={pendingChanges[userData._id] || userData.role}
                                onChange={(e) => handleRoleChange(userData._id, e.target.value)}
                                disabled={applyingChanges}
                                className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white text-base focus:outline-none focus:ring-2 focus:ring-purple-500"
                                style={{ fontSize: '16px' }} // Prevent zoom on iOS
                              >
                                <option value={ROLES.USER}>User</option>
                                <option value={ROLES.ADMIN}>Admin</option>
                                <option value={ROLES.SUPER_ADMIN}>Super Admin</option>
                              </select>
                            </div>
                            <div className="flex items-end">
                              <button
                                onClick={() => deleteUser(userData._id, userData.username)}
                                disabled={actionLoading === userData._id || applyingChanges || Object.keys(pendingChanges).length > 0}
                                className="w-full sm:w-auto px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[40px]"
                                title={Object.keys(pendingChanges).length > 0 ? "Apply or cancel pending changes before deleting users" : ""}
                              >
                                {actionLoading === userData._id ? (
                                  <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Deleting...
                                  </>
                                ) : (
                                  <>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                    Delete User
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Desktop Table View - Hidden on small screens, optional on medium+ */}
                <div className={`${viewMode === 'cards' ? 'hidden' : 'hidden lg:block'} ${viewMode === 'table' ? 'md:block' : ''} overflow-x-auto`}>
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
              </>
            )}
          </div>

          {/* Pagination - Mobile Optimized */}
          {totalPages > 1 && (
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center sm:items-center sm:gap-4">
              <div className="flex justify-center items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 text-white rounded-lg transition-colors disabled:cursor-not-allowed text-sm sm:text-base"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                  </svg>
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 text-white rounded-lg transition-colors disabled:cursor-not-allowed text-sm sm:text-base"
                >
                  Next
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
              <div className="text-center">
                <span className="text-gray-300 text-sm sm:text-base">
                  Page {currentPage} of {totalPages}
                </span>
                <div className="text-xs text-gray-400 mt-1">
                  Showing {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </RoleProtected>
  );
}
