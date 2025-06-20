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
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'API call failed');
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
  
  register: async (userData) => {
    return apiCall('/users/register', {
      method: 'POST',
      body: JSON.stringify(userData),
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

export default { api, authAPI, studentAPI };
