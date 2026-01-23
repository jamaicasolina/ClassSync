// js/core/roles.js
// Role-based access control and session management

/* -------------------------
   SESSION MANAGEMENT
--------------------------*/

/**
 * Get current session user from localStorage
 * @returns {Object|null} User object or null
 */
function getSessionUser() {
    const userData = localStorage.getItem('sessionUser');
    if (!userData) return null;
    
    try {
        return JSON.parse(userData);
    } catch (e) {
        console.error('Error parsing session user:', e);
        return null;
    }
}

/**
 * Update session user data in localStorage
 * @param {Object} userData - Updated user data
 */
function updateSessionUser(userData) {
    localStorage.setItem('sessionUser', JSON.stringify(userData));
}

/**
 * Clear session and redirect to login
 */
function clearSession() {
    localStorage.removeItem('sessionUser');
    window.location.href = '/login.html';
}

/* -------------------------
   ROLE ACCESS CONTROL
--------------------------*/

/**
 * Check if user has required role(s)
 * Redirects to login if no session or unauthorized
 * @param {string|string[]} allowedRoles - Single role or array of allowed roles
 */
function requireRole(allowedRoles) {
    const user = getSessionUser();
    
    // Check if user is logged in
    if (!user) {
        alert('You must be logged in to access this page');
        window.location.href = '/login.html';
        return false;
    }
    
    // Convert single role to array for consistency
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    
    // Check if user's role is in allowed roles
    if (!roles.includes(user.role)) {
        alert('Access denied: You do not have permission to view this page');
        redirectToDashboard(user.role);
        return false;
    }
    
    return true;
}

/**
 * Check if current user has a specific role
 * @param {string} role - Role to check
 * @returns {boolean}
 */
function hasRole(role) {
    const user = getSessionUser();
    return user && user.role === role;
}

/**
 * Check if current user has any of the specified roles
 * @param {string[]} roles - Array of roles to check
 * @returns {boolean}
 */
function hasAnyRole(roles) {
    const user = getSessionUser();
    return user && roles.includes(user.role);
}

/* -------------------------
   ROLE INFORMATION
--------------------------*/

const ROLE_INFO = {
    professor: {
        name: 'Professor',
        dashboard: '/pages/dashboards/professor.html',
        color: '#800000',
        permissions: ['create_course', 'manage_schedule', 'open_attendance', 'view_rooms']
    },
    student: {
        name: 'Student',
        dashboard: '/pages/dashboards/student.html',
        color: '#ffd700',
        permissions: ['view_attendance', 'view_schedule', 'view_rooms']
    },
    student_rep: {
        name: 'Student Representative',
        dashboard: '/pages/dashboards/studentrep.html',
        color: '#a52a2a',
        permissions: ['view_attendance', 'input_attendance', 'view_schedule', 'view_rooms', 'book_room']
    },
    room_admin: {
        name: 'Room Administrator',
        dashboard: '/pages/dashboards/room-admin.html',
        color: '#5c0000',
        permissions: ['manage_rooms', 'view_schedule']
    },
    chairperson: {
        name: 'Chairperson',
        dashboard: '/pages/dashboards/chairperson.html',
        color: '#333333',
        permissions: ['view_reports', 'view_all_attendance', 'view_all_schedules']
    }
};

/**
 * Get information about a role
 * @param {string} role - Role identifier
 * @returns {Object|null}
 */
function getRoleInfo(role) {
    return ROLE_INFO[role] || null;
}

/**
 * Get current user's role information
 * @returns {Object|null}
 */
function getCurrentRoleInfo() {
    const user = getSessionUser();
    return user ? getRoleInfo(user.role) : null;
}

/**
 * Redirect user to their role-specific dashboard
 * @param {string} role - Role identifier
 */
function redirectToDashboard(role) {
    const roleInfo = getRoleInfo(role);
    if (roleInfo) {
        window.location.href = roleInfo.dashboard;
    } else {
        console.error('Invalid role:', role);
        clearSession();
    }
}

/* -------------------------
   DISPLAY USER INFO
--------------------------*/

/**
 * Get formatted user display name
 * @param {Object} user - User object
 * @returns {string}
 */
function getDisplayName(user) {
    if (!user) return 'Unknown User';
    
    const parts = [];
    if (user.first_name) parts.push(user.first_name);
    if (user.middle_name) parts.push(user.middle_name.charAt(0) + '.');
    if (user.surname) parts.push(user.surname);
    
    return parts.join(' ') || user.email || 'User';
}

/**
 * Get user's year and section (for students)
 * @param {Object} user - User object
 * @returns {string}
 */
function getYearSection(user) {
    if (!user || !user.year_level || !user.section) return '';
    return `${user.year_level}-${user.section}`;
}

/**
 * Render user info in the UI
 * @param {string} containerId - ID of container element
 */
function renderUserInfo(containerId) {
    const user = getSessionUser();
    if (!user) return;
    
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const roleInfo = getRoleInfo(user.role);
    const displayName = getDisplayName(user);
    const yearSection = getYearSection(user);
    
    container.innerHTML = `
        <div class="user-info">
            <div class="user-name">${displayName}</div>
            <div class="user-role">${roleInfo ? roleInfo.name : user.role}</div>
            ${yearSection ? `<div class="user-section">${yearSection}</div>` : ''}
            <div class="user-email">${user.email}</div>
        </div>
    `;
}

/* -------------------------
   INIT PAGE GUARD
--------------------------*/

/**
 * Initialize page with role check
 * Call this at the start of every protected page
 * @param {string|string[]} allowedRoles - Required role(s)
 */
function initPage(allowedRoles) {
    // Check if user has required role
    if (!requireRole(allowedRoles)) {
        return false;
    }
    
    // Update last activity timestamp
    localStorage.setItem('lastActivity', Date.now().toString());
    
    return true;
}

/* -------------------------
   EXPORTS
--------------------------*/

// Make functions available globally
window.rolesModule = {
    getSessionUser,
    updateSessionUser,
    clearSession,
    requireRole,
    hasRole,
    hasAnyRole,
    getRoleInfo,
    getCurrentRoleInfo,
    redirectToDashboard,
    getDisplayName,
    getYearSection,
    renderUserInfo,
    initPage,
    ROLE_INFO
};