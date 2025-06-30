'use client';

import RoleProtected from '@/components/RoleProtected';
import { useAuth } from '@/contexts/AuthContext';
import { userManagementAPI } from '@/lib/api';
import { PERMISSIONS, ROLES, getRoleDisplayName } from '@/utils/roles';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import styles from './page.module.css';

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
        return styles.roleBadgeSuperAdmin;
      case ROLES.ADMIN:
        return styles.roleBadgeAdmin;
      case ROLES.USER:
        return styles.roleBadgeUser;
      default:
        return styles.roleBadgeDefault;
    }
  };

  return (
    <RoleProtected requiredRole={ROLES.SUPER_ADMIN}>
      <div className={styles.container}>
        <div className={styles.maxWidth}>
          {/* Header */}
          <div className={styles.header}>
            <div className={styles.headerContent}>
              <div className={styles.headerText}>
                <h1>
                  User Management
                </h1>
                <p>
                  Manage user roles and permissions across the platform
                </p>
              </div>
              <button
                onClick={() => router.push('/')}
                className={styles.backButton}
              >
                Back to Home
              </button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className={styles.searchContainer}>
            <div className={styles.searchContent}>
              {/* Search Input */}
              <div>
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={styles.searchInput}
                  style={{ fontSize: '16px' }} // Prevent zoom on iOS
                />
              </div>
              
              {/* Filter and View Controls */}
              <div className={styles.filterRow}>
                {/* Role Filter */}
                <div>
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className={styles.roleFilter}
                  >
                    <option value="all">All Roles</option>
                    <option value={ROLES.USER}>Users</option>
                    <option value={ROLES.ADMIN}>Admins</option>
                    <option value={ROLES.SUPER_ADMIN}>Super Admins</option>
                  </select>
                </div>

                {/* View Toggle - Hidden on small screens, shown on medium+ */}
                <div className={styles.viewToggle}>
                  <button
                    onClick={() => setViewMode('cards')}
                    className={`${styles.viewButton} ${
                      viewMode === 'cards' ? styles.viewButtonActive : ''
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14-7H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2z" />
                    </svg>
                    Cards
                  </button>
                  <button
                    onClick={() => setViewMode('table')}
                    className={`${styles.viewButton} ${
                      viewMode === 'table' ? styles.viewButtonActive : ''
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
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <div className={styles.statLabel}>Total Users</div>
                <div className={styles.statValue}>{users.length}</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statLabel}>Super Admins</div>
                <div className={`${styles.statValue} ${styles.statValueRed}`}>
                  {users.filter(u => u.role === ROLES.SUPER_ADMIN).length}
                </div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statLabel}>Admins</div>
                <div className={`${styles.statValue} ${styles.statValueBlue}`}>
                  {users.filter(u => u.role === ROLES.ADMIN).length}
                </div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statLabel}>Regular Users</div>
                <div className={`${styles.statValue} ${styles.statValueGreen}`}>
                  {users.filter(u => u.role === ROLES.USER).length}
                </div>
              </div>
            </div>
          )}

          {/* Apply/Cancel Changes - Mobile Optimized */}
          {Object.keys(pendingChanges).length > 0 && (
            <div className={styles.pendingChanges}>
              <div className={styles.pendingContent}>
                <div className={styles.pendingInfo}>
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <span className={styles.pendingText}>
                    {Object.keys(pendingChanges).length} pending change{Object.keys(pendingChanges).length > 1 ? 's' : ''}
                  </span>
                </div>
                <div className={styles.pendingActions}>
                  <button
                    onClick={cancelChanges}
                    disabled={applyingChanges}
                    className={styles.cancelButton}
                  >
                    Cancel Changes
                  </button>
                  <button
                    onClick={applyAllChanges}
                    disabled={applyingChanges}
                    className={styles.applyButton}
                  >
                    {applyingChanges ? (
                      <>
                        <div className={styles.spinner}></div>
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
          <div className={styles.usersContainer}>
            {loading ? (
              <div className={styles.loadingContainer}>
                <div className={styles.loadingSpinner}></div>
                <span className={styles.loadingText}>Loading users...</span>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className={styles.emptyContainer}>
                <div className={styles.emptyContent}>
                  <div className={styles.emptyIcon}>
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                  </div>
                  <h3 className={styles.emptyTitle}>No users found</h3>
                  <p className={styles.emptyDescription}>
                    {searchTerm || roleFilter !== 'all' 
                      ? 'Try adjusting your search or filter criteria' 
                      : 'No users are registered in the system'}
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Mobile Card View - Always shown on small screens, optional on medium+ */}
                <div className={`${viewMode === 'table' ? 'hidden' : styles.cardView} ${viewMode === 'cards' ? styles.cardViewForced : ''}`}>
                  <div className={styles.cardsList}>
                    {filteredUsers.map((userData) => (
                      <div key={userData._id} className={styles.userCard}>
                        {/* User Info Section */}
                        <div className={styles.userInfo}>
                          <div className={styles.userAvatar}>
                            {userData.username.charAt(0).toUpperCase()}
                          </div>
                          <div className={styles.userDetails}>
                            <div className={styles.userDetailsContent}>
                              <h3 className={styles.userName}>
                                {userData.username}
                                {userData._id === user?.id && (
                                  <span className={styles.userTag}>(You)</span>
                                )}
                              </h3>
                              {userData.fullName && (
                                <p className={styles.userFullName}>{userData.fullName}</p>
                              )}
                              <p className={styles.userEmail}>{userData.email}</p>
                              {userData.isOAuthUser && (
                                <p className={styles.oauthInfo}>
                                  OAuth ({userData.oauthProvider})
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Role & Date Section */}
                        <div className={styles.roleSection}>
                          <div className={styles.roleInfo}>
                            <span className={`${styles.roleBadgeCard} ${getRoleBadgeColor(pendingChanges[userData._id] || userData.role)}`}>
                              {getRoleDisplayName(pendingChanges[userData._id] || userData.role)}
                            </span>
                            {pendingChanges[userData._id] && pendingChanges[userData._id] !== userData.role && (
                              <span className={styles.roleModified}>(Modified)</span>
                            )}
                          </div>
                          <div className={styles.joinDate}>
                            Joined {new Date(userData.createdAt).toLocaleDateString()}
                          </div>
                        </div>

                        {/* Actions Section */}
                        {userData._id !== user?.id && (
                          <div className={styles.actionsSection}>
                            <div className={styles.roleChangeSection}>
                              <label className={styles.roleLabel}>
                                Change Role
                              </label>
                              <select
                                value={pendingChanges[userData._id] || userData.role}
                                onChange={(e) => handleRoleChange(userData._id, e.target.value)}
                                disabled={applyingChanges}
                                className={styles.roleSelect}
                                style={{ fontSize: '16px' }} // Prevent zoom on iOS
                              >
                                <option value={ROLES.USER}>User</option>
                                <option value={ROLES.ADMIN}>Admin</option>
                                <option value={ROLES.SUPER_ADMIN}>Super Admin</option>
                              </select>
                            </div>
                            <div className={styles.deleteSection}>
                              <button
                                onClick={() => deleteUser(userData._id, userData.username)}
                                disabled={actionLoading === userData._id || applyingChanges || Object.keys(pendingChanges).length > 0}
                                className={styles.deleteButton}
                                title={Object.keys(pendingChanges).length > 0 ? "Apply or cancel pending changes before deleting users" : ""}
                              >
                                {actionLoading === userData._id ? (
                                  <>
                                    <div className={styles.spinner}></div>
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
                <div className={`${viewMode === 'cards' ? 'hidden' : styles.tableView} ${viewMode === 'table' ? styles.tableViewForced : ''}`}>
                  <table className={styles.table}>
                    <thead className={styles.tableHead}>
                      <tr>
                        <th className={styles.tableHeader}>
                          User
                        </th>
                        <th className={styles.tableHeader}>
                          Email
                        </th>
                        <th className={styles.tableHeader}>
                          Role
                        </th>
                        <th className={styles.tableHeader}>
                          Joined
                        </th>
                        <th className={styles.tableHeader}>
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className={styles.tableBody}>
                      {filteredUsers.map((userData) => (
                        <tr key={userData._id} className={styles.tableRow}>
                          <td className={`${styles.tableCell} ${styles.tableCellUser}`}>
                            <div className={styles.tableAvatar}>
                              {userData.username.charAt(0).toUpperCase()}
                            </div>
                            <div className={styles.tableUserInfo}>
                              <div className={styles.tableUserName}>
                                {userData.username}
                              </div>
                              {userData.fullName && (
                                <div className={styles.tableUserFullName}>
                                  {userData.fullName}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className={styles.tableCell}>
                            <div className={styles.tableEmail}>{userData.email}</div>
                            {userData.isOAuthUser && (
                              <div className={styles.tableOAuthInfo}>
                                OAuth ({userData.oauthProvider})
                              </div>
                            )}
                          </td>
                          <td className={styles.tableCell}>
                            <div className={styles.tableRoleInfo}>
                              <span className={`${styles.roleBadgeTable} ${getRoleBadgeColor(pendingChanges[userData._id] || userData.role)}`}>
                                {getRoleDisplayName(pendingChanges[userData._id] || userData.role)}
                              </span>
                              {pendingChanges[userData._id] && pendingChanges[userData._id] !== userData.role && (
                                <span className={styles.tableRoleModified}>(Modified)</span>
                              )}
                            </div>
                          </td>
                          <td className={`${styles.tableCell} ${styles.tableJoinDate}`}>
                            {new Date(userData.createdAt).toLocaleDateString()}
                          </td>
                          <td className={styles.tableCell}>
                            <div className={styles.tableActions}>
                              {userData._id !== user?.id && (
                                <>
                                  <select
                                    value={pendingChanges[userData._id] || userData.role}
                                    onChange={(e) => handleRoleChange(userData._id, e.target.value)}
                                    disabled={applyingChanges}
                                    className={styles.tableRoleSelect}
                                  >
                                    <option value={ROLES.USER}>User</option>
                                    <option value={ROLES.ADMIN}>Admin</option>
                                    <option value={ROLES.SUPER_ADMIN}>Super Admin</option>
                                  </select>
                                  <button
                                    onClick={() => deleteUser(userData._id, userData.username)}
                                    disabled={actionLoading === userData._id || applyingChanges || Object.keys(pendingChanges).length > 0}
                                    className={styles.tableDeleteButton}
                                    title={Object.keys(pendingChanges).length > 0 ? "Apply or cancel pending changes before deleting users" : ""}
                                  >
                                    {actionLoading === userData._id ? 'Loading...' : 'Delete'}
                                  </button>
                                </>
                              )}
                              {userData._id === user?.id && (
                                <span className={styles.tableYouTag}>You</span>
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
            <div className={styles.pagination}>
              <div className={styles.paginationButtons}>
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className={styles.paginationButton}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                  </svg>
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className={styles.paginationButton}
                >
                  Next
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
              <div className={styles.paginationInfo}>
                <span className={styles.paginationText}>
                  Page {currentPage} of {totalPages}
                </span>
                <div className={styles.paginationDetails}>
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
