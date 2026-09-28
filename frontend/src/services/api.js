const API_BASE_URL = 'http://localhost:8000/api';

// Get token from localStorage
const getToken = () => localStorage.getItem('access_token');
const getRefreshToken = () => localStorage.getItem('refresh_token');

// Set tokens in localStorage
const setTokens = (accessToken, refreshToken) => {
  localStorage.setItem('access_token', accessToken);
  localStorage.setItem('refresh_token', refreshToken);
};

// Clear tokens from localStorage
const clearTokens = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
};

// Refresh access token
const refreshAccessToken = async () => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  const response = await fetch(`${API_BASE_URL}/auth/token/refresh/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refresh: refreshToken }),
  });

  if (!response.ok) {
    throw new Error('Failed to refresh token');
  }

  const data = await response.json();
  setTokens(data.access, refreshToken);
  return data.access;
};

// Make API request with automatic token refresh
const apiRequest = async (endpoint, options = {}) => {
  let token = getToken();
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // If unauthorized, try to refresh token
  if (response.status === 401 && token) {
    try {
      token = await refreshAccessToken();
      headers['Authorization'] = `Bearer ${token}`;
      response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });
    } catch (error) {
      clearTokens();
      window.location.href = '/login';
      throw error;
    }
  }

  return response;
};

// Authentication API
export const authAPI = {
  register: async (userData) => {
    const response = await apiRequest('/auth/register/', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    return response.json();
  },

  login: async (credentials) => {
    const response = await fetch(`${API_BASE_URL}/auth/login/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });
    const data = await response.json();
    
    if (response.ok) {
      setTokens(data.access, data.refresh);
      return data;
    }
    throw new Error(data.detail || 'Login failed');
  },

  logout: () => {
    clearTokens();
  },

  getProfile: async () => {
    const response = await apiRequest('/auth/profile/');
    return response.json();
  },

  updateProfile: async (userData) => {
    const response = await apiRequest('/auth/profile/', {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
    return response.json();
  },
};

// Property Valuation API
export const propertyValuationAPI = {
  getAll: async () => {
    const response = await apiRequest('/valuations/');
    return response.json();
  },

  getById: async (id) => {
    const response = await apiRequest(`/valuations/${id}/`);
    return response.json();
  },

  getFullDetails: async (id) => {
    const response = await apiRequest(`/valuations/${id}/full_details/`);
    return response.json();
  },

  create: async (data) => {
    const response = await apiRequest('/valuations/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.json();
  },

  update: async (id, data) => {
    const response = await apiRequest(`/valuations/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.json();
  },

  delete: async (id) => {
    const response = await apiRequest(`/valuations/${id}/`, {
      method: 'DELETE',
    });
    return response;
  },

  // Nested update endpoints
  updateInstitutionDetails: async (id, data) => {
    const response = await apiRequest(`/valuations/${id}/update_institution_details/`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(JSON.stringify(result));
    return result;
  },

  updatePropertyIdentification: async (id, data) => {
    const response = await apiRequest(`/valuations/${id}/update_property_identification/`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(JSON.stringify(result));
    return result;
  },

  updateScheduleDetails: async (id, data) => {
    const response = await apiRequest(`/valuations/${id}/update_schedule_details/`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(JSON.stringify(result));
    return result;
  },

  updateInfrastructureDetails: async (id, data) => {
    const response = await apiRequest(`/valuations/${id}/update_infrastructure_details/`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(JSON.stringify(result));
    return result;
  },

  updateTechnicalDetails: async (id, data) => {
    const response = await apiRequest(`/valuations/${id}/update_technical_details/`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(JSON.stringify(result));
    return result;
  },

  updateFinalValuation: async (id, data) => {
    const response = await apiRequest(`/valuations/${id}/update_final_valuation/`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(JSON.stringify(result));
    return result;
  },

  updateLocationDetails: async (id, data) => {
    const response = await apiRequest(`/valuations/${id}/update_location_details/`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(JSON.stringify(result));
    return result;
  },

  updatePropertyCharacteristics: async (id, data) => {
    const response = await apiRequest(`/valuations/${id}/update_property_characteristics/`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(JSON.stringify(result));
    return result;
  },

  updateNDMAParameters: async (id, data) => {
    const response = await apiRequest(`/valuations/${id}/update_ndma_parameters/`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(JSON.stringify(result));
    return result;
  },

  // Add nested data
  addLandExtentValuation: async (id, data) => {
    const response = await apiRequest(`/valuations/${id}/add_land_extent_valuation/`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(JSON.stringify(result));
    return result;
  },

  addStructureValuation: async (id, data) => {
    const response = await apiRequest(`/valuations/${id}/add_structure_valuation/`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(JSON.stringify(result));
    return result;
  },

  addAmenityValuation: async (id, data) => {
    const response = await apiRequest(`/valuations/${id}/add_amenity_valuation/`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(JSON.stringify(result));
    return result;
  },

  addVerifiedDocument: async (id, data) => {
    const response = await apiRequest(`/valuations/${id}/add_verified_document/`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.json();
  },

  addPhoto: async (id, formData) => {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/valuations/${id}/add_photo/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });
    const result = await response.json();
    if (!response.ok) throw new Error(JSON.stringify(result));
    return result;
  },

  generatePDF: async (id) => {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/valuations/${id}/generate-pdf/`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to generate PDF');
    }
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `property_valuation_${id}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  },
};

export default { authAPI, propertyValuationAPI };
