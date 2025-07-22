'use client';

import RoleIndicator from '@/components/RoleIndicator';
import { useAuth } from '@/contexts/AuthContext';
import { useRole } from '@/hooks/useRole';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import styles from './page.module.css';

// Helper components for editable fields - moved outside to prevent re-creation
const EditableField = ({ label, field, type = 'text', options = null, currentStudent, isEditing, isAdminOrHigher, handleFieldChange, user = null }) => {
  // Check if this is a sensitive field that requires login
  const sensitiveFields = [
    // Contact information
    'whatsappNumber', 'fatherNumber', 'motherNumber', 'email', 'phoneNumber',
    // Document verification status
    'tenthMarksheet', 'twelfthMarksheet', 'lcTcMigrationCertificate', 'casteCertificate', 'admissionLetter',
    // Personal sensitive information
    'caste', 'state'
  ];
  const isSensitiveField = sensitiveFields.includes(field);
  
  if (isEditing && isAdminOrHigher()) {
    if (type === 'select') {
      return (
        <div className={styles.field}>
          <span className={styles.fieldLabel}>{label}:</span>
          <select
            value={currentStudent[field] || ''}
            onChange={(e) => handleFieldChange(field, e.target.value)}
            className={styles.fieldSelect}
          >
            {options.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      );
    } else if (type === 'date') {
      return (
        <div className={styles.field}>
          <span className={styles.fieldLabel}>{label}:</span>
          <input
            type="date"
            value={currentStudent[field] ? new Date(currentStudent[field]).toISOString().split('T')[0] : ''}
            onChange={(e) => handleFieldChange(field, e.target.value ? new Date(e.target.value) : null)}
            className={styles.fieldInput}
          />
        </div>
      );
    } else {
      return (
        <div className={styles.field}>
          <span className={styles.fieldLabel}>{label}:</span>
          <input
            type={type}
            value={currentStudent[field] || ''}
            onChange={(e) => handleFieldChange(field, e.target.value)}
            className={styles.fieldInput}
          />
        </div>
      );
    }
  } else {
    // Display mode
    if (!currentStudent[field] && type !== 'select') return null;
    
    let displayValue = currentStudent[field];
    if (type === 'date' && displayValue) {
      displayValue = new Date(displayValue).toLocaleDateString();
    }
    
    // Check if user is logged in for sensitive fields
    if (isSensitiveField && !user) {
      return (
        <div className={styles.sensitiveField}>
          <span className={styles.fieldLabel}>{label}:</span>
          <div className={styles.sensitiveContent}>
            <span className={styles.maskedValue}>🔒 ••••••••••</span>
            <span className={styles.loginRequired}>
              Login Required
            </span>
          </div>
        </div>
      );
    }
    
    // Special handling for URL fields
    if (type === 'url' && displayValue) {
      return (
        <div className={styles.urlField}>
          <span className={styles.fieldLabel}>{label}:</span>
          <a 
            href={displayValue} 
            target="_blank" 
            rel="noopener noreferrer"
            className={styles.urlLink}
          >
            View {label}
          </a>
        </div>
      );
    }
    
    return (
      <div className={styles.field}>
        <span className={styles.fieldLabel}>{label}:</span>
        <span className={styles.fieldValue}>{displayValue}</span>
      </div>
    );
  }
};

const DocumentStatus = ({ label, field, currentStudent, isEditing, isAdminOrHigher, handleFieldChange, user = null }) => {
  // Return null if the field is undefined (user not authenticated)
  if (currentStudent[field] === undefined) {
    return (
      <div className={styles.documentStatus}>
        <span className={styles.documentLabel}>{label}:</span>
        <div className={styles.sensitiveContent}>
          <span className={styles.maskedValue}>🔒 Login Required</span>
        </div>
      </div>
    );
  }

  if (isEditing && isAdminOrHigher()) {
    const options = field === 'casteCertificate' 
      ? [
          { value: 'yes', label: 'Yes' },
          { value: 'no', label: 'No' },
          { value: 'NA', label: 'N/A' }
        ]
      : [
          { value: 'yes', label: 'Yes' },
          { value: 'no', label: 'No' }
        ];
    
    return (
      <div className={styles.documentStatus}>
        <span className={styles.documentLabel}>{label}:</span>
        <select
          value={currentStudent[field] || 'no'}
          onChange={(e) => handleFieldChange(field, e.target.value)}
          className={styles.documentSelect}
        >
          {options.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    );
  } else {
    return (
      <div className={styles.documentStatus}>
        <span className={styles.documentLabel}>{label}:</span>
        <span className={`${styles.statusBadge} ${
          currentStudent[field] === 'yes' 
            ? styles.verified
            : currentStudent[field] === 'NA'
            ? styles.na
            : styles.pending
        }`}>
          {currentStudent[field] === 'yes' ? '✓ Verified' : 
           currentStudent[field] === 'NA' ? 'N/A' : '✗ Pending'}
        </span>
      </div>
    );
  }
};

export default function StudentProfilePage() {
  const { ugNumber } = useParams();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { isAdminOrHigher } = useRole();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedStudent, setEditedStudent] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const fetchStudent = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('token');
      
      // First try auth context token
      let authToken = user?.token;
      
      // Fallback to localStorage if not in auth context
      if (!authToken) {
        authToken = token;
      }
      
      const headers = {
        ...(authToken && { Authorization: `Bearer ${authToken}` })
      };

      const response = await fetch(`/api/students/${ugNumber}`, {
        headers: headers
      });
      
      const data = await response.json();
      
      if (data.success) {
        setStudent(data.data);
        setEditedStudent(data.data);
      } else {
        setError(data.message || 'Student not found');
      }
    } catch (error) {
      console.error('Error fetching student:', error);
      setError('Failed to load student profile');
    } finally {
      setLoading(false);
    }
  }, [ugNumber]);

  const handleEdit = () => {
    setIsEditing(true);
    setEditedStudent({ ...student });
    setSaveError('');
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedStudent({ ...student });
    setSaveError('');
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setSaveError('');

      const response = await fetch(`/api/students/${ugNumber}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editedStudent),
      });

      const data = await response.json();

      if (data.success) {
        setStudent(data.data);
        setEditedStudent(data.data);
        setIsEditing(false);
      } else {
        setSaveError(data.message || 'Failed to save changes');
      }
    } catch (error) {
      console.error('Error saving student:', error);
      setSaveError('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleFieldChange = (field, value) => {
    setEditedStudent(prev => ({
      ...prev,
      [field]: value
    }));
  };

  useEffect(() => {
    setMounted(true);
    fetchStudent();
  }, [fetchStudent, user]);

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingText}>Loading student profile...</div>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorContent}>
          <div className={styles.errorMessage}>{error || 'Student not found'}</div>
          <button
            onClick={() => router.back()}
            className={styles.goBackBtn}
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const currentStudent = isEditing ? editedStudent : student;

  return (
    <div className={styles.container}>
        {/* Animated background elements */}
        <div className={styles.backgroundElements}>
          <div className={styles.backgroundInner}>
            <div className={`${styles.blob} ${styles.blob1}`}></div>
            <div className={`${styles.blob} ${styles.blob2}`}></div>
            <div className={`${styles.blob} ${styles.blob3}`}></div>
          </div>
        </div>

        {/* Main content */}
        <div className={styles.mainContent}>
          {/* Header */}
          <header className={styles.header}>
            <div className={styles.headerContainer}>
              <nav className={`${styles.nav} ${mounted ? styles.mounted : ''}`}>
                <div className={styles.navLeft}>
                  <button
                    onClick={() => router.back()}
                    className={styles.backButton}
                  >
                    <svg className={styles.backIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <div className={styles.pageTitle}>
                    Student Profile
                  </div>
                </div>
                <div className={styles.navRight}>
                  {user ? (
                    <>
                      <span className={styles.welcomeText}>Welcome, {user.username}!</span>
                      <div className={styles.buttonGroup}>
                        <button
                          onClick={() => router.push('/')}
                          className={`${styles.btn} ${styles.searchBtn}`}
                        >
                          Search
                        </button>
                        <button
                          onClick={() => router.push(`/profile/${user.username}`)}
                          className={`${styles.btn} ${styles.profileBtn}`}
                        >
                          My Profile
                        </button>
                        <button
                          onClick={logout}
                          className={`${styles.btn} ${styles.logoutBtn}`}
                        >
                          Logout
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className={styles.buttonGroup}>
                      <button
                        onClick={() => router.push('/')}
                        className={`${styles.btn} ${styles.searchBtn}`}
                      >
                        Search
                      </button>
                    </div>
                  )}
                </div>
              </nav>
            </div>
          </header>

          {/* Profile Content */}
          <main className={styles.main}>
            <div className={`${styles.profileContainer} ${mounted ? styles.mounted : ''}`}>
              {/* Profile Header */}
              <div className={styles.cardGroup}>
                <div className={styles.cardBg}></div>
                <div className={styles.card}>
                  <div className={styles.profileHeader}>
                    {/* Avatar */}
                    <div className={styles.avatar}>
                      {student.name.charAt(0).toUpperCase()}
                    </div>
                    
                    {/* Basic Info */}
                    <div className={styles.basicInfo}>
                      <h1 className={styles.studentName}>
                        {student.name}
                      </h1>
                      <p className={styles.ugNumber}>
                        {student.ugNumber}
                      </p>
                      <div className={styles.badges}>
                        <span className={`${styles.badge} ${styles.branchBadge}`}>
                          {student.branch}
                        </span>
                        <span className={`${styles.badge} ${styles.yearBadge}`}>
                          {student.year}
                        </span>
                        <span className={`${styles.badge} ${styles.divisionBadge}`}>
                          Division {student.division}
                        </span>
                        {student.btechDiploma && (
                          <span className={`${styles.badge} ${styles.programBadge}`}>
                            {student.btechDiploma}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Edit Controls - Only for admin and above */}
                    {isAdminOrHigher() && (
                      <div className={styles.editControls}>
                        <RoleIndicator size="sm" showPermissions={false} variant="badge" />
                        {!isEditing ? (
                          <button
                            onClick={handleEdit}
                            className={styles.editBtn}
                          >
                            <svg className={styles.editIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Edit Student
                          </button>
                        ) : (
                          <div className={styles.editButtonGroup}>
                            <button
                              onClick={handleSave}
                              disabled={saving}
                              className={styles.saveBtn}
                            >
                              <svg className={styles.editIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                              </svg>
                              {saving ? 'Saving...' : 'Save'}
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              disabled={saving}
                              className={styles.cancelBtn}
                            >
                              <svg className={styles.editIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                              Cancel
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Save Error Display */}
              {saveError && (
                <div className={styles.errorAlert}>
                  <p className={styles.errorText}>{saveError}</p>
                </div>
              )}

              {/* Profile Details */}
              <div className={styles.grid}>
                {/* Academic Information */}
                <div className={`${styles.cardGroup} ${styles.academicCard}`}>
                  <div className={styles.cardBg}></div>
                  <div className={styles.card}>
                    <h2 className={styles.sectionTitle}>
                      <svg className={`${styles.sectionIcon} ${styles.blueIcon}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      Academic Information
                    </h2>
                    <div className={styles.fieldList}>
                      <div className={styles.field}>
                        <span className={styles.fieldLabel}>UG Number:</span>
                        <span className={styles.fieldValue}>{student.ugNumber}</span>
                      </div>
                      
                      <EditableField 
                        label="Enrollment No" 
                        field="enrollmentNo"
                        currentStudent={currentStudent}
                        isEditing={isEditing}
                        isAdminOrHigher={isAdminOrHigher}
                        handleFieldChange={handleFieldChange}
                      />
                      
                      <EditableField 
                        label="Student Name" 
                        field="name"
                        currentStudent={currentStudent}
                        isEditing={isEditing}
                        isAdminOrHigher={isAdminOrHigher}
                        handleFieldChange={handleFieldChange}
                      />
                      
                      <EditableField 
                        label="Full Name (as per 12th)" 
                        field="fullNameAs12th"
                        currentStudent={currentStudent}
                        isEditing={isEditing}
                        isAdminOrHigher={isAdminOrHigher}
                        handleFieldChange={handleFieldChange}
                      />
                      
                      <EditableField 
                        label="Branch" 
                        field="branch" 
                        type="select"
                        options={[
                          { value: '', label: 'Select Branch' },
                          { value: 'CSE', label: 'Computer Science & Engineering' },
                          { value: 'CE', label: 'Computer Engineering' },
                          { value: 'AI', label: 'Artificial Intelligence' },
                          { value: 'CS', label: 'Cyber Security' },
                          { value: 'OTHER', label: 'Other' }
                        ]}
                        currentStudent={currentStudent}
                        isEditing={isEditing}
                        isAdminOrHigher={isAdminOrHigher}
                        handleFieldChange={handleFieldChange}
                      />
                      
                     {user && <EditableField 
                        label="Date of Birth" 
                        field="dateOfBirth" 
                        type="date"
                        currentStudent={currentStudent}
                        isEditing={isEditing}
                        isAdminOrHigher={isAdminOrHigher}
                        handleFieldChange={handleFieldChange}
                      />}
                      
                      {user && (
                        <EditableField 
                          label="Caste" 
                          field="caste" 
                          type="select"
                          options={[
                            { value: 'General(open)', label: 'General (Open)' },
                            { value: 'OBC', label: 'OBC' },
                            { value: 'SC', label: 'SC' },
                            { value: 'ST', label: 'ST' },
                            { value: 'EBC', label: 'EBC' },
                            { value: 'NT/DNT', label: 'NT/DNT' },
                            { value: 'Other', label: 'Other' }
                          ]}
                          currentStudent={currentStudent}
                          isEditing={isEditing}
                          isAdminOrHigher={isAdminOrHigher}
                          handleFieldChange={handleFieldChange}
                          user={user}
                        />
                      )}
                      
                      {user && (
                        <EditableField 
                          label="State" 
                          field="state"
                          currentStudent={currentStudent}
                          isEditing={isEditing}
                          isAdminOrHigher={isAdminOrHigher}
                          handleFieldChange={handleFieldChange}
                          user={user}
                        />
                      )}
                      
                      <EditableField 
                        label="Division" 
                        field="division"
                        currentStudent={currentStudent}
                        isEditing={isEditing}
                        isAdminOrHigher={isAdminOrHigher}
                        handleFieldChange={handleFieldChange}
                      />
                      
                      <EditableField 
                        label="Batch" 
                        field="batch" 
                        type="number"
                        currentStudent={currentStudent}
                        isEditing={isEditing}
                        isAdminOrHigher={isAdminOrHigher}
                        handleFieldChange={handleFieldChange}
                      />
                      
                      <EditableField 
                        label="Year" 
                        field="year"
                        currentStudent={currentStudent}
                        isEditing={isEditing}
                        isAdminOrHigher={isAdminOrHigher}
                        handleFieldChange={handleFieldChange}
                      />
                      
                      <EditableField 
                        label="Program" 
                        field="btechDiploma" 
                        type="select"
                        options={[
                          { value: 'BTech', label: 'B.Tech' },
                          { value: 'Diploma', label: 'Diploma' },
                          { value: 'D2D', label: 'D2D' }
                        ]}
                        currentStudent={currentStudent}
                        isEditing={isEditing}
                        isAdminOrHigher={isAdminOrHigher}
                        handleFieldChange={handleFieldChange}
                      />
                      
                      <EditableField 
                        label="Email" 
                        field="email" 
                        type="email"
                        currentStudent={currentStudent}
                        isEditing={isEditing}
                        isAdminOrHigher={isAdminOrHigher}
                        handleFieldChange={handleFieldChange}
                        user={user}
                      />
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className={`${styles.cardGroup} ${styles.contactCard}`}>
                  <div className={styles.cardBg}></div>
                  <div className={styles.card}>
                    <h2 className={styles.sectionTitle}>
                      <svg className={`${styles.sectionIcon} ${styles.greenIcon}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      Contact Information
                    </h2>
                    <div className={styles.fieldList}>
                      <EditableField 
                        label="WhatsApp Number" 
                        field="whatsappNumber" 
                        type="tel"
                        currentStudent={currentStudent}
                        isEditing={isEditing}
                        isAdminOrHigher={isAdminOrHigher}
                        handleFieldChange={handleFieldChange}
                        user={user}
                      />
                      
                      <EditableField 
                        label="Father's Number" 
                        field="fatherNumber" 
                        type="tel"
                        currentStudent={currentStudent}
                        isEditing={isEditing}
                        isAdminOrHigher={isAdminOrHigher}
                        handleFieldChange={handleFieldChange}
                        user={user}
                      />
                      
                      <EditableField 
                        label="Mother's Number" 
                        field="motherNumber" 
                        type="tel"
                        currentStudent={currentStudent}
                        isEditing={isEditing}
                        isAdminOrHigher={isAdminOrHigher}
                        handleFieldChange={handleFieldChange}
                        user={user}
                      />
                      
                      <EditableField 
                        label="Room Number" 
                        field="roomNumber"
                        currentStudent={currentStudent}
                        isEditing={isEditing}
                        isAdminOrHigher={isAdminOrHigher}
                        handleFieldChange={handleFieldChange}
                      />
                      
                      <EditableField 
                        label="MFT Name" 
                        field="mftName"
                        currentStudent={currentStudent}
                        isEditing={isEditing}
                        isAdminOrHigher={isAdminOrHigher}
                        handleFieldChange={handleFieldChange}
                      />
                      
                      <EditableField 
                        label="MFT Contact" 
                        field="mftContactNumber" 
                        type="tel"
                        currentStudent={currentStudent}
                        isEditing={isEditing}
                        isAdminOrHigher={isAdminOrHigher}
                        handleFieldChange={handleFieldChange}
                      />
                    </div>
                  </div>
                </div>

                {/* Document Verification Status - Only shown to logged in users */}
                {user && (
                  <div className={`${styles.cardGroup} ${styles.documentCard} ${styles.fullSpan}`}>
                    <div className={styles.cardBg}></div>
                    <div className={styles.card}>
                      <h2 className={styles.sectionTitle}>
                        <svg className={`${styles.sectionIcon} ${styles.orangeIcon}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Document Verification Status
                      </h2>
                      <div className={styles.documentGrid}>
                        <DocumentStatus 
                          label="10th Marksheet" 
                          field="tenthMarksheet"
                          currentStudent={currentStudent}
                          isEditing={isEditing}
                          isAdminOrHigher={isAdminOrHigher}
                          handleFieldChange={handleFieldChange}
                          user={user}
                        />
                        <DocumentStatus 
                          label="12th Marksheet" 
                          field="twelfthMarksheet"
                          currentStudent={currentStudent}
                          isEditing={isEditing}
                          isAdminOrHigher={isAdminOrHigher}
                          handleFieldChange={handleFieldChange}
                          user={user}
                        />
                        <DocumentStatus 
                          label="LC/TC/Migration" 
                          field="lcTcMigrationCertificate"
                          currentStudent={currentStudent}
                          isEditing={isEditing}
                          isAdminOrHigher={isAdminOrHigher}
                          handleFieldChange={handleFieldChange}
                          user={user}
                        />
                        <DocumentStatus 
                          label="Caste Certificate" 
                          field="casteCertificate"
                          currentStudent={currentStudent}
                          isEditing={isEditing}
                          isAdminOrHigher={isAdminOrHigher}
                          handleFieldChange={handleFieldChange}
                          user={user}
                        />
                        <DocumentStatus 
                          label="Admission Letter" 
                          field="admissionLetter"
                          currentStudent={currentStudent}
                          isEditing={isEditing}
                          isAdminOrHigher={isAdminOrHigher}
                          handleFieldChange={handleFieldChange}
                          user={user}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Additional Information */}
                <div className={`${styles.cardGroup} ${styles.additionalCard} ${styles.fullSpan}`}>
                  <div className={styles.cardBg}></div>
                  <div className={styles.card}>
                    <h2 className={styles.sectionTitle}>
                      <svg className={`${styles.sectionIcon} ${styles.purpleIcon}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Additional Information
                    </h2>
                    <div className={styles.additionalGrid}>
                      <EditableField 
                        label="Time Table" 
                        field="timeTable" 
                        type="url"
                        currentStudent={currentStudent}
                        isEditing={isEditing}
                        isAdminOrHigher={isAdminOrHigher}
                        handleFieldChange={handleFieldChange}
                      />
                      
                      <EditableField 
                        label="Date of Admission" 
                        field="dateOfAdmission" 
                        type="date"
                        currentStudent={currentStudent}
                        isEditing={isEditing}
                        isAdminOrHigher={isAdminOrHigher}
                        handleFieldChange={handleFieldChange}
                      />
                      
                      <EditableField 
                        label="Serial Number" 
                        field="srNo" 
                        type="number"
                        currentStudent={currentStudent}
                        isEditing={isEditing}
                        isAdminOrHigher={isAdminOrHigher}
                        handleFieldChange={handleFieldChange}
                      />
                      
                      <EditableField 
                        label="Sequence in Division" 
                        field="seqInDivision" 
                        type="number"
                        currentStudent={currentStudent}
                        isEditing={isEditing}
                        isAdminOrHigher={isAdminOrHigher}
                        handleFieldChange={handleFieldChange}
                      />
                      
                      <EditableField 
                        label="Phone Number" 
                        field="phoneNumber" 
                        type="tel"
                        currentStudent={currentStudent}
                        isEditing={isEditing}
                        isAdminOrHigher={isAdminOrHigher}
                        handleFieldChange={handleFieldChange}
                        user={user}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
  );
}
