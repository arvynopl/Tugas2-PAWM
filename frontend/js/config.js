// File frontend/js/config.js

const config = {
    API_URL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:5000/api'
        : 'https://virtual-lab-backend.onrender.com/api',
    REQUEST_TIMEOUT: 10000
};

window.config = config;