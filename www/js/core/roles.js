// js/core/roles.js

/**
 * Get current session user from localStorage
 * @returns {Object|null} User object or null if not logged in
 */
function getSessionUser() {
    const userStr = localStorage.getItem('sessionUser');
    if (!userStr) return null;
    
    try {
        return JSON.parse(userStr);
    } catch (e) {
        console.error('Error parsing session user:', e);
        return null;
    }
}

/**
 * Update session user in localStorage
 * @param {Object} user - Updated user object
 */
function updateSessionUser(user) {
    localStorage.setItem('sessionUser', JSON.stringify(user));
}

/**
 * Check if user is logged in
 * @returns {boolean}
 */
function isLoggedIn() {
    return getSessionUser() !== null;
}

/**
 * Get user role
 * @returns {string|null} User role or null
 */
function getUserRole() {
    const user = getSessionUser();
    return user ? user.role : null;
}

/**
 * Require user to be logged in
 * Redirects to login page if not logged in
 */
function requireAuth() {
    if (!isLoggedIn()) {
        window.location.href = '/FINAL_PROJECT/ClassSync/www/index.html';
        return false;
    }
    return true;
}

/**
 * Require specific role(s) to access page
 * @param {string|string[]} allowedRoles - Single role or array of allowed roles
 */
function requireRole(allowedRoles) {
    if (!requireAuth()) return false;
    
    const user = getSessionUser();
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    
    if (!roles.includes(user.role)) {
        alert('Access denied. You do not have permission to view this page.');
        redirectToDashboard(user.role);
        return false;
    }
    
    return true;
}

/**
 * Check if user has specific role
 * @param {string} role - Role to check
 * @returns {boolean}
 */
function hasRole(role) {
    const user = getSessionUser();
    return user && user.role === role;
}

/**
 * Check if user has any of the specified roles
 * @param {string[]} roles - Array of roles to check
 * @returns {boolean}
 */
function hasAnyRole(roles) {
    const user = getSessionUser();
    return user && roles.includes(user.role);
}

/**
 * Redirect to appropriate dashboard based on role
 * @param {string} role - User role
 */
function redirectToDashboard(role) {
    const dashboardMap = {
        professor: '/FINAL_PROJECT/ClassSync/www/pages/dashboards/professor.html',
        student: '/FINAL_PROJECT/ClassSync/www/pages/dashboards/student.html',
        student_rep: '/FINAL_PROJECT/ClassSync/www/pages/dashboards/student-rep.html',
        room_admin: '/FINAL_PROJECT/ClassSync/www/pages/dashboards/room-admin.html',
        chairperson: '/FINAL_PROJECT/ClassSync/www/pages/dashboards/chairperson.html'
    };
    
    const path = dashboardMap[role];
    if (path) {
        window.location.href = path;
    } else {
        console.error('Unknown role:', role);
        window.location.href = '/FINAL_PROJECT/ClassSync/www/index.html';
    }
}

/**
 * Get user display name
 * @returns {string}
 */
function getUserDisplayName() {
    const user = getSessionUser();
    if (!user) return 'Guest';
    
    return `${user.first_name} ${user.surname}`;
}

/**
 * Get user full details
 * @returns {Object}
 */
function getUserDetails() {
    const user = getSessionUser();
    if (!user) return null;
    
    return {
        id: user.id,
        firstName: user.first_name,
        middleName: user.middle_name,
        surname: user.surname,
        fullName: `${user.first_name} ${user.middle_name} ${user.surname}`,
        email: user.email,
        secondaryEmail: user.secondary_email,
        studentId: user.student_id,
        role: user.role,
        yearLevel: user.year_level,
        section: user.section,
        officerRole: user.officer_role
    };
}

/**
 * Format role for display
 * @param {string} role - Role code
 * @returns {string}
 */
function formatRole(role) {
    const roleMap = {
        professor: 'Professor',
        student: 'Student',
        student_rep: 'Student Representative',
        room_admin: 'Room Administrator',
        chairperson: 'Chairperson'
    };
    
    return roleMap[role] || role;
}

/**
 * Format officer role for display
 * @param {string} officerRole - Officer role code
 * @returns {string}
 */
function formatOfficerRole(officerRole) {
    const roleMap = {
        president: 'President',
        vice_president: 'Vice President',
        secretary: 'Secretary',
        treasurer: 'Treasurer',
        auditor: 'Auditor',
        pio: 'Public Information Officer'
    };
    
    return roleMap[officerRole] || officerRole;
}

/**
 * Logout user and redirect to login
 */
async function logout() {
    try {
        await fetch('http://localhost/classsync/api/controllers/AuthController.php?action=logout', {
            method: 'POST'
        });
    } catch (err) {
        console.error('Logout API error:', err);
    }
    
    localStorage.removeItem('sessionUser');
    window.location.href = '/FINAL_PROJECT/ClassSync/www/index.html';
}

// Export functions for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        getSessionUser,
        updateSessionUser,
        isLoggedIn,
        getUserRole,
        requireAuth,
        requireRole,
        hasRole,
        hasAnyRole,
        redirectToDashboard,
        getUserDisplayName,
        getUserDetails,
        formatRole,
        formatOfficerRole,
        logout
    };
}