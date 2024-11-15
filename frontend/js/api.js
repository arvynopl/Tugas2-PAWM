// File frontend/js/api.js

const API_URL = 'http://localhost:5000/api';

const api = {
    // Authentication
    register: async (userData) => {
        try {
            const response = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });
            
            const data = await response.json();
            if (!response.ok) throw data;
            return data;
        } catch (error) {
            throw error;
        }
    },

    login: async (nim, password) => {
        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ nim, password })
            });
            
            const data = await response.json();
            if (!response.ok) throw data;
            return data;
        } catch (error) {
            throw error;
        }
    },

    // Lab Progress
    saveProgress: async (labId, coefficients, graph_state) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/progress/save`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ labId, coefficients, graph_state })
            });
            
            const data = await response.json();
            if (!response.ok) throw data;
            return data;
        } catch (error) {
            throw error;
        }
    },

    getProgress: async (labId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/progress/${labId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            const data = await response.json();
            if (!response.ok) throw data;
            return data;
        } catch (error) {
            throw error;
        }
    }
};