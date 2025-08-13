// Theme management - matching compiler's theme system
const themeToggle = document.getElementById('themeToggle');
const themeIcon = document.getElementById('themeIcon');

// Load theme from localStorage
const savedTheme = localStorage.getItem('theme');
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');

function setTheme(dark) {
    if (dark) {
        document.documentElement.classList.add('dark');
        themeIcon.src = 'assets/light.png';
    } else {
        document.documentElement.classList.remove('dark');
        themeIcon.src = 'assets/dark.png';
    }
    localStorage.setItem('theme', dark ? 'dark' : 'light');
}

// Set initial theme
setTheme(initialTheme === 'dark');
themeToggle.addEventListener('click', () => {
    setTheme(!document.documentElement.classList.contains('dark'));
});

// Login form functionality
const loginForm = document.getElementById('loginForm');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const loginBtn = document.querySelector('.login-btn');
const btnText = document.querySelector('.btn-text');
const btnSpinner = document.querySelector('.btn-spinner');

// Form validation
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function validateForm() {
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    
    // Reset previous states
    emailInput.classList.remove('success', 'error');
    passwordInput.classList.remove('success', 'error');
    
    let isValid = true;
    
    // Email validation
    if (!email) {
        emailInput.classList.add('error');
        isValid = false;
    } else if (!validateEmail(email)) {
        emailInput.classList.add('error');
        isValid = false;
    } else {
        emailInput.classList.add('success');
    }
    
    // Password validation
    if (!password) {
        passwordInput.classList.add('error');
        isValid = false;
    } else if (password.length < 6) {
        passwordInput.classList.add('error');
        isValid = false;
    } else {
        passwordInput.classList.add('success');
    }
    
    return isValid;
}

// Real-time validation
emailInput.addEventListener('blur', () => {
    const email = emailInput.value.trim();
    emailInput.classList.remove('success', 'error');
    
    if (email && validateEmail(email)) {
        emailInput.classList.add('success');
    } else if (email) {
        emailInput.classList.add('error');
    }
});

passwordInput.addEventListener('blur', () => {
    const password = passwordInput.value.trim();
    passwordInput.classList.remove('success', 'error');
    
    if (password && password.length >= 6) {
        passwordInput.classList.add('success');
    } else if (password) {
        passwordInput.classList.add('error');
    }
});

// Clear validation states on focus
emailInput.addEventListener('focus', () => {
    emailInput.classList.remove('success', 'error');
});

passwordInput.addEventListener('focus', () => {
    passwordInput.classList.remove('success', 'error');
});

// Form submission
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
        return;
    }
    
    // Show loading state
    loginBtn.classList.add('loading');
    loginBtn.disabled = true;
    btnSpinner.classList.remove('hidden');
    
    const formData = {
        email: emailInput.value.trim(),
        password: passwordInput.value.trim(),
        remember: document.getElementById('remember').checked
    };
    
    try {
        // Simulate API call - replace with your actual login logic
        await simulateLogin(formData);
        
        // Success - redirect to main compiler
        window.location.href = 'index.html';
        
    } catch (error) {
        console.error('Login failed:', error);
        
        // Show error state
        emailInput.classList.add('error');
        passwordInput.classList.add('error');
        
        // You could show an error message here
        alert('Login failed. Please check your credentials and try again.');
        
    } finally {
        // Reset loading state
        loginBtn.classList.remove('loading');
        loginBtn.disabled = false;
        btnSpinner.classList.add('hidden');
    }
});

// Simulate login API call - replace with your actual implementation
async function simulateLogin(credentials) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            // Simulate successful login for demo purposes
            // Replace this with your actual authentication logic
            if (credentials.email && credentials.password) {
                resolve({ success: true, user: { email: credentials.email } });
            } else {
                reject(new Error('Invalid credentials'));
            }
        }, 1500); // Simulate network delay
    });
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Submit form with Ctrl/Cmd + Enter
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        loginForm.dispatchEvent(new Event('submit'));
    }
    
    // Toggle theme with Ctrl/Cmd + Shift + T
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'T') {
        e.preventDefault();
        themeToggle.click();
    }
});

// Auto-focus email input on page load
document.addEventListener('DOMContentLoaded', () => {
    emailInput.focus();
});

// Handle forgot password link
document.querySelector('.forgot-link').addEventListener('click', (e) => {
    e.preventDefault();
    // Implement forgot password functionality
    alert('Forgot password functionality would be implemented here.');
});

// Handle sign up link
document.querySelector('.signup-link').addEventListener('click', (e) => {
    e.preventDefault();
    // Implement sign up functionality or redirect
    alert('Sign up functionality would be implemented here.');
});

// Enhanced input interactions
const inputs = document.querySelectorAll('.form-input');

inputs.forEach(input => {
    // Add floating label effect
    input.addEventListener('focus', () => {
        input.parentElement.classList.add('focused');
    });
    
    input.addEventListener('blur', () => {
        if (!input.value) {
            input.parentElement.classList.remove('focused');
        }
    });
    
    // Check if input has value on page load
    if (input.value) {
        input.parentElement.classList.add('focused');
    }
});

// Smooth scroll to top on page load
window.addEventListener('load', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
});