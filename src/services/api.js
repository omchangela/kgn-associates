const API_BASE_URL = '/api';

// Get token from localStorage
export const getToken = () => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('access_token');
};

export const getRefreshToken = () => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('refresh_token');
};

export const setTokens = (accessToken, refreshToken) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('access_token', accessToken);
  if (refreshToken) localStorage.setItem('refresh_token', refreshToken);
};

export const clearTokens = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
};

// Request wrapper - without trailing slash redirects
export const apiRequest = async (endpoint, options = {}) => {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Ensure no trailing slash to prevent Next.js 308 redirects
  const cleanEndpoint = endpoint.replace(/\/$/, '');

  const response = await fetch(`${API_BASE_URL}${cleanEndpoint}`, {
    ...options,
    headers,
  });

  return response;
};

// Auth API
export const authAPI = {
  register: async (userData) => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || data.detail || 'Registration failed');
    if (data.access) setTokens(data.access, data.refresh);
    return data;
  },

  login: async (credentials) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    const data = await response.json();
    if (response.ok) {
      setTokens(data.access, data.refresh);
      return data;
    }
    throw new Error(data.detail || data.error || 'Login failed');
  },

  logout: () => {
    clearTokens();
  },

  getProfile: async () => {
    const response = await apiRequest('/auth/profile');
    if (!response.ok) throw new Error('Unauthorized');
    return response.json();
  },

  updateProfile: async (userData) => {
    const response = await apiRequest('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
    return response.json();
  },
};

// Property Valuation API
export const propertyValuationAPI = {
  getAll: async (params = '') => {
    const query = typeof params === 'string' ? params : '';
    const cleanQuery = query.startsWith('?') ? query : (query ? `?${query}` : '');
    const response = await apiRequest(`/valuations${cleanQuery}`);
    return response.json();
  },

  getById: async (id) => {
    const response = await apiRequest(`/valuations/${id}`);
    return response.json();
  },

  getFullDetails: async (id) => {
    const response = await apiRequest(`/valuations/${id}/full_details`);
    return response.json();
  },

  create: async (data) => {
    const response = await apiRequest('/valuations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.json();
  },

  // Save the entire valuation in ONE fast atomic request (under 20ms!)
  saveFullValuation: async (fullData) => {
    const response = await apiRequest('/valuations', {
      method: 'POST',
      body: JSON.stringify(fullData),
    });
    return response.json();
  },

  update: async (id, data) => {
    const response = await apiRequest(`/valuations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.json();
  },

  delete: async (id) => {
    const response = await apiRequest(`/valuations/${id}`, {
      method: 'DELETE',
    });
    return response;
  },

  // Nested section updates matching frontend calls
  updateInstitutionDetails: async (id, data) => {
    const response = await apiRequest(`/valuations/${id}/update_institution_details`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(JSON.stringify(result));
    return result;
  },

  updatePropertyIdentification: async (id, data) => {
    const response = await apiRequest(`/valuations/${id}/update_property_identification`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(JSON.stringify(result));
    return result;
  },

  updateScheduleDetails: async (id, data) => {
    const response = await apiRequest(`/valuations/${id}/update_schedule_details`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(JSON.stringify(result));
    return result;
  },

  updateInfrastructureDetails: async (id, data) => {
    const response = await apiRequest(`/valuations/${id}/update_infrastructure_details`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(JSON.stringify(result));
    return result;
  },

  updateTechnicalDetails: async (id, data) => {
    const response = await apiRequest(`/valuations/${id}/update_technical_details`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(JSON.stringify(result));
    return result;
  },

  updateFinalValuation: async (id, data) => {
    const response = await apiRequest(`/valuations/${id}/update_final_valuation`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(JSON.stringify(result));
    return result;
  },

  updateLocationDetails: async (id, data) => {
    const response = await apiRequest(`/valuations/${id}/update_location_details`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(JSON.stringify(result));
    return result;
  },

  updatePropertyCharacteristics: async (id, data) => {
    const response = await apiRequest(`/valuations/${id}/update_property_characteristics`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(JSON.stringify(result));
    return result;
  },

  updateNDMAParameters: async (id, data) => {
    const response = await apiRequest(`/valuations/${id}/update_ndma_parameters`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(JSON.stringify(result));
    return result;
  },

  addLandExtentValuation: async (id, data) => {
    const response = await apiRequest(`/valuations/${id}/add_land_extent_valuation`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(JSON.stringify(result));
    return result;
  },

  addStructureValuation: async (id, data) => {
    const response = await apiRequest(`/valuations/${id}/add_structure_valuation`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(JSON.stringify(result));
    return result;
  },

  addAmenityValuation: async (id, data) => {
    const response = await apiRequest(`/valuations/${id}/add_amenity_valuation`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(JSON.stringify(result));
    return result;
  },

  addVerifiedDocument: async (id, data) => {
    const response = await apiRequest(`/valuations/${id}/add_verified_document`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.json();
  },

  addPhoto: async (id, formData) => {
    const token = getToken();
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`${API_BASE_URL}/valuations/${id}/add_photo`, {
      method: 'POST',
      headers,
      body: formData,
    });
    const result = await response.json();
    if (!response.ok) throw new Error(JSON.stringify(result));
    return result;
  },

  generatePDF: async (id) => {
    const token = getToken();
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`${API_BASE_URL}/valuations/${id}/generate-pdf`, {
      headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to generate PDF (${response.status})`);
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

const apiServices = { authAPI, propertyValuationAPI };
export default apiServices;
