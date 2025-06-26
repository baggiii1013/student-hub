'use client';


import RoleIndicator from '@/components/RoleIndicator';
import { useAuth } from '@/contexts/AuthContext';
import { useRole } from '@/hooks/useRole';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

// Helper components for editable fields - moved outside to prevent re-creation
const EditableField = ({ label, field, type = 'text', options = null, currentStudent, isEditing, isAdminOrHigher, handleFieldChange, user = null }) => {
  // Check if this is a sensitive field that requires login
  const sensitiveFields = ['whatsappNumber', 'fatherNumber', 'motherNumber', 'email', 'phoneNumber'];
  const isSensitiveField = sensitiveFields.includes(field);
  
  if (isEditing && isAdminOrHigher()) {
    if (type === 'select') {
      return (
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0">
          <span className="text-gray-400 text-sm sm:text-base">{label}:</span>
          <select
            value={currentStudent[field] || ''}
            onChange={(e) => handleFieldChange(field, e.target.value)}
            className="bg-gray-700 text-white px-2 py-1 rounded border border-gray-600 focus:border-purple-500 focus:outline-none text-sm sm:text-base w-full sm:w-auto sm:max-w-48"
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
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0">
          <span className="text-gray-400 text-sm sm:text-base">{label}:</span>
          <input
            type="date"
            value={currentStudent[field] ? new Date(currentStudent[field]).toISOString().split('T')[0] : ''}
            onChange={(e) => handleFieldChange(field, e.target.value ? new Date(e.target.value) : null)}
            className="bg-gray-700 text-white px-2 py-1 rounded border border-gray-600 focus:border-purple-500 focus:outline-none text-sm sm:text-base w-full sm:w-auto"
          />
        </div>
      );
    } else {
      return (
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0">
          <span className="text-gray-400 text-sm sm:text-base">{label}:</span>
          <input
            type={type}
            value={currentStudent[field] || ''}
            onChange={(e) => handleFieldChange(field, e.target.value)}
            className="bg-gray-700 text-white px-2 py-1 rounded border border-gray-600 focus:border-purple-500 focus:outline-none text-sm sm:text-base w-full sm:w-auto sm:max-w-48"
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
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2">
          <span className="text-gray-400 text-sm sm:text-base">{label}:</span>
          <div className="flex items-center gap-2">
            <span className="text-orange-400 font-mono text-xs sm:text-sm">🔒 ••••••••••</span>
            <span className="text-xs text-orange-300 bg-orange-900/30 px-2 py-1 rounded whitespace-nowrap">
              Login Required
            </span>
          </div>
        </div>
      );
    }
    
    // Special handling for URL fields
    if (type === 'url' && displayValue) {
      return (
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 sm:gap-2">
          <span className="text-gray-400 text-sm sm:text-base">{label}:</span>
          <a 
            href={displayValue} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 underline break-all text-sm sm:text-base sm:max-w-48 sm:text-right"
          >
            View {label}
          </a>
        </div>
      );
    }
    
    return (
      <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
        <span className="text-gray-400 text-sm sm:text-base">{label}:</span>
        <span className="text-white font-mono text-sm sm:text-base break-all">{displayValue}</span>
      </div>
    );
  }
};

const DocumentStatus = ({ label, field, currentStudent, isEditing, isAdminOrHigher, handleFieldChange }) => {
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
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 p-3 bg-gray-700/50 rounded-lg">
        <span className="text-gray-300 text-sm sm:text-base">{label}:</span>
        <select
          value={currentStudent[field] || 'no'}
          onChange={(e) => handleFieldChange(field, e.target.value)}
          className="bg-gray-600 text-white px-2 py-1 rounded border border-gray-500 focus:border-purple-500 focus:outline-none text-sm sm:text-base w-full sm:w-auto"
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
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 p-3 bg-gray-700/50 rounded-lg">
        <span className="text-gray-300 text-sm sm:text-base">{label}:</span>
        <span className={`px-2 py-1 rounded-full text-xs font-medium text-center sm:text-left ${
          currentStudent[field] === 'yes' 
            ? 'bg-green-100 text-green-700' 
            : currentStudent[field] === 'NA'
            ? 'bg-gray-100 text-gray-700'
            : 'bg-red-100 text-red-700'
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
      
      const response = await fetch(`/api/students/${ugNumber}`);
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
  }, [fetchStudent]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading student profile...</div>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-xl mb-4">{error || 'Student not found'}</div>
          <button
            onClick={() => router.back()}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-300"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const currentStudent = isEditing ? editedStudent : student;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -inset-10 opacity-50">
            <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
            <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
            <div className="absolute -bottom-8 left-1/3 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
          </div>
        </div>

        {/* Main content */}
        <div className="relative z-10">
          {/* Header */}
          <header className="pt-4 sm:pt-6 md:pt-8 pb-4 sm:pb-6">
            <div className="container mx-auto px-3 sm:px-6">
              <nav className={`flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4 mb-6 sm:mb-8 transform transition-all duration-1000 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => router.back()}
                    className="text-white hover:text-purple-300 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <div className="text-lg sm:text-xl md:text-2xl font-bold text-white">
                    Student Profile
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 w-full sm:w-auto">
                  {user ? (
                    <>
                      <span className="text-gray-300 text-xs sm:text-sm md:text-base text-center">Welcome, {user.username}!</span>
                      <div className="flex gap-2 w-full sm:w-auto max-w-xs sm:max-w-none">
                        <button
                          onClick={() => router.push('/')}
                          className="flex-1 sm:flex-initial px-3 sm:px-4 py-2 sm:py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs sm:text-sm md:text-base rounded-lg transition-all duration-300 transform hover:scale-105 min-h-[44px] flex items-center justify-center"
                        >
                          Search
                        </button>
                        <button
                          onClick={() => router.push(`/profile/${user.username}`)}
                          className="flex-1 sm:flex-initial px-3 sm:px-4 py-2 sm:py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-xs sm:text-sm md:text-base rounded-lg transition-all duration-300 transform hover:scale-105 min-h-[44px] flex items-center justify-center"
                        >
                          My Profile
                        </button>
                        <button
                          onClick={logout}
                          className="flex-1 sm:flex-initial px-3 sm:px-4 py-2 sm:py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm md:text-base rounded-lg transition-all duration-300 transform hover:scale-105 min-h-[44px] flex items-center justify-center"
                        >
                          Logout
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="flex gap-2 w-full sm:w-auto max-w-xs sm:max-w-none">
                      <button
                        onClick={() => router.push('/')}
                        className="flex-1 sm:flex-initial px-3 sm:px-4 py-2 sm:py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs sm:text-sm md:text-base rounded-lg transition-all duration-300 transform hover:scale-105 min-h-[44px] flex items-center justify-center"
                      >
                        Search
                      </button>
                      <button
                        onClick={() => router.push('/login')}
                        className="flex-1 sm:flex-initial px-3 sm:px-4 py-2 sm:py-2.5 bg-green-600 hover:bg-green-700 text-white text-xs sm:text-sm md:text-base rounded-lg transition-all duration-300 transform hover:scale-105 min-h-[44px] flex items-center justify-center"
                      >
                        Login
                      </button>
                      <button
                        onClick={() => router.push('/register')}
                        className="flex-1 sm:flex-initial px-3 sm:px-4 py-2 sm:py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs sm:text-sm md:text-base rounded-lg transition-all duration-300 transform hover:scale-105 min-h-[44px] flex items-center justify-center"
                      >
                        Register
                      </button>
                    </div>
                  )}
                </div>
              </nav>
            </div>
          </header>

          {/* Profile Content */}
          <main className="container mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8 lg:py-12">
            <div className={`max-w-4xl mx-auto transform transition-all duration-1000 delay-300 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
              {/* Profile Header */}
              <div className="relative group mb-6 sm:mb-8">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl sm:rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative bg-gray-800/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 border border-gray-700">
                  <div className="flex flex-col md:flex-row items-center gap-4 sm:gap-6">
                    {/* Avatar */}
                    <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold text-2xl sm:text-3xl md:text-4xl flex-shrink-0">
                      {student.name.charAt(0).toUpperCase()}
                    </div>
                    
                    {/* Basic Info */}
                    <div className="flex-1 text-center md:text-left">
                      <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-2 break-words">
                        {student.name}
                      </h1>
                      <p className="text-purple-400 font-mono text-base sm:text-lg md:text-xl mb-2 break-all">
                        {student.ugNumber}
                      </p>
                      <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-4">
                        <span className="px-2 sm:px-3 py-1 bg-purple-600/30 text-purple-300 rounded-full text-xs sm:text-sm">
                          {student.branch}
                        </span>
                        <span className="px-2 sm:px-3 py-1 bg-blue-600/30 text-blue-300 rounded-full text-xs sm:text-sm">
                          {student.year}
                        </span>
                        <span className="px-2 sm:px-3 py-1 bg-green-600/30 text-green-300 rounded-full text-xs sm:text-sm">
                          Division {student.division}
                        </span>
                        {student.btechDiploma && (
                          <span className="px-2 sm:px-3 py-1 bg-orange-600/30 text-orange-300 rounded-full text-xs sm:text-sm">
                            {student.btechDiploma}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Edit Controls - Only for admin and above */}
                    {isAdminOrHigher() && (
                      <div className="flex flex-col gap-2 items-center w-full md:w-auto">
                        <RoleIndicator size="sm" showPermissions={false} variant="badge" />
                        {!isEditing ? (
                          <button
                            onClick={handleEdit}
                            className="w-full md:w-auto px-3 sm:px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
                          >
                            <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Edit Student
                          </button>
                        ) : (
                          <div className="flex gap-2 w-full md:w-auto">
                            <button
                              onClick={handleSave}
                              disabled={saving}
                              className="flex-1 md:flex-initial px-3 sm:px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
                            >
                              <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                              </svg>
                              {saving ? 'Saving...' : 'Save'}
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              disabled={saving}
                              className="flex-1 md:flex-initial px-3 sm:px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:opacity-50 text-white rounded-lg transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
                            >
                              <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-600/20 border border-red-600 rounded-lg">
                  <p className="text-red-300 text-sm sm:text-base break-words">{saveError}</p>
                </div>
              )}

              {/* Profile Details */}
              <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
                {/* Academic Information */}
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                  <div className="relative bg-gray-800/80 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-gray-700">
                    <h2 className="text-lg sm:text-xl font-bold text-white mb-4 flex items-center gap-2">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      Academic Information
                    </h2>
                    <div className="space-y-3">
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                        <span className="text-gray-400 text-sm sm:text-base">UG Number:</span>
                        <span className="text-white font-mono text-sm sm:text-base break-all">{student.ugNumber}</span>
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
                          { value: 'OTHER', label: 'Other' }
                        ]}
                        currentStudent={currentStudent}
                        isEditing={isEditing}
                        isAdminOrHigher={isAdminOrHigher}
                        handleFieldChange={handleFieldChange}
                      />
                      
                      <EditableField 
                        label="Date of Birth" 
                        field="dateOfBirth" 
                        type="date"
                        currentStudent={currentStudent}
                        isEditing={isEditing}
                        isAdminOrHigher={isAdminOrHigher}
                        handleFieldChange={handleFieldChange}
                      />
                      
                      <EditableField 
                        label="Caste" 
                        field="caste" 
                        type="select"
                        options={[
                          { value: 'General(open)', label: 'General (Open)' },
                          { value: 'OBC', label: 'OBC' },
                          { value: 'SC', label: 'SC' },
                          { value: 'ST', label: 'ST' },
                          { value: 'Other', label: 'Other' }
                        ]}
                        currentStudent={currentStudent}
                        isEditing={isEditing}
                        isAdminOrHigher={isAdminOrHigher}
                        handleFieldChange={handleFieldChange}
                      />
                      
                      <EditableField 
                        label="State" 
                        field="state"
                        currentStudent={currentStudent}
                        isEditing={isEditing}
                        isAdminOrHigher={isAdminOrHigher}
                        handleFieldChange={handleFieldChange}
                      />
                      
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
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-teal-600 rounded-xl blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                  <div className="relative bg-gray-800/80 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-gray-700">
                    <h2 className="text-lg sm:text-xl font-bold text-white mb-4 flex items-center gap-2">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      Contact Information
                    </h2>
                    <div className="space-y-3">
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

                {/* Document Verification Status */}
                <div className="relative group md:col-span-2">
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-600 to-red-600 rounded-xl blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                  <div className="relative bg-gray-800/80 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-gray-700">
                    <h2 className="text-lg sm:text-xl font-bold text-white mb-4 flex items-center gap-2">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Document Verification Status
                    </h2>
                    <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                      <DocumentStatus 
                        label="10th Marksheet" 
                        field="tenthMarksheet"
                        currentStudent={currentStudent}
                        isEditing={isEditing}
                        isAdminOrHigher={isAdminOrHigher}
                        handleFieldChange={handleFieldChange}
                      />
                      <DocumentStatus 
                        label="12th Marksheet" 
                        field="twelfthMarksheet"
                        currentStudent={currentStudent}
                        isEditing={isEditing}
                        isAdminOrHigher={isAdminOrHigher}
                        handleFieldChange={handleFieldChange}
                      />
                      <DocumentStatus 
                        label="LC/TC/Migration" 
                        field="lcTcMigrationCertificate"
                        currentStudent={currentStudent}
                        isEditing={isEditing}
                        isAdminOrHigher={isAdminOrHigher}
                        handleFieldChange={handleFieldChange}
                      />
                      <DocumentStatus 
                        label="Caste Certificate" 
                        field="casteCertificate"
                        currentStudent={currentStudent}
                        isEditing={isEditing}
                        isAdminOrHigher={isAdminOrHigher}
                        handleFieldChange={handleFieldChange}
                      />
                      <DocumentStatus 
                        label="Admission Letter" 
                        field="admissionLetter"
                        currentStudent={currentStudent}
                        isEditing={isEditing}
                        isAdminOrHigher={isAdminOrHigher}
                        handleFieldChange={handleFieldChange}
                      />
                    </div>
                  </div>
                </div>

                {/* Additional Information */}
                <div className="relative group md:col-span-2">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                  <div className="relative bg-gray-800/80 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-gray-700">
                    <h2 className="text-lg sm:text-xl font-bold text-white mb-4 flex items-center gap-2">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Additional Information
                    </h2>
                    <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2">
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
