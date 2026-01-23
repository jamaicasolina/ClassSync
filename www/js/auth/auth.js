// js/auth/auth.js
const API_URL = "http://localhost/FINAL_PROJECT/ClassSync/api/controllers";

document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    checkExistingSession();
});

/* -------------------------
   EVENT LISTENERS
--------------------------*/
function setupEventListeners() {
    document.getElementById('showSignup').onclick = e => {
        e.preventDefault();
        toggleForms('signup');
    };

    document.getElementById('showLogin').onclick = e => {
        e.preventDefault();
        toggleForms('login');
    };

    document.getElementById('signupRole').onchange = handleRoleChange;
    document.getElementById('loginFormElement').onsubmit = handleLogin;
    document.getElementById('signupFormElement').onsubmit = handleSignup;

    document.getElementById('signupEmail').onblur = validatePrimaryEmail;
    document.getElementById('signupSecondaryEmail').onblur = validateSecondaryEmail;
    document.getElementById('signupStudentId').oninput = formatStudentId;
    document.getElementById('signupStudentId').onblur = validateStudentId;
    document.getElementById('signupSection').onblur = validateSection;
}

/* -------------------------
   FORM TOGGLE
--------------------------*/
function toggleForms(type) {
    document.getElementById('loginForm').classList.toggle('hidden', type === 'signup');
    document.getElementById('signupForm').classList.toggle('hidden', type === 'login');
    hideMessage();
}

/* -------------------------
   LOGIN (PHP)
--------------------------*/
async function handleLogin(e) {
    e.preventDefault();

    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const selectedRole = document.getElementById('loginRole').value;

    if (!email || !password) {
        showMessage('Please fill in all fields', 'error');
        return;
    }

    if (!selectedRole) {
        showMessage('Please select your role', 'error');
        return;
    }

    try {
        const res = await fetch(`${API_URL}/AuthController.php?action=login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        if (!data.success) {
            showMessage(data.message, 'error');
            return;
        }

        // Verify that selected role matches user's actual role
        if (data.user.role !== selectedRole) {
            showMessage('Selected role does not match your account. Please select the correct role.', 'error');
            return;
        }

        // Store user session in localStorage
        localStorage.setItem('sessionUser', JSON.stringify(data.user));

        showMessage('Login successful! Redirecting...', 'success');
        setTimeout(() => redirectToDashboard(data.role), 800);

    } catch (err) {
        console.error('Login error:', err);
        showMessage('Server connection error. Please try again.', 'error');
    }
}

/* -------------------------
   SIGNUP (PHP)
--------------------------*/
async function handleSignup(e) {
    e.preventDefault();

    if (!validatePrimaryEmail()) {
        showMessage('Primary email must be a PUP email address', 'error');
        return;
    }
    
    if (!validateSecondaryEmail()) {
        showMessage('Secondary email must be a Gmail address', 'error');
        return;
    }
    
    if (!validateStudentId()) {
        showMessage('Invalid student ID format', 'error');
        return;
    }

    const role = document.getElementById('signupRole').value;

    if (!role) {
        showMessage('Please select a role', 'error');
        return;
    }

    const payload = {
        firstName: document.getElementById('signupFirstName').value.trim(),
        middleName: document.getElementById('signupMiddleName').value.trim(),
        surname: document.getElementById('signupSurname').value.trim(),
        email: document.getElementById('signupEmail').value.trim(),
        secondaryEmail: document.getElementById('signupSecondaryEmail').value.trim() || null,
        studentId: document.getElementById('signupStudentId').value.trim(),
        password: document.getElementById('signupPassword').value,
        role,
        year: null,
        section: null,
        officerRole: null
    };

    if (role === 'student' || role === 'student_rep') {
        payload.year = document.getElementById('signupYear').value;
        payload.section = document.getElementById('signupSection').value.toUpperCase();
        
        if (!payload.year || !payload.section) {
            showMessage('Year and section are required for students', 'error');
            return;
        }

        if (!validateSection()) {
            showMessage('Invalid section format. Use format like 1, 2, 1P, 2P', 'error');
            return;
        }

        if (role === 'student_rep') {
            payload.officerRole = document.getElementById('signupOfficerRole').value;
            if (!payload.officerRole) {
                showMessage('Officer position is required for student representatives', 'error');
                return;
            }
        }
    }

    try {
        const res = await fetch(`${API_URL}/AuthController.php?action=signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        // Check if response is JSON
        const contentType = res.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
            const text = await res.text();
            console.error('Server response (not JSON):', text);
            showMessage('Server error: Invalid response format. Check console for details.', 'error');
            return;
        }

        const data = await res.json();
        console.log('Signup response:', data); // Debug log

        if (!data.success) {
            showMessage(data.message, 'error');
            return;
        }

        showMessage('Account created successfully! Please login.', 'success');
        document.getElementById('signupFormElement').reset();
        document.getElementById('studentFields').classList.add('hidden');
        document.getElementById('officerFields').classList.add('hidden');
        
        setTimeout(() => toggleForms('login'), 1500);

    } catch (err) {
        console.error('Signup error:', err);
        showMessage('Server error during signup: ' + err.message, 'error');
    }
}

/* -------------------------
   SESSION CHECK (PHP)
--------------------------*/
async function checkExistingSession() {
    try {
        const res = await fetch(`${API_URL}/AuthController.php?action=session`);
        const data = await res.json();

        if (data.loggedIn && data.user) {
            // Store user session in localStorage
            localStorage.setItem('sessionUser', JSON.stringify(data.user));
            redirectToDashboard(data.role);
        }
    } catch (err) {
        console.error('Session check error:', err);
    }
}

/* -------------------------
   LOGOUT (PHP)
--------------------------*/
async function logout() {
    try {
        await fetch(`${API_URL}/AuthController.php?action=logout`, { method: 'POST' });
    } catch (err) {
        console.error('Logout error:', err);
    }
    
    localStorage.removeItem('sessionUser');
    window.location.href = '/index.html';
}

/* -------------------------
   DASHBOARD ROUTER
--------------------------*/
function redirectToDashboard(role) {
    const map = {
        professor: '/FINAL_PROJECT/ClassSync/www/pages/dashboards/professor.html',
        student: '/FINAL_PROJECT/ClassSync/www/pages/dashboards/student.html',
        student_rep: '/FINAL_PROJECT/ClassSync/www/pages/dashboards/student-rep.html',
        room_admin: '/FINAL_PROJECT/ClassSync/www/pages/dashboards/room-admin.html',
        chairperson: '/FINAL_PROJECT/ClassSync/www/pages/dashboards/chairperson.html'
    };
    
    const path = map[role];
    if (path) {
        window.location.href = path;
    } else {
        showMessage('Invalid role', 'error');
    }
}

/* -------------------------
   VALIDATION FUNCTIONS
--------------------------*/
function validatePrimaryEmail() {
    const email = document.getElementById('signupEmail').value.trim();
    const isValid = email.endsWith('@iskolarngbayan.pup.edu.ph');
    
    if (email && !isValid) {
        document.getElementById('signupEmail').classList.add('error');
    } else {
        document.getElementById('signupEmail').classList.remove('error');
    }
    
    return isValid || !email;
}

function validateSecondaryEmail() {
    const email = document.getElementById('signupSecondaryEmail').value.trim();
    const isValid = !email || email.endsWith('@gmail.com');
    
    if (email && !isValid) {
        document.getElementById('signupSecondaryEmail').classList.add('error');
    } else {
        document.getElementById('signupSecondaryEmail').classList.remove('error');
    }
    
    return isValid;
}

function validateStudentId() {
    const id = document.getElementById('signupStudentId').value.trim();
    const isValid = /^[0-9]{4}-[0-9]{5}-[A-Z]{2}-[0-9]$/.test(id);
    
    if (id && !isValid) {
        document.getElementById('signupStudentId').classList.add('error');
    } else {
        document.getElementById('signupStudentId').classList.remove('error');
    }
    
    return isValid || !id;
}

function validateSection() {
    const section = document.getElementById('signupSection').value.trim().toUpperCase();
    const isValid = /^[0-9]+P?$/.test(section);
    
    if (section && !isValid) {
        document.getElementById('signupSection').classList.add('error');
    } else {
        document.getElementById('signupSection').classList.remove('error');
    }
    
    return isValid || !section;
}

function formatStudentId(e) {
    let value = e.target.value.toUpperCase().replace(/[^0-9A-Z-]/g, '');
    e.target.value = value;
}

/* -------------------------
   ROLE UI HANDLER
--------------------------*/
function handleRoleChange(e) {
    const role = e.target.value;
    const studentFields = document.getElementById('studentFields');
    const officerFields = document.getElementById('officerFields');
    
    if (role === 'student' || role === 'student_rep') {
        studentFields.classList.remove('hidden');
    } else {
        studentFields.classList.add('hidden');
    }
    
    if (role === 'student_rep') {
        officerFields.classList.remove('hidden');
    } else {
        officerFields.classList.add('hidden');
    }
}

/* -------------------------
   MESSAGE DISPLAY
--------------------------*/
function showMessage(msg, type) {
    const messageDiv = document.getElementById('message');
    messageDiv.textContent = msg;
    messageDiv.className = `message ${type}`;
    messageDiv.classList.remove('hidden');
    
    // Auto hide after 5 seconds
    setTimeout(() => {
        hideMessage();
    }, 5000);
}

function hideMessage() {
    const messageDiv = document.getElementById('message');
    messageDiv.classList.add('hidden');
}

// Export for use in other modules
window.authModule = {
    logout,
    getSessionUser: () => {
        const user = localStorage.getItem('sessionUser');
        return user ? JSON.parse(user) : null;
    }
};