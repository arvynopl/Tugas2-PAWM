// Create a self-executing anonymous function to avoid global scope pollution
(function() {
    // Define the auth module
    window.authModule = {
        checkAuth: function() {
            const publicPages = ['index.html', 'page-sign-in.html', 'page-register.html'];
            const currentPage = window.location.pathname.split('/').pop() || 'index.html';
            
            if (publicPages.includes(currentPage)) {
                return;
            }

            const token = localStorage.getItem('token');
            if (!token) {
                window.location.href = 'page-sign-in.html';
                return;
            }

            if (this.isTokenExpired(token)) {
                this.logout();
                return;
            }

            // Add token to all API requests
            this.setupAPIInterceptor();
        },

        isTokenExpired: function(token) {
            try {
                const tokenData = JSON.parse(atob(token.split('.')[1]));
                return tokenData.exp * 1000 < Date.now();
            } catch {
                return true;
            }
        },

        logout: function() {
            localStorage.removeItem('token');
            localStorage.removeItem('nim');
            window.location.href = 'page-sign-in.html';
        },

        setupAPIInterceptor: function() {
            // Add Authorization header to all fetch requests
            const originalFetch = window.fetch;
            window.fetch = function(...args) {
                let [resource, config] = args;
                
                // Only add auth header for our API requests
                if (resource.includes('/api/')) {
                    const token = localStorage.getItem('token');
                    config = config || {};
                    config.headers = config.headers || {};
                    config.headers.Authorization = `Bearer ${token}`;
                }
                
                return originalFetch(resource, config);
            };
        },

        handleLogin: async function(event) {
            event.preventDefault();
            
            try {
                const nim = document.getElementById('nim').value;
                const password = document.getElementById('password').value;

                const response = await fetch('http://localhost:5000/api/auth/login', {
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

                localStorage.setItem('token', data.token);
                localStorage.setItem('nim', data.user.nim);
                
                window.location.href = 'page-home.html';
            } catch (error) {
                this.showMessage(error.message || 'Login failed. Please try again.', 'error');
            }
        },

        handleRegister: async function(event) {
            event.preventDefault();
            
            try {
                const userData = {
                    nim: document.getElementById('nim').value,
                    full_name: document.getElementById('full_name').value,
                    email: document.getElementById('email').value,
                    password: document.getElementById('password').value
                };

                const response = await fetch('http://localhost:5000/api/auth/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(userData)
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || 'Registration failed');
                }

                this.showMessage('Registration successful! Please login.', 'success');
                setTimeout(() => {
                    window.location.href = 'page-sign-in.html';
                }, 2000);
            } catch (error) {
                this.showMessage(error.message || 'Registration failed. Please try again.', 'error');
            }
        },

        showMessage: function(message, type = 'info') {
            const messageDisplay = document.getElementById('messageDisplay');
            if (messageDisplay) {
                messageDisplay.textContent = message;
                messageDisplay.className = `message ${type} show`;
                setTimeout(() => {
                    messageDisplay.classList.remove('show');
                }, 5000);
            }
        }
    };

    // Initialize event listeners
    document.addEventListener('DOMContentLoaded', () => {
        // Check which form exists on the current page
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');
        
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => authModule.handleLogin.call(authModule, e));
        }
        
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => authModule.handleRegister.call(authModule, e));
        }

        // Run checkAuth if we're not on a login/register page
        const publicPages = ['page-sign-in.html', 'page-register.html'];
        const currentPage = window.location.pathname.split('/').pop();
        
        if (!publicPages.includes(currentPage)) {
            authModule.checkAuth();
        }
    });
})();