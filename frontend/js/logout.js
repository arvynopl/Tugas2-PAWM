// File frontend/js/logout.js

document.addEventListener('DOMContentLoaded', function() {
    const logoutButtons = document.querySelectorAll('.logout-button');
    logoutButtons.forEach(button => {
        button.addEventListener('click', function() {
            console.log('Logout button clicked'); // Debugging statement
            window.api.logout();
        });
    });
});