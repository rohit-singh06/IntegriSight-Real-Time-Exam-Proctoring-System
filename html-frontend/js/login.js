// js/login.js

document.addEventListener('DOMContentLoaded', async () => {
    await initStore();
    // State
    let role = 'student';
    let email = '';
    let password = '';
    let error = '';
    let isSubmitting = false;

    // DOM Elements
    const btnStudent = document.getElementById('btn-student');
    const btnProctor = document.getElementById('btn-proctor');
    const roleIndicator = document.getElementById('role-indicator');
    
    const emailInput = document.getElementById('email-input');
    const emailCheckmark = document.getElementById('email-checkmark');
    
    const passwordInput = document.getElementById('password-input');
    const togglePasswordBtn = document.getElementById('toggle-password');
    const eyeHidden = document.getElementById('eye-icon-hidden');
    const eyeVisible = document.getElementById('eye-icon-visible');
    
    const errorContainer = document.getElementById('error-message');
    const errorText = document.getElementById('error-text');
    
    const loginForm = document.getElementById('login-form');
    const submitBtn = document.getElementById('submit-btn');
    const loadingSpinner = document.getElementById('loading-spinner');
    const btnText = document.getElementById('btn-text');

    // Cursor tracking
    const cursorSpotlight = document.getElementById('cursor-spotlight');
    const radialGlowLeft = document.getElementById('radial-glow-left');
    const dotGrid = document.getElementById('dot-grid');
    const tiltCard = document.getElementById('tilt-card');
    const shape1 = document.getElementById('shape-1');
    const rightPanel = document.getElementById('right-panel');

    const isMobile = window.innerWidth <= 768;

    window.addEventListener('resize', () => {
        // Simple reload or dynamic adjust if needed. Usually CSS handles it.
        // But for tilt effect, we just ignore tilt if mobile.
    });

    const handleMove = (e) => {
        const cx = e.clientX / window.innerWidth;
        const cy = e.clientY / window.innerHeight;
        const rawX = e.clientX;
        const rawY = e.clientY;

        // Left panel
        if (radialGlowLeft) {
            radialGlowLeft.style.left = `${cx * 100}%`;
            radialGlowLeft.style.top = `${cy * 100}%`;
        }
        if (dotGrid) {
            dotGrid.style.transform = `translate(${(cx - 0.5) * -8}px, ${(cy - 0.5) * -8}px)`;
        }
        if (shape1) {
            shape1.style.transform = `translate(${(cx - 0.5) * 15}px, ${(cy - 0.5) * 15}px)`;
        }

        // Right panel
        if (!isMobile) {
            if (cursorSpotlight && rightPanel) {
                const rightPanelOffset = rightPanel.getBoundingClientRect().left;
                if (rawX >= rightPanelOffset) {
                    cursorSpotlight.style.opacity = '1';
                    cursorSpotlight.style.left = `${rawX - rightPanelOffset}px`;
                    cursorSpotlight.style.top = `${rawY}px`;
                } else {
                    cursorSpotlight.style.opacity = '0';
                }
            }
            if (tiltCard) {
                tiltCard.style.transform = `perspective(1200px) rotateX(${(cy - 0.5) * -4}deg) rotateY(${(cx - 0.5) * 4}deg) translateZ(0)`;
            }
        }
    };

    window.addEventListener('mousemove', handleMove);

    // Form logic
    const updateRoleUI = () => {
        if (role === 'student') {
            roleIndicator.style.left = '4px';
            btnStudent.style.color = 'white';
            btnProctor.style.color = 'rgba(255,255,255,0.4)';
            btnText.textContent = 'Sign in to Student Portal';
        } else {
            roleIndicator.style.left = 'calc(50%)';
            btnProctor.style.color = 'white';
            btnStudent.style.color = 'rgba(255,255,255,0.4)';
            btnText.textContent = 'Sign in to Proctor Portal';
        }
        // clear errors
        hideError();
    };

    btnStudent.addEventListener('click', () => {
        role = 'student';
        updateRoleUI();
    });

    btnProctor.addEventListener('click', () => {
        role = 'proctor';
        updateRoleUI();
    });

    const validateEmail = (val) => {
        return val.includes('@') && val.includes('.');
    };

    emailInput.addEventListener('input', (e) => {
        email = e.target.value;
        const isValid = validateEmail(email);
        
        if (isValid) {
            emailInput.style.borderColor = '#10b981';
            emailInput.style.boxShadow = '0 0 0 4px rgba(16,185,129,0.1)';
            emailCheckmark.style.opacity = '1';
            emailCheckmark.style.transform = 'translateY(-50%) scale(1)';
        } else {
            emailInput.style.borderColor = 'rgba(255,255,255,0.1)';
            emailInput.style.boxShadow = 'none';
            emailCheckmark.style.opacity = '0';
            emailCheckmark.style.transform = 'translateY(-50%) scale(0.5)';
        }
    });

    emailInput.addEventListener('focus', (e) => {
        if (!validateEmail(email)) {
            e.target.style.borderColor = '#6352dd'; 
            e.target.style.background = 'rgba(99,82,221,0.06)';
            e.target.style.boxShadow = '0 0 0 4px rgba(99,82,221,0.12)';
        }
    });

    emailInput.addEventListener('blur', (e) => {
        if (!validateEmail(email)) {
            e.target.style.borderColor = 'rgba(255,255,255,0.1)'; 
            e.target.style.background = 'rgba(255,255,255,0.05)';
            e.target.style.boxShadow = 'none';
        }
    });

    passwordInput.addEventListener('input', (e) => {
        password = e.target.value;
    });

    passwordInput.addEventListener('focus', (e) => {
        e.target.style.borderColor = '#6352dd'; 
        e.target.style.background = 'rgba(99,82,221,0.06)';
        e.target.style.boxShadow = '0 0 0 4px rgba(99,82,221,0.12)';
    });

    passwordInput.addEventListener('blur', (e) => {
        e.target.style.borderColor = 'rgba(255,255,255,0.1)'; 
        e.target.style.background = 'rgba(255,255,255,0.05)';
        e.target.style.boxShadow = 'none';
    });

    let passwordVisible = false;
    togglePasswordBtn.addEventListener('click', () => {
        passwordVisible = !passwordVisible;
        if (passwordVisible) {
            passwordInput.type = 'text';
            eyeHidden.style.display = 'none';
            eyeVisible.style.display = 'block';
        } else {
            passwordInput.type = 'password';
            eyeVisible.style.display = 'none';
            eyeHidden.style.display = 'block';
        }
    });

    const showError = (msg) => {
        errorContainer.style.display = 'flex';
        errorText.textContent = msg;
    };

    const hideError = () => {
        errorContainer.style.display = 'none';
        errorText.textContent = '';
    };

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        hideError();
        
        isSubmitting = true;
        submitBtn.disabled = true;
        submitBtn.style.cursor = 'not-allowed';
        submitBtn.style.boxShadow = '0 2px 12px rgba(99,82,221,0.3)';
        loadingSpinner.style.display = 'block';
        btnText.textContent = 'Signing in...';

        setTimeout(() => {
            const store = getStore();
            let foundUser = null;

            if (role === 'student') {
                foundUser = store.students.find(s => s.email === email && s.password === password);
            } else {
                foundUser = store.proctors.find(p => p.email === email && p.password === password);
            }

            if (foundUser) {
                const sessionUser = {
                    id: foundUser.id,
                    name: foundUser.name,
                    email: foundUser.email,
                    role: foundUser.role,
                    ...(foundUser.role === 'student' ? { enrollmentNo: foundUser.enrollmentNo } : { subject: foundUser.subject })
                };
                
                localStorage.setItem('integrisight_user', JSON.stringify(sessionUser));
                
                if (foundUser.role === 'student') {
                    window.location.href = 'student-dashboard.html';
                } else {
                    window.location.href = 'proctor-dashboard.html';
                }
            } else {
                showError('Invalid email or password. Please try again.');
                isSubmitting = false;
                submitBtn.disabled = false;
                submitBtn.style.cursor = 'pointer';
                submitBtn.style.boxShadow = '0 4px 24px rgba(99,82,221,0.35), 0 1px 0 rgba(255,255,255,0.1) inset';
                loadingSpinner.style.display = 'none';
                btnText.textContent = `Sign in to ${role === 'student' ? 'Student' : 'Proctor'} Portal`;
            }
        }, 500);
    });

    // Initialize UI
    updateRoleUI();
});
