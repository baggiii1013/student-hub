import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { studentAPI } from '../api/axios'

const Home = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState([])
  const [mounted, setMounted] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  useEffect(() => {
    setMounted(true)
  }, [])
  
  const handleSearch = async (e) => {
    e.preventDefault()
    if (!searchQuery.trim()) return

    setIsSearching(true)
    
    try {
      // Search students using the API
      const response = await studentAPI.searchStudents({
        query: searchQuery.trim(),
        limit: 20
      });
      
      if (response.success) {        // Transform the data to match the expected format
        const transformedResults = response.data.map(student => ({
          id: student._id,
          name: student.name,
          ugNumber: student.ugNumber,
          course: student.branch,
          year: student.year,
          division: student.division,
          batch: student.batch,
          btechDiploma: student.btechDiploma
        }));
        
        setSearchResults(transformedResults);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error searching students:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
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
      <div className="relative z-10">        {/* Header with Logout */}
        <header className="pt-4 sm:pt-6 md:pt-8 pb-4 sm:pb-6">
          <div className="container mx-auto px-3 sm:px-6">
            {/* Navigation Bar */}
            <nav className={`flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4 mb-6 sm:mb-8 transform transition-all duration-1000 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
              <div className="text-lg sm:text-xl md:text-2xl font-bold text-white">
                Student Hub
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 w-full sm:w-auto">
                <span className="text-gray-300 text-xs sm:text-sm md:text-base text-center">Welcome, {user?.username}!</span>
                <div className="flex gap-2 w-full sm:w-auto max-w-xs sm:max-w-none">
                  <button
                    onClick={() => navigate(`/profile/${user?.username}`)}
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
              </div>
            </nav>
            
            <div className={`text-center transform transition-all duration-1000 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
              <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-3 sm:mb-4 animate-pulse">
                Student Hub
              </h1>
              <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed px-3 sm:px-4">
                Connect, discover, and collaborate with students across campus. 
                Search by UG number to find your peers instantly.
              </p>
            </div>
          </div>
        </header>        {/* Search Section */}
        <main className="container mx-auto px-3 sm:px-4 md:px-6 py-6 sm:py-8 md:py-12">
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
                        placeholder="Enter UG number (e.g., UG/2023/001) or student name..."
                        className="w-full px-3 sm:px-4 md:px-6 py-3 sm:py-3.5 md:py-4 bg-gray-700/50 border border-gray-600 rounded-lg sm:rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 text-sm sm:text-base md:text-lg min-h-[44px]"
                        style={{fontSize: '16px'}} // Prevent zoom on iOS
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
                        'Search Students'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </form>            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="space-y-4 sm:space-y-6">
                <h2 className="text-lg sm:text-2xl md:text-3xl font-bold text-white mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3 px-1 sm:px-2">
                  <span className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-xs sm:text-sm md:text-base font-bold">{searchResults.length}</span>
                  </span>
                  <span className="text-sm sm:text-base md:text-lg">Search Results</span>
                </h2>
                <div className="grid gap-3 sm:gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                  {searchResults.map((student, index) => (
                    <div
                      key={student.id}
                      className={`transform transition-all duration-500 hover:scale-105 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}
                      style={{ animationDelay: `${index * 100}ms` }}
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
                        </div>                        <div className="space-y-1 sm:space-y-2 mb-3 sm:mb-4">
                          <div className="flex items-center gap-1 sm:gap-2 text-gray-300 text-xs sm:text-sm md:text-base">
                            <svg className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                            <span className="truncate text-xs sm:text-sm">{student.course}</span>
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
                        </div>                        <button 
                          onClick={() => navigate(`/student/${student.ugNumber}`)}
                          className="w-full px-3 sm:px-4 py-2 sm:py-2.5 md:py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs sm:text-sm md:text-base rounded-md sm:rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 min-h-[44px] flex items-center justify-center"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}            {/* No results message */}
            {searchQuery && searchResults.length === 0 && !isSearching && (
              <div className="text-center py-6 sm:py-8 md:py-12 px-3 sm:px-4">
                <div className="w-12 h-12 sm:w-16 sm:h-16 md:w-24 md:h-24 mx-auto mb-3 sm:mb-4 md:mb-6 bg-gray-700 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 sm:w-8 sm:h-8 md:w-12 md:h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.453.901-6.007 2.375A9.95 9.95 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
                  </svg>
                </div>
                <h3 className="text-lg sm:text-xl md:text-2xl font-semibold text-white mb-2">No students found</h3>
                <p className="text-gray-400 text-sm sm:text-base">Try searching with a different UG number or name.</p>
              </div>
            )}

            {/* Quick Stats */}
            <div className={`mt-8 sm:mt-12 md:mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6 transform transition-all duration-1000 delay-600 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
              <div className="bg-gray-800/60 backdrop-blur-sm rounded-lg sm:rounded-xl p-4 sm:p-6 border border-gray-700 text-center group hover:border-blue-500 transition-all duration-300">
                <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 mx-auto mb-2 sm:mb-3 md:mb-4 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-base sm:text-lg md:text-xl font-semibold text-white mb-1 sm:mb-2">1,250+</h3>
                <p className="text-gray-400 text-xs sm:text-sm md:text-base">Active Students</p>
              </div>
              
              <div className="bg-gray-800/60 backdrop-blur-sm rounded-lg sm:rounded-xl p-4 sm:p-6 border border-gray-700 text-center group hover:border-green-500 transition-all duration-300">
                <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 mx-auto mb-2 sm:mb-3 md:mb-4 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h1a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h3 className="text-base sm:text-lg md:text-xl font-semibold text-white mb-1 sm:mb-2">50+</h3>
                <p className="text-gray-400 text-xs sm:text-sm md:text-base">Departments</p>
              </div>
              
              <div className="bg-gray-800/60 backdrop-blur-sm rounded-lg sm:rounded-xl p-4 sm:p-6 border border-gray-700 text-center group hover:border-purple-500 transition-all duration-300 sm:col-span-2 lg:col-span-1">
                <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 mx-auto mb-2 sm:mb-3 md:mb-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-base sm:text-lg md:text-xl font-semibold text-white mb-1 sm:mb-2">98%</h3>
                <p className="text-gray-400 text-xs sm:text-sm md:text-base">Success Rate</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default Home
