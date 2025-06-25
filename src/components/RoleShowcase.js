'use client';

import RoleBadge from '@/components/RoleBadge';
import RoleIndicator from '@/components/RoleIndicator';
import RoleStatsCard from '@/components/RoleStatsCard';
import UserProfileSection from '@/components/UserProfileSection';

export default function RoleShowcase() {
  const roles = ['user', 'admin', 'superAdmin'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
            Role Display Components
          </h1>
          <p className="text-gray-300 text-lg">
            Comprehensive styling showcase for user roles and permissions
          </p>
        </div>

        <div className="space-y-12">
          {/* Role Badges */}
          <section className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
            <h2 className="text-2xl font-semibold text-white mb-6">Role Badges</h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg text-gray-300 mb-3">Small Size</h3>
                <div className="flex flex-wrap gap-3">
                  {roles.map(role => (
                    <RoleBadge key={role} role={role} size="xs" />
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-lg text-gray-300 mb-3">Medium Size</h3>
                <div className="flex flex-wrap gap-3">
                  {roles.map(role => (
                    <RoleBadge key={role} role={role} size="sm" />
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-lg text-gray-300 mb-3">Without Icons</h3>
                <div className="flex flex-wrap gap-3">
                  {roles.map(role => (
                    <RoleBadge key={role} role={role} showIcon={false} />
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Role Indicators */}
          <section className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
            <h2 className="text-2xl font-semibold text-white mb-6">Role Indicators</h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg text-gray-300 mb-3">Pill Variant with Permissions</h3>
                <div className="space-y-4">
                  {roles.map(role => (
                    <div key={role} className="flex items-center">
                      <RoleIndicator role={role} variant="pill" showPermissions={true} />
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-lg text-gray-300 mb-3">Badge Variant</h3>
                <div className="space-y-4">
                  {roles.map(role => (
                    <div key={role} className="flex items-center">
                      <RoleIndicator role={role} variant="badge" showPermissions={true} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Sample User Cards */}
          <section className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
            <h2 className="text-2xl font-semibold text-white mb-6">User Profile Examples</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { username: 'john_doe', email: 'john@example.com', role: 'user' },
                { username: 'jane_admin', email: 'jane@example.com', role: 'admin' },
                { username: 'super_user', email: 'super@example.com', role: 'superAdmin' }
              ].map((user, index) => (
                <div key={index} className="bg-gray-700/50 border border-gray-600 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                      {user.username.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-white font-medium">{user.username}</h4>
                      <p className="text-gray-400 text-sm">{user.email}</p>
                    </div>
                  </div>
                  <div className="mb-3">
                    <RoleIndicator role={user.role} size="sm" variant="badge" showPermissions={true} />
                  </div>
                  <div className="flex gap-2">
                    <RoleBadge role={user.role} size="xs" />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Permission Matrix */}
          <section className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
            <h2 className="text-2xl font-semibold text-white mb-6">Permission Matrix</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-600">
                    <th className="text-left py-3 px-4 text-gray-300">Role</th>
                    <th className="text-center py-3 px-4 text-gray-300">View Students</th>
                    <th className="text-center py-3 px-4 text-gray-300">Upload Data</th>
                    <th className="text-center py-3 px-4 text-gray-300">Edit Students</th>
                    <th className="text-center py-3 px-4 text-gray-300">Delete Students</th>
                    <th className="text-center py-3 px-4 text-gray-300">Manage Users</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { role: 'user', permissions: ['✓', '✗', '✗', '✗', '✗'] },
                    { role: 'admin', permissions: ['✓', '✓', '✓', '✗', '✗'] },
                    { role: 'superAdmin', permissions: ['✓', '✓', '✓', '✓', '✓'] }
                  ].map((row, index) => (
                    <tr key={index} className="border-b border-gray-700">
                      <td className="py-3 px-4">
                        <RoleBadge role={row.role} size="sm" />
                      </td>
                      {row.permissions.map((permission, pIndex) => (
                        <td key={pIndex} className="text-center py-3 px-4">
                          <span className={permission === '✓' ? 'text-green-400' : 'text-red-400'}>
                            {permission}
                          </span>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
