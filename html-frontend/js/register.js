// html-frontend/js/register.js

document.addEventListener('DOMContentLoaded', () => {

    const enrollmentInput = document.getElementById('enrollment-input');
    const registerForm = document.getElementById('register-form');
    const submitBtn = document.getElementById('submit-btn');
    const btnText = document.getElementById('btn-text');
    const loadingSpinner = document.getElementById('loading-spinner');
    
    const errorMsg = document.getElementById('error-message');
    const errorText = document.getElementById('error-text');
    
    // Form Submission
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const name = document.getElementById('name-input').value.trim();
        const email = document.getElementById('email-input').value.trim();
        const password = document.getElementById('password-input').value;
        const enrollmentNo = enrollmentInput.value.trim();

        // Basic validation
        if(!enrollmentNo) {
            showError("Enrollment number is required for students");
            return;
        }

        // Generate unique deterministic ID or random ID for DB
        const id = 's' + Math.floor(Math.random() * 1000000);

        const payload = {
            id,
            name,
            email,
            password,
            role: 'student',
            enrollmentNo: enrollmentNo,
            subject: null
        };

        setLoading(true);

        try {
            // Send payload directly to our Python backend using relative path
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (response.ok && result.status === 'success') {
                // Instantly redirect to login on success
                window.location.href = '/login.html';
            } else {
                showError(result.message || 'Registration failed.');
            }
        } catch (err) {
            console.error('Registration fetch error:', err);
            showError('Network error. Is the Python backend running?');
        } finally {
            setLoading(false);
        }
    });

    function showError(msg) {
        errorText.textContent = msg;
        errorMsg.style.display = 'flex';
        // Reset shake animation by cloning the node
        const newMsg = errorMsg.cloneNode(true);
        errorMsg.parentNode.replaceChild(newMsg, errorMsg);
    }

    function setLoading(isLoading) {
        if (isLoading) {
            submitBtn.disabled = true;
            btnText.style.opacity = '0';
            loadingSpinner.style.display = 'block';
            errorMsg.style.display = 'none';
        } else {
            submitBtn.disabled = false;
            btnText.style.opacity = '1';
            loadingSpinner.style.display = 'none';
        }
    }
});
