document.addEventListener('DOMContentLoaded', function() {
    initializeStorage();
    setupEventListeners();
    checkExistingSession();
});

function initializeStorage() {
    if (!localStorage.getItem('users')) {
        localStorage.setItem('users', JSON.stringify([]));
    }
    
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    if (users.length === 0) {
        const defaultUsers = [
            {
                id: generateId(),
                firstName: 'John',
                middleName: 'Michael',
                surname: 'Smith',
                email: 'professor@iskolarngbayan.pup.edu.ph',
                secondaryEmail: 'professor@gmail.com',
                studentId: '2020-00001-TN-0',
                password: 'test123',
                role: 'professor',
                year: null,
                section: null,
                officerRole: null
            },
            {
                id: generateId(),
                firstName: 'Jane',
                middleName: 'Marie',
                surname: 'Doe',
                email: 'student@iskolarngbayan.pup.edu.ph',
                secondaryEmail: 'student@gmail.com',
                studentId: '2021-12345-MN-0',
                password: 'test123',
                role: 'student',
                year: '3',
                section: '1',
                officerRole: null
            },
            {
                id: generateId(),
                firstName: 'Bob',
                middleName: 'James',
                surname: 'Wilson',
                email: 'rep@iskolarngbayan.pup.edu.ph',
                secondaryEmail: 'rep@gmail.com',
                studentId: '2022-23456-TN-1',
                password: 'test123',
                role: 'student_rep',
                year: '2',
                section: '2P',
                officerRole: 'president'
            },
            {
                id: generateId(),
                firstName: 'Alice',
                middleName: 'Rose',
                surname: 'Johnson',
                email: 'admin@iskolarngbayan.pup.edu.ph',
                secondaryEmail: 'admin@gmail.com',
                studentId: '2019-00002-AD-0',
                password: 'test123',
                role: 'room_admin',
                year: null,
                section: null,
                officerRole: null
            },
            {
                id: generateId(),
                firstName: 'Sarah',
                middleName: 'Grace',
                surname: 'Lee',
                email: 'chair@iskolarngbayan.pup.edu.ph',
                secondaryEmail: 'chair@gmail.com',
                studentId: '2018-00003-CH-0',
                password: 'test123',
                role: 'chairperson',
                year: null,
                section: null,
                officerRole: null
            }
        ];
        localStorage.setItem('users', JSON.stringify(defaultUsers));
    }
}

function setupEventListeners() {
    document.getElementById('showSignup').addEventListener('click', function(e) {
        e.preventDefault();
        toggleForms('signup');
    });
    
    document.getElementById('showLogin').addEventListener('click', function(e) {
        e.preventDefault();
        toggleForms('login');
    });
    
    document.getElementById('signupRole').addEventListener('change', handleRoleChange);
    
    document.getElementById('loginFormElement').addEventListener('submit', handleLogin);
    document.getElementById('signupFormElement').addEventListener('submit', handleSignup);
    
    document.getElementById('signupEmail').addEventListener('blur', validatePrimaryEmail);
    document.getElementById('signupSecondaryEmail').addEventListener('blur', validateSecondaryEmail);
    document.getElementById('signupStudentId').addEventListener('input', formatStudentId);
    document.getElementById('signupStudentId').addEventListener('blur', validateStudentId);
    document.getElementById('signupSection').addEventListener('blur', validateSection);
}

function toggleForms(formType) {
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const message = document.getElementById('message');
    
    message.classList.add('hidden');
    
    if (formType === 'signup') {
        loginForm.classList.add('hidden');
        signupForm.classList.remove('hidden');
    } else {
        signupForm.classList.add('hidden');
        loginForm.classList.remove('hidden');
    }
}

function validatePrimaryEmail() {
    const emailInput = document.getElementById('signupEmail');
    const email = emailInput.value.trim();
    
    const existingError = emailInput.parentElement.querySelector('.error-text');
    if (existingError) existingError.remove();
    emailInput.classList.remove('error');
    
    if (email && !email.endsWith('@iskolarngbayan.pup.edu.ph')) {
        emailInput.classList.add('error');
        const errorMsg = document.createElement('span');
        errorMsg.className = 'error-text';
        errorMsg.textContent = 'Primary email must use @iskolarngbayan.pup.edu.ph';
        emailInput.parentElement.appendChild(errorMsg);
        return false;
    }
    return true;
}

function validateSecondaryEmail() {
    const emailInput = document.getElementById('signupSecondaryEmail');
    const email = emailInput.value.trim();
    
    const existingError = emailInput.parentElement.querySelector('.error-text');
    if (existingError) existingError.remove();
    emailInput.classList.remove('error');
    
    if (email && !email.endsWith('@gmail.com')) {
        emailInput.classList.add('error');
        const errorMsg = document.createElement('span');
        errorMsg.className = 'error-text';
        errorMsg.textContent = 'Secondary email must use @gmail.com';
        emailInput.parentElement.appendChild(errorMsg);
        return false;
    }
    return true;
}

function formatStudentId(e) {
    let value = e.target.value.toUpperCase();
    value = value.replace(/[^0-9A-Z-]/g, '');
    
    if (value.length > 4 && value[4] !== '-') {
        value = value.slice(0, 4) + '-' + value.slice(4);
    }
    if (value.length > 10 && value[10] !== '-') {
        value = value.slice(0, 10) + '-' + value.slice(10);
    }
    if (value.length > 13 && value[13] !== '-') {
        value = value.slice(0, 13) + '-' + value.slice(13);
    }
    
    e.target.value = value;
}

function validateStudentId() {
    const idInput = document.getElementById('signupStudentId');
    const studentId = idInput.value.trim();
    
    const existingError = idInput.parentElement.querySelector('.error-text');
    if (existingError) existingError.remove();
    idInput.classList.remove('error');
    
    const pattern = /^[0-9]{4}-[0-9]{5}-[A-Z]{2}-[0-9]$/;
    
    if (studentId && !pattern.test(studentId)) {
        idInput.classList.add('error');
        const errorMsg = document.createElement('span');
        errorMsg.className = 'error-text';
        errorMsg.textContent = 'Student ID must follow format: YYYY-NNNNN-XX-N (e.g., 2021-12345-MN-0)';
        idInput.parentElement.appendChild(errorMsg);
        return false;
    }
    return true;
}

function validateSection() {
    const sectionInput = document.getElementById('signupSection');
    const section = sectionInput.value.trim().toUpperCase();
    
    const existingError = sectionInput.parentElement.querySelector('.error-text');
    if (existingError) existingError.remove();
    sectionInput.classList.remove('error');
    
    const pattern = /^[0-9]+P?$/;
    
    if (section && !pattern.test(section)) {
        sectionInput.classList.add('error');
        const errorMsg = document.createElement('span');
        errorMsg.className = 'error-text';
        errorMsg.textContent = 'Section must be a number or number followed by P (e.g., 1, 2, 1P, 2P)';
        sectionInput.parentElement.appendChild(errorMsg);
        return false;
    }
    
    sectionInput.value = section;
    return true;
}

function handleRoleChange(e) {
    const role = e.target.value;
    const studentFields = document.getElementById('studentFields');
    const officerFields = document.getElementById('officerFields');
    
    studentFields.classList.add('hidden');
    officerFields.classList.add('hidden');
    
    if (role === 'student' || role === 'student_rep') {
        studentFields.classList.remove('hidden');
        
        document.getElementById('signupYear').required = true;
        document.getElementById('signupSection').required = true;
        
        if (role === 'student_rep') {
            officerFields.classList.remove('hidden');
            document.getElementById('signupOfficerRole').required = true;
        } else {
            document.getElementById('signupOfficerRole').required = false;
        }
    } else {
        document.getElementById('signupYear').required = false;
        document.getElementById('signupSection').required = false;
        document.getElementById('signupOfficerRole').required = false;
    }
}

function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find(u => 
        (u.email === email || u.secondaryEmail === email) && u.password === password
    );
    
    if (user) {
        localStorage.setItem('currentUser', JSON.stringify(user));
        
        showMessage('Login successful! Redirecting...', 'success');
        
        setTimeout(() => {
            redirectToDashboard(user.role);
        }, 1000);
    } else {
        showMessage('Invalid email or password', 'error');
    }
}

function handleSignup(e) {
    e.preventDefault();
    
    const isPrimaryEmailValid = validatePrimaryEmail();
    const isSecondaryEmailValid = validateSecondaryEmail();
    const isStudentIdValid = validateStudentId();
    
    const role = document.getElementById('signupRole').value;
    let isSectionValid = true;
    if (role === 'student' || role === 'student_rep') {
        isSectionValid = validateSection();
    }
    
    if (!isPrimaryEmailValid || !isSecondaryEmailValid || !isStudentIdValid || !isSectionValid) {
        showMessage('Please fix the errors before submitting', 'error');
        return;
    }
    
    const firstNameElement = document.getElementById('signupFirstName');
    const middleNameElement = document.getElementById('signupMiddleName');
    const surnameElement = document.getElementById('signupSurname');
    
    if (!firstNameElement || !middleNameElement || !surnameElement) {
        showMessage('Error: Name fields not found. Please refresh the page.', 'error');
        console.error('Missing name field elements');
        return;
    }
    
    const firstName = firstNameElement.value.trim();
    const middleName = middleNameElement.value.trim();
    const surname = surnameElement.value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const secondaryEmail = document.getElementById('signupSecondaryEmail').value.trim();
    const studentId = document.getElementById('signupStudentId').value.trim();
    const password = document.getElementById('signupPassword').value;
    
    let year = null;
    let section = null;
    let officerRole = null;
    
    if (role === 'student' || role === 'student_rep') {
        year = document.getElementById('signupYear').value;
        section = document.getElementById('signupSection').value.trim().toUpperCase();
        
        if (role === 'student_rep') {
            officerRole = document.getElementById('signupOfficerRole').value;
        }
    }
    
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    if (users.find(u => u.email === email)) {
        showMessage('Primary email already exists', 'error');
        return;
    }
    if (secondaryEmail && users.find(u => u.secondaryEmail === secondaryEmail)) {
        showMessage('Secondary email already exists', 'error');
        return;
    }
    if (users.find(u => u.studentId === studentId)) {
        showMessage('Student ID already exists', 'error');
        return;
    }
    
    const newUser = {
        id: generateId(),
        firstName,
        middleName,
        surname,
        email,
        secondaryEmail: secondaryEmail || null,
        studentId,
        password,
        role,
        year,
        section,
        officerRole
    };
    
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    
    showMessage('Account created successfully! Please login.', 'success');
    
    document.getElementById('signupFormElement').reset();
    setTimeout(() => {
        toggleForms('login');
    }, 1500);
}

function redirectToDashboard(role) {
    const dashboards = {
        'professor': 'professor-dashboard.html',
        'student': 'student-dashboard.html',
        'student_rep': 'student-rep-dashboard.html',
        'room_admin': 'room-admin-dashboard.html',
        'chairperson': 'chairperson-dashboard.html'
    };
    
    const dashboardUrl = dashboards[role];
    if (dashboardUrl) {
        window.location.href = dashboardUrl;
    } else {
        showMessage('Invalid role', 'error');
    }
}

function checkExistingSession() {
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
        const user = JSON.parse(currentUser);
        redirectToDashboard(user.role);
    }
}

function generateId() {
    return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function showMessage(text, type) {
    const message = document.getElementById('message');
    message.textContent = text;
    message.className = 'message ' + type;
    message.classList.remove('hidden');
}

function getCurrentUser() {
    const user = localStorage.getItem('currentUser');
    return user ? JSON.parse(user) : null;
}

function isProfessor() {
    const user = getCurrentUser();
    return user && user.role === 'professor';
}

function isStudent() {
    const user = getCurrentUser();
    return user && user.role === 'student';
}

function isStudentRep() {
    const user = getCurrentUser();
    return user && user.role === 'student_rep';
}

function isRoomAdmin() {
    const user = getCurrentUser();
    return user && user.role === 'room_admin';
}

function isChairperson() {
    const user = getCurrentUser();
    return user && user.role === 'chairperson';
}

function requireRole(allowedRoles) {
    const user = getCurrentUser();
    if (!user) {
        window.location.href = 'login.html';
        return false;
    }
    
    if (!allowedRoles.includes(user.role)) {
        alert('Unauthorized access! Redirecting to your dashboard.');
        redirectToDashboard(user.role);
        return false;
    }
    
    return true;
}

function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = 'login.html';
}