'use client';


import { useAuth } from '@/contexts/AuthContext';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

export default function StudentProfilePage() {
  const { ugNumber } = useParams();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);

  const fetchStudent = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch(`/api/students/${ugNumber}`);
      const data = await response.json();
      
      if (data.success) {
        setStudent(data.data);
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
          <main className="container mx-auto px-3 sm:px-4 md:px-6 py-6 sm:py-8 md:py-12">
            <div className={`max-w-4xl mx-auto transform transition-all duration-1000 delay-300 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
              {/* Profile Header */}
              <div className="relative group mb-6 sm:mb-8">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl sm:rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative bg-gray-800/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-6 sm:p-8 border border-gray-700">
                  <div className="flex flex-col md:flex-row items-center gap-6">
                    {/* Avatar */}
                    <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold text-3xl sm:text-4xl flex-shrink-0">
                      {student.name.charAt(0).toUpperCase()}
                    </div>
                    
                    {/* Basic Info */}
                    <div className="flex-1 text-center md:text-left">
                      <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2">
                        {student.name}
                      </h1>
                      <p className="text-purple-400 font-mono text-lg sm:text-xl mb-2">
                        {student.ugNumber}
                      </p>
                      <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-4">
                        <span className="px-3 py-1 bg-purple-600/30 text-purple-300 rounded-full text-sm">
                          {student.branch}
                        </span>
                        <span className="px-3 py-1 bg-blue-600/30 text-blue-300 rounded-full text-sm">
                          {student.year}
                        </span>
                        <span className="px-3 py-1 bg-green-600/30 text-green-300 rounded-full text-sm">
                          Division {student.division}
                        </span>
                        {student.btechDiploma && (
                          <span className="px-3 py-1 bg-orange-600/30 text-orange-300 rounded-full text-sm">
                            {student.btechDiploma}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Profile Details */}
              <div className="grid gap-6 md:grid-cols-2">
                {/* Academic Information */}
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                  <div className="relative bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
                    <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                      <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      Academic Information
                    </h2>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-400">UG Number:</span>
                        <span className="text-white font-mono">{student.ugNumber}</span>
                      </div>
                      {student.enrollmentNo && (
                        <div className="flex justify-between">
                          <span className="text-gray-400">Enrollment No:</span>
                          <span className="text-white font-mono">{student.enrollmentNo}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-400">Branch:</span>
                        <span className="text-white">{student.branch}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Division:</span>
                        <span className="text-white">{student.division}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Batch:</span>
                        <span className="text-white">{student.batch}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Year:</span>
                        <span className="text-white">{student.year}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Program:</span>
                        <span className="text-white">{student.btechDiploma}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-teal-600 rounded-xl blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                  <div className="relative bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
                    <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                      <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      Contact Information
                    </h2>
                    <div className="space-y-3">
                      {/* Email and Phone Number are hidden for privacy */}
                      {student.roomNumber && (
                        <div className="flex justify-between">
                          <span className="text-gray-400">Room Number:</span>
                          <span className="text-white">{student.roomNumber}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-400">MFT Name:</span>
                        <span className="text-white">{student.mftName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">MFT Contact:</span>
                        <span className="text-white">{student.mftContactNumber}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Information */}
                <div className="relative group md:col-span-2">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                  <div className="relative bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
                    <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                      <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Additional Information
                    </h2>
                    <div className="grid gap-4 md:grid-cols-2">
                      {student.timeTable && (
                        <div>
                          <span className="text-gray-400 block mb-1">Time Table:</span>
                          <a 
                            href={student.timeTable} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300 underline break-all"
                          >
                            View Timetable
                          </a>
                        </div>
                      )}
                      {student.dateOfAdmission && (
                        <div>
                          <span className="text-gray-400 block mb-1">Date of Admission:</span>
                          <span className="text-white">
                            {new Date(student.dateOfAdmission).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                      <div>
                        <span className="text-gray-400 block mb-1">Serial Number:</span>
                        <span className="text-white">{student.srNo}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block mb-1">Sequence in Division:</span>
                        <span className="text-white">{student.seqInDivision}</span>
                      </div>
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
