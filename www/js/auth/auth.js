// js/auth/auth.js
const API_URL = "http://localhost/FINAL_PROJECT/ClassSync/api/controllers";
const $ = id => document.getElementById(id);

document.addEventListener('DOMContentLoaded', () => {
    setup();
    checkExistingSession();
});

function setup() {
    $('showSignup').onclick = e => toggle(e, 'signup');
    $('showLogin').onclick = e => toggle(e, 'login');
    $('signupRole').onchange = handleRoleChange;

    $('loginFormElement').onsubmit = handleLogin;
    $('signupFormElement').onsubmit = handleSignup;

    $('signupEmail').onblur = validatePrimaryEmail;
    $('signupSecondaryEmail').onblur = validateSecondaryEmail;
    $('signupStudentId').oninput = formatStudentId;
    $('signupStudentId').onblur = validateStudentId;
    $('signupSection').onblur = validateSection;
}

const toggle = (e, type) => {
    e.preventDefault();
    $('loginForm').classList.toggle('hidden', type === 'signup');
    $('signupForm').classList.toggle('hidden', type === 'login');
    hideMessage();
};

async function handleLogin(e) {
    e.preventDefault();

    const email = $('loginEmail').value.trim();
    const password = $('loginPassword').value;
    const role = $('loginRole').value;

    if (!email || !password || !role)
        return showMessage('Please complete all fields', 'error');

    try {
        const data = await api('login', { email, password });

        if (!data.success)
            return showMessage(data.message, 'error');

        if (data.user.role !== role)
            return showMessage('Selected role does not match your account.', 'error');

        localStorage.setItem('sessionUser', JSON.stringify(data.user));
        showMessage('Login successful! Redirecting...', 'success');
        setTimeout(() => redirectToDashboard(data.role), 800);

    } catch {
        showMessage('Server connection error. Please try again.', 'error');
    }
}

async function handleSignup(e) {
    e.preventDefault();

    if (
        !validatePrimaryEmail() ||
        !validateSecondaryEmail() ||
        !validateStudentId()
    ) return showMessage('Please correct highlighted fields', 'error');

    const role = $('signupRole').value;
    if (!role) return showMessage('Please select a role', 'error');

    const payload = {
        firstName: $('signupFirstName').value.trim(),
        middleName: $('signupMiddleName').value.trim(),
        surname: $('signupSurname').value.trim(),
        email: $('signupEmail').value.trim(),
        secondaryEmail: $('signupSecondaryEmail').value.trim() || null,
        studentId: $('signupStudentId').value.trim(),
        password: $('signupPassword').value,
        role,
        year: null,
        section: null,
        officerRole: null
    };

    if (['student', 'student_rep'].includes(role)) {
        payload.year = $('signupYear').value;
        payload.section = $('signupSection').value.toUpperCase();

        if (!payload.year || !payload.section || !validateSection())
            return showMessage('Year and valid section required', 'error');

        if (role === 'student_rep') {
            payload.officerRole = $('signupOfficerRole').value;
            if (!payload.officerRole)
                return showMessage('Officer role required', 'error');
        }
    }

    try {
        const data = await api('signup', payload);

        if (!data.success)
            return showMessage(data.message, 'error');

        showMessage('Account created successfully! Please login.', 'success');
        $('signupFormElement').reset();
        $('studentFields').classList.add('hidden');
        $('officerFields').classList.add('hidden');
        setTimeout(() => toggle({ preventDefault(){} }, 'login'), 1500);

    } catch (err) {
        showMessage('Server error during signup', 'error');
        console.error(err);
    }
}

async function checkExistingSession() {
    try {
        const data = await api('session');
        if (data.loggedIn && data.user) {
            localStorage.setItem('sessionUser', JSON.stringify(data.user));
            redirectToDashboard(data.role);
        }
    } catch {}
}

async function logout() {
    try { await api('logout', null, 'POST'); } catch {}
    localStorage.removeItem('sessionUser');
    location.href = '/index.html';
}

async function api(action, body = null, method = 'POST') {
    const res = await fetch(`${API_URL}/AuthController.php?action=${action}`, {
        method,
        headers: body ? { 'Content-Type': 'application/json' } : {},
        body: body ? JSON.stringify(body) : null
    });

    const type = res.headers.get('content-type');
    if (!type || !type.includes('application/json'))
        throw new Error('Invalid JSON response');

    return res.json();
}

function redirectToDashboard(role) {
    const routes = {
        professor: '/FINAL_PROJECT/ClassSync/www/pages/dashboards/professor.html',
        student: '/FINAL_PROJECT/ClassSync/www/pages/dashboards/student.html',
        student_rep: '/FINAL_PROJECT/ClassSync/www/pages/dashboards/student-rep.html',
        room_admin: '/FINAL_PROJECT/ClassSync/www/pages/dashboards/room-admin.html',
        chairperson: '/FINAL_PROJECT/ClassSync/www/pages/dashboards/chairperson.html'
    };
    routes[role] ? location.href = routes[role] : showMessage('Invalid role', 'error');
}

const validate = (id, test) => {
    const el = $(id);
    const ok = test(el.value.trim());
    el.classList.toggle('error', el.value && !ok);
    return ok || !el.value;
};

const validatePrimaryEmail   = () => validate('signupEmail', v => v.endsWith('@iskolarngbayan.pup.edu.ph'));
const validateSecondaryEmail = () => validate('signupSecondaryEmail', v => !v || v.endsWith('@gmail.com'));
const validateStudentId      = () => validate('signupStudentId', v => /^[0-9]{4}-[0-9]{5}-[A-Z]{2}-[0-9]$/.test(v));
const validateSection        = () => validate('signupSection', v => /^[0-9]+P?$/.test(v.toUpperCase()));

const formatStudentId = e =>
    e.target.value = e.target.value.toUpperCase().replace(/[^0-9A-Z-]/g, '');

function handleRoleChange(e) {
    $('studentFields').classList.toggle('hidden', !['student','student_rep'].includes(e.target.value));
    $('officerFields').classList.toggle('hidden', e.target.value !== 'student_rep');
}

function showMessage(msg, type) {
    const m = $('message');
    m.textContent = msg;
    m.className = `message ${type}`;
    m.classList.remove('hidden');
    setTimeout(hideMessage, 5000);
}

const hideMessage = () => $('message').classList.add('hidden');

window.authModule = {
    logout,
    getSessionUser: () => JSON.parse(localStorage.getItem('sessionUser') || 'null')
};
