'use client';


import RoleIndicator from '@/components/RoleIndicator';
import RoleProtected from '@/components/RoleProtected';
import RoleStatsCard from '@/components/RoleStatsCard';
import UserProfileSection from '@/components/UserProfileSection';
import Hyperspeed from '@/components/ui/Hyperspeed';
import { useAuth } from '@/contexts/AuthContext';
import { useRole } from '@/hooks/useRole';
import { studentAPI } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [mounted, setMounted] = useState(false);
  const { user, logout } = useAuth();
  const { role, canUpload } = useRole();
  const router = useRouter();
  const hyperspeedRef = useRef(null);

  useEffect(() => {
    setMounted(true);
    
    // Check if user is OAuth and needs to complete setup
    if (user && user.isOAuthUser && !user.passwordSetupComplete) {
      router.push('/register?step=2');
    }
  }, [user, router]);
  
  const handleSearch = async (e) => {
    e && e.preventDefault();
    if (!searchQuery.trim()) return;

    // Trigger hyperspeed speed-up effect
    if (hyperspeedRef.current) {
      hyperspeedRef.current.speedUp();
    }

    setIsSearching(true);
    
    try {
      const response = await studentAPI.searchStudents({
        query: searchQuery.trim(),
        page: 1,
        limit: 10  // Since we expect only 1 exact match, smaller limit is fine
      });
      
      if (response.success) {
        setSearchResults(response.data);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error searching for student:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
      
      // Slow down hyperspeed effect after search completes
      setTimeout(() => {
        if (hyperspeedRef.current) {
          hyperspeedRef.current.slowDown();
        }
      }, 1000); // Keep the speed effect for 1 second after search completes
    }
  };

  return (
    <div className="min-h-[97vh] bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 relative">
      {/* Hyperspeed background */}
      <div className="fixed inset-0 z-0">
        <Hyperspeed
          ref={hyperspeedRef}
          effectOptions={{
            onSpeedUp: () => { },
            onSlowDown: () => { },
            distortion: 'turbulentDistortion',
            length: 400,
            roadWidth: 10,
            islandWidth: 2,
            lanesPerRoad: 4,
            fov: 90,
            fovSpeedUp: 150,
            speedUp: 2,
            carLightsFade: 0.4,
            totalSideLightSticks: 20,
            lightPairsPerRoadWay: 40,
            shoulderLinesWidthPercentage: 0.05,
            brokenLinesWidthPercentage: 0.1,
            brokenLinesLengthPercentage: 0.5,
            lightStickWidth: [0.12, 0.5],
            lightStickHeight: [1.3, 1.7],
            movingAwaySpeed: [60, 80],
            movingCloserSpeed: [-120, -160],
            carLightsLength: [400 * 0.03, 400 * 0.2],
            carLightsRadius: [0.05, 0.14],
            carWidthPercentage: [0.3, 0.5],
            carShiftX: [-0.8, 0.8],
            carFloorSeparation: [0, 5],
            colors: {
              roadColor: 0x080808,
              islandColor: 0x0a0a0a,
              background: 0x000000,
              shoulderLines: 0xFFFFFF,
              brokenLines: 0xFFFFFF,
              leftCars: [0xD856BF, 0x6750A2, 0xC247AC],
              rightCars: [0x03B3C3, 0x0E5EA5, 0x324555],
              sticks: 0x03B3C3,
            }
          }}
        />
      </div>

      {/* Main content */}
      <div className="relative z-10">
        {/* Header with conditional auth buttons */}
        <header className="pt-4 sm:pt-6 md:pt-8 pb-4 sm:pb-6">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Student Hub
              </h1>
              {user ? (
                <div className="flex items-center gap-6">
                  <UserProfileSection variant="horizontal" />
                  <div className="flex items-center gap-3">
                    <RoleProtected requiredRole="admin">
                      <button
                        onClick={() => router.push('/upload')}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
                      >
                        Upload Data
                      </button>
                    </RoleProtected>
                    <button
                      onClick={() => router.push(`/profile/${user.username}`)}
                      className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm"
                    >
                      Profile
                    </button>
                    <button
                      onClick={logout}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              ) : (
                <div></div>
              )}
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`text-center transform transition-all duration-1000 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'} mb-8 sm:mb-12`}>
            <h2 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-3 sm:mb-4 animate-pulse">
              Find Student Info
            </h2>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
              Connect, discover, and collaborate with students across campus. 
              Enter the exact UG number to find student information.
            </p>
          </div>
        </div>

        {/* Role Stats Section */}
        {user && (
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 mb-8">
            <div className={`max-w-2xl mx-auto transform transition-all duration-1000 delay-150 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
              <RoleStatsCard />
            </div>
          </div>
        )}

        {/* Search Section */}
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 md:py-12">
          <div className={`max-w-4xl mx-auto transform transition-all duration-1000 delay-300 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            {/* Search Form */}
            <form onSubmit={handleSearch} className="mb-6 sm:mb-8 md:mb-12">
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl sm:rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
                  <div className="relative bg-gray-800/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 border border-gray-700">
                    <div className="flex flex-col gap-3 sm:gap-4">
                      <div className="flex-1 relative">
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Enter exact UG number (e.g., UG/2023/001)..."
                          className="w-full px-3 sm:px-4 md:px-6 py-3 sm:py-3.5 md:py-4 bg-gray-700/50 border border-gray-600 rounded-lg sm:rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 text-sm sm:text-base md:text-lg min-h-[44px]"
                          style={{fontSize: '16px'}}
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 sm:pr-4 md:pr-6">
                          <svg className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                        </div>
                      </div>
                      <button
                        type="submit"
                        disabled={isSearching}
                        className="w-full px-4 sm:px-6 md:px-8 py-3 sm:py-3.5 md:py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg sm:rounded-xl hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base md:text-lg min-h-[48px] flex items-center justify-center"
                      >
                        {isSearching ? (
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-sm sm:text-base">Searching...</span>
                          </div>
                        ) : (
                          'Find Student'
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </form>

              {/* Search Results */}
              {searchQuery.trim() && searchResults.length === 0 && !isSearching && (
                <div className="text-center py-8 sm:py-12">
                  <div className="bg-gray-800/60 backdrop-blur-sm rounded-xl p-6 sm:p-8 border border-gray-700 max-w-md mx-auto">
                    <div className="w-16 h-16 bg-gradient-to-r from-orange-400 to-red-400 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.467-.881-6.077-2.33l-.853-.854A7.962 7.962 0 016 6c0-2.21.895-4.21 2.343-5.657L9.172 1.172a4 4 0 015.656 0L15.657.343A7.962 7.962 0 0118 6a7.96 7.96 0 01-.93 3.77l-.854.853z" />
                      </svg>
                    </div>
                    <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">No Student Found</h3>
                    <p className="text-gray-300 text-sm sm:text-base">
                      No student found with UG number &quot;{searchQuery.trim()}&quot;. 
                      Please check the UG number and try again.
                    </p>
                  </div>
                </div>
              )}
              
              {searchResults.length > 0 && (
                <div className="space-y-4 sm:space-y-6">
                  <h2 className="text-lg sm:text-2xl md:text-3xl font-bold text-white mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3 px-1 sm:px-2">
                    <span className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    <span className="text-sm sm:text-base md:text-lg">
                      Student Found
                    </span>
                  </h2>
                  <div className="grid gap-3 sm:gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                    {searchResults.map((student, index) => (
                      <div
                        key={student._id}
                        className={`transform transition-all duration-500 hover:scale-105 cursor-pointer ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}
                        style={{ animationDelay: `${index * 100}ms` }}
                        onClick={() => router.push(`/student/${student.ugNumber}`)}
                      >
                        <div className="bg-gray-800/60 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 border border-gray-700 hover:border-purple-500 transition-all duration-300 group h-full">
                          <div className="flex items-center gap-2 sm:gap-3 md:gap-4 mb-3 sm:mb-4">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-base md:text-lg flex-shrink-0">
                              {student.name.charAt(0)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3 className="text-sm sm:text-lg md:text-xl font-semibold text-white group-hover:text-purple-300 transition-colors truncate">
                                {student.name}
                              </h3>
                              <p className="text-purple-400 font-mono text-xs sm:text-sm truncate">{student.ugNumber}</p>
                            </div>
                          </div>
                          
                          <div className="space-y-1 sm:space-y-2 mb-3 sm:mb-4">
                            <div className="flex items-center gap-1 sm:gap-2 text-gray-300 text-xs sm:text-sm md:text-base">
                              <svg className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                              </svg>
                              <span className="truncate text-xs sm:text-sm">{student.branch}</span>
                            </div>
                            <div className="flex items-center gap-1 sm:gap-2 text-gray-300 text-xs sm:text-sm md:text-base">
                              <svg className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span className="text-xs sm:text-sm">{student.year}</span>
                            </div>
                            {student.division && (
                              <div className="flex items-center gap-1 sm:gap-2 text-gray-300 text-xs sm:text-sm md:text-base">
                                <svg className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h1a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                                <span className="text-xs sm:text-sm">Division {student.division}</span>
                              </div>
                            )}
                            {student.btechDiploma && (
                              <div className="flex items-center gap-1 sm:gap-2 text-gray-300 text-xs sm:text-sm md:text-base">
                                <svg className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                                </svg>
                                <span className="text-xs sm:text-sm">{student.btechDiploma}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
  );
}
