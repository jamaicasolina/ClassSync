// js/core/roles.js
// Unified authentication and role-based access control

const API_BASE = '/FINAL_PROJECT/ClassSync';
const DASHBOARD_PATH = `${API_BASE}/www/pages/dashboards/`;
const LOGIN_PATH = `${API_BASE}/www/index.html`;
const AUTH_API = `${API_BASE}/api/controllers/AuthController.php?action=logout`;

function getSessionUser() {
  const userStr = localStorage.getItem('sessionUser');
  if (!userStr) return null;
  try { return JSON.parse(userStr); }
  catch (e) { console.error('Error parsing session user:', e); return null; }
}

function updateSessionUser(user) {
  localStorage.setItem('sessionUser', JSON.stringify(user));
}

const isLoggedIn = () => !!getSessionUser();
const isAuthenticated = isLoggedIn; // alias

function getUserRole() {
  const user = getSessionUser();
  return user ? user.role : null;
}

function requireAuth() {
  if (!isLoggedIn()) {
    window.location.href = LOGIN_PATH;
    return false;
  }
  return true;
}

function requireRole(allowedRoles) {
  if (!requireAuth()) return false;
  const userRole = getUserRole();
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  if (!roles.includes(userRole)) {
    alert('Access denied. You do not have permission to view this page.');
    redirectToDashboard(userRole);
    return false;
  }
  return true;
}

function hasRole(role) {
  return getUserRole() === role;
}

function hasAnyRole(roles) {
  return roles.includes(getUserRole());
}

function redirectToDashboard(role) {
  const paths = {
    professor: `${DASHBOARD_PATH}professor.html`,
    student: `${DASHBOARD_PATH}student.html`,
    student_rep: `${DASHBOARD_PATH}student-rep.html`,
    room_admin: `${DASHBOARD_PATH}room-admin.html`,
    chairperson: `${DASHBOARD_PATH}chairperson.html`
  };
  const path = paths[role] || LOGIN_PATH;
  window.location.href = path;
}

function getUserDisplayName() {
  const user = getSessionUser();
  return user ? `${user.first_name} ${user.surname}` : 'Guest';
}

function getUserDetails() {
  const u = getSessionUser();
  if (!u) return null;
  return {
    id: u.id,
    firstName: u.first_name,
    middleName: u.middle_name,
    surname: u.surname,
    fullName: `${u.first_name} ${u.middle_name} ${u.surname}`.trim(),
    email: u.email,
    secondaryEmail: u.secondary_email,
    studentId: u.student_id,
    role: u.role,
    yearLevel: u.year_level,
    section: u.section,
    officerRole: u.officer_role
  };
}

function formatRole(role) {
  return {
    professor: 'Professor',
    student: 'Student',
    student_rep: 'Student Representative',
    room_admin: 'Room Administrator',
    chairperson: 'Chairperson'
  }[role] || role;
}

function formatOfficerRole(officerRole) {
  return {
    president: 'President',
    vice_president: 'Vice President',
    secretary: 'Secretary',
    treasurer: 'Treasurer',
    auditor: 'Auditor',
    pio: 'Public Information Officer'
  }[officerRole] || officerRole;
}

async function logout() {
  try {
    await fetch(AUTH_API, { method: 'POST', credentials: 'include' });
  } catch (e) {
    console.error('Logout API error:', e);
  }
  localStorage.removeItem('sessionUser');
  window.location.href = LOGIN_PATH;
}

// Export for CommonJS environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    getSessionUser,
    updateSessionUser,
    isLoggedIn,
    isAuthenticated,
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
