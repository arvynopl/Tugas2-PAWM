// File frontend/js/auth.js

document.addEventListener('DOMContentLoaded', function() {
    // Make authModule globally available
    window.authModule = {
        // Existing login handler
        handleLogin: async function(event) {
            event.preventDefault();
            
            try {
                const nim = document.getElementById('nim').value;
                const password = document.getElementById('password').value;
                
                // Show loading
                document.getElementById('authLoading').style.display = 'flex';

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
            } finally {
                // Hide loading
                document.getElementById('authLoading').style.display = 'none';
            }
        },

        // Add registration handler
        handleRegister: async function(event) {
            event.preventDefault();
            
            try {
                // Reset previous error states
                this.resetFormErrors();
                
                // Get form inputs
                const nim = document.getElementById('nim').value;
                const fullName = document.getElementById('fullName').value;
                const email = document.getElementById('email').value;
                const password = document.getElementById('password').value;
        
                // Basic validation
                if (!nim || !fullName || !email || !password) {
                    throw new Error('Mohon lengkapi semua field');
                }
        
                // Validate NIM format (8 digits)
                if (!/^\d{8}$/.test(nim)) {
                    throw new Error('NIM harus 8 digit angka');
                }
        
                // Validate ITB email
                if (!email.endsWith('@itb.ac.id')) {
                    throw new Error('Mohon gunakan email ITB Anda (@itb.ac.id)');
                }
        
                // Show loading
                document.getElementById('authLoading').style.display = 'flex';
        
                const response = await fetch('http://localhost:5000/api/auth/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        nim,
                        full_name: fullName,
                        email,
                        password
                    })
                });
        
                const data = await response.json();
        
                if (!response.ok) {
                    // Handle specific error cases
                    if (data.field) {
                        this.showFieldError(data.field, data.error);
                        throw new Error(data.error);
                    }
                    throw new Error(data.error || 'Pendaftaran gagal');
                }
        
                // Show success message
                this.showMessage('Pendaftaran berhasil! Anda akan dialihkan ke halaman login...', 'success');
                
                // Redirect to login page after 2 seconds
                setTimeout(() => {
                    window.location.href = 'page-sign-in.html';
                }, 2000);
                
            } catch (error) {
                this.showMessage(error.message || 'Pendaftaran gagal. Silakan coba lagi.', 'error');
            } finally {
                // Hide loading
                document.getElementById('authLoading').style.display = 'none';
            }
        },

    // Add these helper functions to improve error visualization
    resetFormErrors: function() {
        // Remove any existing error classes and messages
        document.querySelectorAll('.form-control').forEach(input => {
            input.classList.remove('error');
        });
        document.querySelectorAll('.error-message').forEach(msg => {
            msg.remove();
        });
    },

    showFieldError: function(fieldName, message) {
        const input = document.getElementById(fieldName);
        if (input) {
            input.classList.add('error');
            
            // Create error message element
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error-message';
            errorDiv.textContent = message;
            
            // Insert error message after the input field
            input.parentNode.insertBefore(errorDiv, input.nextSibling);
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

    // Set up form event listeners
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => window.authModule.handleLogin.call(window.authModule, e));
    }

    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', (e) => window.authModule.handleRegister.call(window.authModule, e));
    }
});