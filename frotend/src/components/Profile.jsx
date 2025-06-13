import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../api/axios';

const Profile = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    fullName: '',
    ugNumber: '',
    course: '',
    year: '',
    department: '',
    phone: '',
    bio: '',
    interests: '',
    skills: '',
    socialLinks: {
      github: '',
      linkedin: '',
      twitter: ''
    }
  });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTimeout(() => setMounted(true), 100);
    loadProfileData();
  }, [slug]);  const loadProfileData = async () => {
    setLoading(true);
    try {
      // Try to fetch from API first
      const profile = await authAPI.getUserProfile(slug);
      setProfileData(profile);
      setFormData(profile);
    } catch (error) {
      console.error('Error loading profile:', error);
      
      // If API fails, fall back to mock data for demo purposes
      if (error.response?.status === 404) {
        const mockProfileData = {
          'john-doe': {
            id: 1,
            username: 'john-doe',
            email: 'john.doe@student.ac.ug',
            fullName: 'John Doe',
            ugNumber: 'UG/2023/001',
            course: 'Computer Science',
            year: '3rd Year',
            department: 'School of Computing and Informatics Technology',
            phone: '+256 700 123 456',
            bio: 'Passionate computer science student with interests in web development and artificial intelligence.',
            interests: 'Web Development, AI/ML, Mobile Apps, Gaming',
            skills: 'JavaScript, Python, React, Node.js, MongoDB',
            socialLinks: {
              github: 'https://github.com/johndoe',
              linkedin: 'https://linkedin.com/in/johndoe',
              twitter: 'https://twitter.com/johndoe'
            }
          },
          'jane-smith': {
            id: 2,
            username: 'jane-smith',
            email: 'jane.smith@student.ac.ug',
            fullName: 'Jane Smith',
            ugNumber: 'UG/2023/002',
            course: 'Information Technology',
            year: '2nd Year',
            department: 'School of Computing and Informatics Technology',
            phone: '+256 700 789 012',
            bio: 'IT student focused on cybersecurity and network administration.',
            interests: 'Cybersecurity, Networks, Cloud Computing, IoT',
            skills: 'Python, Java, Network Security, Linux, AWS',
            socialLinks: {
              github: 'https://github.com/janesmith',
              linkedin: 'https://linkedin.com/in/janesmith',
              twitter: ''
            }
          },
          'bob-johnson': {
            id: 3,
            username: 'bob-johnson',
            email: 'bob.johnson@student.ac.ug',
            fullName: 'Bob Johnson',
            ugNumber: 'UG/2023/003',
            course: 'Software Engineering',
            year: '4th Year',
            department: 'School of Computing and Informatics Technology',
            phone: '+256 700 345 678',
            bio: 'Final year software engineering student specializing in mobile app development and DevOps.',
            interests: 'Mobile Development, DevOps, Cloud Architecture, Agile',
            skills: 'React Native, Flutter, Docker, Kubernetes, CI/CD',
            socialLinks: {
              github: 'https://github.com/bobjohnson',
              linkedin: 'https://linkedin.com/in/bobjohnson',
              twitter: 'https://twitter.com/bobjohnson'
            }
          }
        };

        const mockProfile = mockProfileData[slug];
        if (mockProfile) {
          setProfileData(mockProfile);
          setFormData(mockProfile);
        } else {
          setProfileData(null);
        }
      } else {
        setProfileData(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('socialLinks.')) {
      const socialField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        socialLinks: {
          ...prev.socialLinks,
          [socialField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  const handleSave = async () => {
    try {
      // Extract only the fields we want to save (excluding id and username)
      const { id, username, ...profileDataToSave } = formData;
      
      const updatedProfile = await authAPI.updateUserProfile(slug, profileDataToSave);
      setProfileData(updatedProfile);
      setIsEditing(false);
      console.log('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      // You could add a toast notification here
      alert('Failed to update profile. Please try again.');
    }
  };

  const isOwnProfile = user?.username === profileData?.username;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-xl">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 mx-auto mb-6 bg-gray-700 rounded-full flex items-center justify-center">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-2xl font-semibold text-white mb-2">Profile Not Found</h3>
          <p className="text-gray-400 mb-6">The profile you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-300 transform hover:scale-105"
          >
            Back to Home
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
      <div className="relative z-10">        {/* Header */}
        <header className="pt-4 sm:pt-6 md:pt-8 pb-3 sm:pb-4 md:pb-6">
          <div className="container mx-auto px-3 sm:px-4 md:px-6">
            <nav className={`flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4 mb-4 sm:mb-6 md:mb-8 transform transition-all duration-1000 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
              <button
                onClick={() => navigate('/')}
                className="flex items-center gap-2 text-white hover:text-purple-300 transition-colors text-sm sm:text-base min-h-[44px] px-2"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span className="hidden sm:inline">Back to Home</span>
                <span className="sm:hidden">Back</span>
              </button>
              <div className="text-lg sm:text-xl md:text-2xl font-bold text-white">
                Student Hub
              </div>
              <div className="flex items-center gap-2 sm:gap-4">
                <span className="text-gray-300 text-xs sm:text-sm md:text-base text-center">Welcome, {user?.username}!</span>
              </div>
            </nav>
          </div>
        </header>        {/* Profile Content */}
        <main className="container mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
          <div className={`max-w-4xl mx-auto transform transition-all duration-1000 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            {/* Profile Header */}
            <div className="relative group mb-4 sm:mb-6 md:mb-8">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl sm:rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative bg-gray-800/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 border border-gray-700">
                <div className="flex flex-col items-center gap-3 sm:gap-4 md:gap-6">
                  {/* Profile Picture */}
                  <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-32 lg:h-32 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white text-lg sm:text-xl md:text-2xl lg:text-4xl font-bold">
                    {profileData.fullName.split(' ').map(n => n[0]).join('')}
                  </div>
                  
                  {/* Basic Info */}
                  <div className="flex-1 text-center w-full">
                    <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-white mb-1 sm:mb-2 px-2">{profileData.fullName}</h1>
                    <p className="text-purple-400 font-mono text-sm sm:text-base md:text-lg mb-1 sm:mb-2">{profileData.ugNumber}</p>
                    <p className="text-gray-300 text-sm sm:text-base md:text-lg px-2">{profileData.course} • {profileData.year}</p>
                    <p className="text-gray-400 text-xs sm:text-sm md:text-base px-2 mt-1">{profileData.department}</p>
                    
                    {/* Edit Button */}
                    {isOwnProfile && (
                      <button
                        onClick={() => setIsEditing(!isEditing)}
                        className="mt-3 sm:mt-4 px-4 sm:px-6 py-2 sm:py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm sm:text-base rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 min-h-[44px] flex items-center justify-center"
                      >
                        {isEditing ? 'Cancel Edit' : 'Edit Profile'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>            {/* Profile Form/Display */}
            <div className="space-y-4 sm:space-y-6 md:space-y-8">
              {/* Contact Information */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl sm:rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative bg-gray-800/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 border border-gray-700">
                  <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-3 sm:mb-4 md:mb-6">Contact Information</h2>
                  <div className="grid grid-cols-1 gap-3 sm:gap-4 md:gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                      {isEditing ? (
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-700/50 border border-gray-600 rounded-lg sm:rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 text-sm sm:text-base min-h-[44px]"
                          style={{fontSize: '16px'}} // Prevent zoom on iOS
                        />
                      ) : (
                        <p className="text-white bg-gray-700/30 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl text-sm sm:text-base min-h-[44px] flex items-center">{profileData.email}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Phone</label>
                      {isEditing ? (
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-700/50 border border-gray-600 rounded-lg sm:rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 text-sm sm:text-base min-h-[44px]"
                          style={{fontSize: '16px'}} // Prevent zoom on iOS
                        />
                      ) : (
                        <p className="text-white bg-gray-700/30 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl text-sm sm:text-base min-h-[44px] flex items-center">{profileData.phone}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>              {/* Academic Information */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl sm:rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative bg-gray-800/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 border border-gray-700">
                  <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-3 sm:mb-4 md:mb-6">Academic Information</h2>
                  <div className="grid grid-cols-1 gap-3 sm:gap-4 md:gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Course</label>
                      {isEditing ? (
                        <input
                          type="text"
                          name="course"
                          value={formData.course}
                          onChange={handleInputChange}
                          className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-700/50 border border-gray-600 rounded-lg sm:rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 text-sm sm:text-base min-h-[44px]"
                          style={{fontSize: '16px'}} // Prevent zoom on iOS
                        />
                      ) : (
                        <p className="text-white bg-gray-700/30 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl text-sm sm:text-base min-h-[44px] flex items-center">{profileData.course}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Year</label>
                      {isEditing ? (
                        <select
                          name="year"
                          value={formData.year}
                          onChange={handleInputChange}
                          className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-700/50 border border-gray-600 rounded-lg sm:rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 text-sm sm:text-base min-h-[44px]"
                          style={{fontSize: '16px'}} // Prevent zoom on iOS
                        >
                          <option value="1st Year">1st Year</option>
                          <option value="2nd Year">2nd Year</option>
                          <option value="3rd Year">3rd Year</option>
                          <option value="4th Year">4th Year</option>
                          <option value="5th Year">5th Year</option>
                        </select>
                      ) : (
                        <p className="text-white bg-gray-700/30 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl text-sm sm:text-base min-h-[44px] flex items-center">{profileData.year}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>              {/* About */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-orange-600 to-red-600 rounded-xl sm:rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative bg-gray-800/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 border border-gray-700">
                  <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-3 sm:mb-4 md:mb-6">About</h2>
                  <div className="space-y-3 sm:space-y-4 md:space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Bio</label>
                      {isEditing ? (
                        <textarea
                          name="bio"
                          value={formData.bio}
                          onChange={handleInputChange}
                          rows="3"
                          className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-700/50 border border-gray-600 rounded-lg sm:rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 text-sm sm:text-base resize-y"
                          style={{fontSize: '16px'}} // Prevent zoom on iOS
                        />
                      ) : (
                        <p className="text-white bg-gray-700/30 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl text-sm sm:text-base min-h-[44px]">{profileData.bio}</p>
                      )}
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:gap-4 md:gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Interests</label>
                        {isEditing ? (
                          <input
                            type="text"
                            name="interests"
                            value={formData.interests}
                            onChange={handleInputChange}
                            placeholder="e.g., Web Development, AI, Gaming"
                            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-700/50 border border-gray-600 rounded-lg sm:rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 text-sm sm:text-base min-h-[44px]"
                            style={{fontSize: '16px'}} // Prevent zoom on iOS
                          />
                        ) : (
                          <p className="text-white bg-gray-700/30 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl text-sm sm:text-base min-h-[44px] flex items-center">{profileData.interests}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Skills</label>
                        {isEditing ? (
                          <input
                            type="text"
                            name="skills"
                            value={formData.skills}
                            onChange={handleInputChange}
                            placeholder="e.g., JavaScript, Python, React"
                            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-700/50 border border-gray-600 rounded-lg sm:rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 text-sm sm:text-base min-h-[44px]"
                            style={{fontSize: '16px'}} // Prevent zoom on iOS
                          />
                        ) : (
                          <p className="text-white bg-gray-700/30 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl text-sm sm:text-base min-h-[44px] flex items-center">{profileData.skills}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>              {/* Social Links */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl sm:rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative bg-gray-800/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 border border-gray-700">
                  <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-3 sm:mb-4 md:mb-6">Social Links</h2>
                  <div className="grid grid-cols-1 gap-3 sm:gap-4 md:gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">GitHub</label>
                      {isEditing ? (
                        <input
                          type="url"
                          name="socialLinks.github"
                          value={formData.socialLinks.github}
                          onChange={handleInputChange}
                          placeholder="https://github.com/username"
                          className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-700/50 border border-gray-600 rounded-lg sm:rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 text-sm sm:text-base min-h-[44px]"
                          style={{fontSize: '16px'}} // Prevent zoom on iOS
                        />
                      ) : (
                        <div className="text-white bg-gray-700/30 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl text-sm sm:text-base min-h-[44px] flex items-center">
                          {profileData.socialLinks.github ? (
                            <a href={profileData.socialLinks.github} target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 transition-colors break-all">
                              {profileData.socialLinks.github}
                            </a>
                          ) : (
                            <span className="text-gray-400">Not provided</span>
                          )}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">LinkedIn</label>
                      {isEditing ? (
                        <input
                          type="url"
                          name="socialLinks.linkedin"
                          value={formData.socialLinks.linkedin}
                          onChange={handleInputChange}
                          placeholder="https://linkedin.com/in/username"
                          className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-700/50 border border-gray-600 rounded-lg sm:rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 text-sm sm:text-base min-h-[44px]"
                          style={{fontSize: '16px'}} // Prevent zoom on iOS
                        />
                      ) : (
                        <div className="text-white bg-gray-700/30 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl text-sm sm:text-base min-h-[44px] flex items-center">
                          {profileData.socialLinks.linkedin ? (
                            <a href={profileData.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 transition-colors break-all">
                              {profileData.socialLinks.linkedin}
                            </a>
                          ) : (
                            <span className="text-gray-400">Not provided</span>
                          )}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Twitter</label>
                      {isEditing ? (
                        <input
                          type="url"
                          name="socialLinks.twitter"
                          value={formData.socialLinks.twitter}
                          onChange={handleInputChange}
                          placeholder="https://twitter.com/username"
                          className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-700/50 border border-gray-600 rounded-lg sm:rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 text-sm sm:text-base min-h-[44px]"
                          style={{fontSize: '16px'}} // Prevent zoom on iOS
                        />
                      ) : (
                        <div className="text-white bg-gray-700/30 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl text-sm sm:text-base min-h-[44px] flex items-center">
                          {profileData.socialLinks.twitter ? (
                            <a href={profileData.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 transition-colors break-all">
                              {profileData.socialLinks.twitter}
                            </a>
                          ) : (
                            <span className="text-gray-400">Not provided</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Save Button */}
              {isEditing && (
                <div className="flex justify-center px-3 sm:px-0">
                  <button
                    onClick={handleSave}
                    className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold text-sm sm:text-base md:text-lg rounded-lg sm:rounded-xl hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition-all duration-300 transform hover:scale-105 min-h-[48px] flex items-center justify-center"
                  >
                    Save Changes
                  </button>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Profile;
