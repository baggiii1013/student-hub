const API_BASE_URL = '/api';

// Helper function to make API calls
async function apiCall(endpoint, options = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...defaultOptions,
    ...options,
    credentials: 'include', // Include cookies for session authentication
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  });

  if (!response.ok) {
    let errorMessage = 'API call failed';
    
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorData.error || errorMessage;
    } catch (parseError) {
      // If response is not JSON, use status text or generic message
      errorMessage = response.statusText || `HTTP ${response.status} Error`;
    }
    
    throw new Error(errorMessage);
  }

  return response.json();
}

// Auth API functions
export const authAPI = {
  login: async (credentials) => {
    return apiCall('/users/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },
  
  completeOAuthSetup: async (setupData) => {
    return apiCall('/users/complete-setup', {
      method: 'POST',
      body: JSON.stringify(setupData),
    });
  },
  
  getCurrentUser: async () => {
    return apiCall('/users/current');
  },
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
    
    return apiCall(`/students/search?${params}`);
  },
  
  getAllStudents: async (page = 1, limit = 50) => {
    return apiCall(`/students?page=${page}&limit=${limit}`);
  },
};

// User Management API functions
export const userManagementAPI = {
  getUsers: async (page = 1, limit = 10) => {
    // For user management, we don't need to manually add tokens as it should work with session cookies
    return apiCall(`/users/manage?page=${page}&limit=${limit}`);
  },
  
  createUser: async (userData) => {
    if (!userData.username || !userData.email || !userData.password) {
      throw new Error('Username, email, and password are required');
    }
    
    return apiCall('/users/manage', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },
  
  updateUserRole: async (userId, role) => {
    if (!userId || !role) {
      throw new Error('User ID and role are required');
    }
    
    return apiCall('/users/manage', {
      method: 'PUT',
      body: JSON.stringify({ userId, role }),
    });
  },
  
  deleteUser: async (userId) => {
    if (!userId) {
      throw new Error('User ID is required');
    }
    
    return apiCall('/users/manage', {
      method: 'DELETE',
      body: JSON.stringify({ userId }),
    });
  },
};

// General API object for making custom requests
export const api = {
  get: async (endpoint) => {
    return apiCall(endpoint, { method: 'GET' });
  },
  
  post: async (endpoint, data) => {
    return apiCall(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  
  put: async (endpoint, data) => {
    return apiCall(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  
  delete: async (endpoint) => {
    return apiCall(endpoint, { method: 'DELETE' });
  },
};

const apiModule = { api, authAPI, studentAPI, userManagementAPI };
export default apiModule;
