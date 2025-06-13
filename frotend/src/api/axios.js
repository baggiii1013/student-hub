import axios from 'axios';

const API_BASE_URL = 'http://localhost:1013/api';

// Create axios instance for users
const userApi = axios.create({
  baseURL: `${API_BASE_URL}/users`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Create axios instance for students
const studentApi = axios.create({
  baseURL: `${API_BASE_URL}/students`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include token for user API
userApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add request interceptor to include token for student API
studentApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle errors for both APIs
const handleResponseError = (error) => {
  if (error.response?.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    // Only redirect if we're not already on login page
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  }
  return Promise.reject(error);
};

userApi.interceptors.response.use((response) => response, handleResponseError);
studentApi.interceptors.response.use((response) => response, handleResponseError);

// Auth API functions
export const authAPI = {
  login: async (credentials) => {
    const response = await userApi.post('/login', credentials);
    return response.data;
  },
  
  register: async (userData) => {
    const response = await userApi.post('/register', userData);
    return response.data;
  },
  
  getCurrentUser: async () => {
    const response = await userApi.get('/current');
    return response.data;
  },
  
  getUserProfile: async (slug) => {
    const response = await userApi.get(`/profile/${slug}`);
    return response.data;
  },
  
  updateUserProfile: async (slug, profileData) => {
    const response = await userApi.put(`/profile/${slug}`, profileData);
    return response.data;
  }
};

// Student API functions
export const studentAPI = {
  searchStudents: async (searchParams = {}) => {
    const params = new URLSearchParams();
    
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value);
      }
    });
    
    const response = await studentApi.get(`/search?${params}`);
    return response.data;
  },
  
  getAllStudents: async (page = 1, limit = 50) => {
    const response = await studentApi.get(`?page=${page}&limit=${limit}`);
    return response.data;
  },
  
  getStudentByUgNumber: async (ugNumber) => {
    const response = await studentApi.get(`/${ugNumber}`);
    return response.data;
  },
  
  createStudent: async (studentData) => {
    const response = await studentApi.post('/', studentData);
    return response.data;
  },
  
  updateStudent: async (ugNumber, studentData) => {
    const response = await studentApi.put(`/${ugNumber}`, studentData);
    return response.data;
  },
  
  deleteStudent: async (ugNumber) => {
    const response = await studentApi.delete(`/${ugNumber}`);
    return response.data;
  },
  
  getStudentStats: async () => {
    const response = await studentApi.get('/stats');
    return response.data;
  },
  
  bulkImportStudents: async (students) => {
    const response = await studentApi.post('/bulk-import', { students });
    return response.data;
  }
};

export default userApi;
