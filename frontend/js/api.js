// File frontend/js/api.js

// API Configuration
const API_URL = window.config.API_URL;
const REQUEST_TIMEOUT = window.config.REQUEST_TIMEOUT;

console.log('API URL:', API_URL);

// Helper function for API logging
const logApiCall = (endpoint, method, data = null) => {
    console.group(`API Call: ${method} ${endpoint}`);
    if (data) console.log('Data:', data);
    console.groupEnd();
};

// Helper function to handle fetch with timeout
const fetchWithTimeout = async (url, options) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
    
    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal
        });
        clearTimeout(timeout);
        return response;
    } catch (error) {
        clearTimeout(timeout);
        if (error.name === 'AbortError') {
            throw new Error('Request timeout');
        }
        throw error;
    }
};

// Main API object
window.api = {
    // Authentication
    register: async (userData) => {
        logApiCall('/auth/register', 'POST', userData);
        try {
            const response = await fetchWithTimeout(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData)
            });
            
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Registration failed');
            }
            return data;
        } catch (error) {
            console.error('Registration error:', error);
            throw error;
        }
    },

    login: async (nim, password) => {
        logApiCall('/auth/login', 'POST', { nim });
        try {
            const response = await fetchWithTimeout(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ nim, password })
            });
            
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Login failed');
            }
            
            // Store token securely
            if (data.token) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('nim', data.user.nim);
            }
            
            return data;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    },

    // Lab Progress
    saveProgress: async (labId, coefficients, graph_state, quiz_data = null) => {
        logApiCall('/progress/save', 'POST', { labId, coefficients, graph_state, quiz_data });
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found');
            }

            const payload = {
                labId,
                coefficients,
                graph_state,
                quiz_answers: quiz_data?.answers || null,
                quiz_score: quiz_data?.score || null,
                completed_at: quiz_data?.passed ? new Date().toISOString() : null
            };

            const response = await fetchWithTimeout(`${API_URL}/progress/save`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });
            
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Failed to save progress');
            }
            return data;
        } catch (error) {
            console.error('Save progress error:', error);
            throw error;
        }
    },

    getProgress: async (labId) => {
        logApiCall(`/progress/${labId}`, 'GET');
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found');
            }

            const response = await fetchWithTimeout(`${API_URL}/progress/${labId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Failed to load progress');
            }

            // Normalize response data
            return {
                coefficients: {
                    a: parseFloat(data.coefficients?.a) || 1,
                    b: parseFloat(data.coefficients?.b) || 0,
                    c: parseFloat(data.coefficients?.c) || 0
                },
                graph_state: {
                    scale: parseFloat(data.graph_state?.scale) || 1,
                    offsetX: parseFloat(data.graph_state?.offsetX) || 0,
                    offsetY: parseFloat(data.graph_state?.offsetY) || 0
                },
                quiz_answers: data.quiz_answers || null,
                quiz_score: data.quiz_score !== undefined ? parseFloat(data.quiz_score) : null,
                completed_at: data.completed_at || null
            };
        } catch (error) {
            console.error('Load progress error:', error);
            throw error;
        }
    },

    // Helper methods
    checkAuth: async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return false;

            // Verify token is still valid
            const response = await fetchWithTimeout(`${API_URL}/auth/verify`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            return response.ok;
        } catch (error) {
            console.error('Auth check error:', error);
            return false;
        }
    },

    logout: async () => {
        try {
          await fetch(`${API_URL}/auth/logout`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          localStorage.removeItem('token');
          localStorage.removeItem('nim');
          window.location.href = 'page-sign-in.html';
        }
      },

      getUserName: async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found');
            }

            const response = await fetch(`${API_URL}/user/name`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch user name');
            }

            const data = await response.json();
            return data.name;
        } catch (error) {
            console.error('Error fetching user name:', error);
            throw error;
        }
    }
};

// Global error handler
window.addEventListener('unhandledrejection', event => {
    if (event.reason?.message?.includes('authentication')) {
        window.api.logout();
    }
});