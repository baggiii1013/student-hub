'use client';

import RoleBadge from '@/components/RoleBadge';
import RoleIndicator from '@/components/RoleIndicator';
import RoleStatsCard from '@/components/RoleStatsCard';
import UserProfileSection from '@/components/UserProfileSection';
import styles from './RoleShowcase.module.css';

export default function RoleShowcase() {
  const roles = ['user', 'admin', 'superAdmin'];

  return (
    <div className={styles.container}>
      <div className={styles.innerContainer}>
        <div className={styles.header}>
          <h1 className={styles.title}>
            Role Display Components
          </h1>
          <p className={styles.subtitle}>
            Comprehensive styling showcase for user roles and permissions
          </p>
        </div>

        <div className={styles.mainContent}>
          {/* Role Badges */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Role Badges</h2>
            <div className={styles.sectionContent}>
              <div className={styles.subsection}>
                <h3 className={styles.subsectionTitle}>Small Size</h3>
                <div className={styles.badgeRow}>
                  {roles.map(role => (
                    <RoleBadge key={role} role={role} size="xs" />
                  ))}
                </div>
              </div>
              <div className={styles.subsection}>
                <h3 className={styles.subsectionTitle}>Medium Size</h3>
                <div className={styles.badgeRow}>
                  {roles.map(role => (
                    <RoleBadge key={role} role={role} size="sm" />
                  ))}
                </div>
              </div>
              <div className={styles.subsection}>
                <h3 className={styles.subsectionTitle}>Without Icons</h3>
                <div className={styles.badgeRow}>
                  {roles.map(role => (
                    <RoleBadge key={role} role={role} showIcon={false} />
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Role Indicators */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Role Indicators</h2>
            <div className={styles.sectionContent}>
              <div className={styles.subsection}>
                <h3 className={styles.subsectionTitle}>Pill Variant with Permissions</h3>
                <div className={styles.sectionContent}>
                  {roles.map(role => (
                    <div key={role} className={styles.indicatorRow}>
                      <RoleIndicator role={role} variant="pill" showPermissions={true} />
                    </div>
                  ))}
                </div>
              </div>
              <div className={styles.subsection}>
                <h3 className={styles.subsectionTitle}>Badge Variant</h3>
                <div className={styles.sectionContent}>
                  {roles.map(role => (
                    <div key={role} className={styles.indicatorRow}>
                      <RoleIndicator role={role} variant="badge" showPermissions={true} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Sample User Cards */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>User Profile Examples</h2>
            <div className={styles.userGrid}>
              {[
                { username: 'john_doe', email: 'john@example.com', role: 'user' },
                { username: 'jane_admin', email: 'jane@example.com', role: 'admin' },
                { username: 'super_user', email: 'super@example.com', role: 'superAdmin' }
              ].map((user, index) => (
                <div key={index} className={styles.userCard}>
                  <div className={styles.userHeader}>
                    <div className={styles.userAvatar}>
                      {user.username.slice(0, 2).toUpperCase()}
                    </div>
                    <div className={styles.userInfo}>
                      <h4>{user.username}</h4>
                      <p>{user.email}</p>
                    </div>
                  </div>
                  <div className={styles.userRoleSection}>
                    <RoleIndicator role={user.role} size="sm" variant="badge" showPermissions={true} />
                  </div>
                  <div className={styles.userBadgeSection}>
                    <RoleBadge role={user.role} size="xs" />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Permission Matrix */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Permission Matrix</h2>
            <div className={styles.tableContainer}>
              <table className={styles.permissionTable}>
                <thead>
                  <tr className={styles.tableHeader}>
                    <th className={styles.tableHeaderCell}>Role</th>
                    <th className={styles.tableHeaderCellCenter}>View Students</th>
                    <th className={styles.tableHeaderCellCenter}>Upload Data</th>
                    <th className={styles.tableHeaderCellCenter}>Edit Students</th>
                    <th className={styles.tableHeaderCellCenter}>Delete Students</th>
                    <th className={styles.tableHeaderCellCenter}>Manage Users</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { role: 'user', permissions: ['✓', '✗', '✗', '✗', '✗'] },
                    { role: 'admin', permissions: ['✓', '✓', '✓', '✗', '✗'] },
                    { role: 'superAdmin', permissions: ['✓', '✓', '✓', '✓', '✓'] }
                  ].map((row, index) => (
                    <tr key={index} className={styles.tableRow}>
                      <td className={styles.tableCell}>
                        <RoleBadge role={row.role} size="sm" />
                      </td>
                      {row.permissions.map((permission, pIndex) => (
                        <td key={pIndex} className={styles.tableCellCenter}>
                          <span className={`${styles.permissionIcon} ${permission === '✓' ? styles.permissionAllowed : styles.permissionDenied}`}>
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
