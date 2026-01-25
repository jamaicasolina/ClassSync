// js/auth/profile.js
requireAuth();

const user = getSessionUser();
const API_URL = "http://localhost/FINAL_PROJECT/ClassSync/api/controllers";

// Sidebar navigation templates for each role
const navLinks = {
    professor: `
        <a href="/FINAL_PROJECT/ClassSync/www/pages/dashboards/professor.html" class="nav-item">
            <span class="nav-icon">📊</span><span>Dashboard</span>
        </a>
        <a href="/FINAL_PROJECT/ClassSync/www/pages/professor/courses.html" class="nav-item">
            <span class="nav-icon">📚</span><span>Courses</span>
        </a>
        <a href="/FINAL_PROJECT/ClassSync/www/pages/professor/schedules.html" class="nav-item">
            <span class="nav-icon">📅</span><span>Schedules</span>
        </a>
        <a href="/FINAL_PROJECT/ClassSync/www/pages/professor/attendance.html" class="nav-item">
            <span class="nav-icon">✓</span><span>Attendance</span>
        </a>
        <a href="/FINAL_PROJECT/ClassSync/www/pages/professor/notifications.html" class="nav-item">
            <span class="nav-icon">🔔</span><span>Notifications</span>
        </a>`,
    
    student: `
        <a href="/FINAL_PROJECT/ClassSync/www/pages/dashboards/student.html" class="nav-item">
            <span class="nav-icon">📊</span><span>Dashboard</span>
        </a>
        <a href="/FINAL_PROJECT/ClassSync/www/pages/student/courses.html" class="nav-item">
            <span class="nav-icon">📚</span><span>My Courses</span>
        </a>
        <a href="/FINAL_PROJECT/ClassSync/www/pages/student/schedule.html" class="nav-item">
            <span class="nav-icon">📅</span><span>My Schedule</span>
        </a>
        <a href="/FINAL_PROJECT/ClassSync/www/pages/student/attendance.html" class="nav-item">
            <span class="nav-icon">✓</span><span>My Attendance</span>
        </a>
        <a href="/FINAL_PROJECT/ClassSync/www/pages/student/notifications.html" class="nav-item">
            <span class="nav-icon">🔔</span><span>Notifications</span>
        </a>
        <a href="/FINAL_PROJECT/ClassSync/www/pages/student/student-room.html" class="nav-item">
            <span class="nav-icon">🏫</span><span>Room Availability</span>
        </a>`,

    student_rep: `
        <a href="/FINAL_PROJECT/ClassSync/www/pages/dashboards/student-rep.html" class="nav-item">
            <span class="nav-icon">📊</span><span>Dashboard</span>
        </a>
        <a href="/FINAL_PROJECT/ClassSync/www/pages/student-rep/attendance-input.html" class="nav-item">
            <span class="nav-icon">✍️</span><span>Input Attendance</span>
        </a>
        <a href="/FINAL_PROJECT/ClassSync/www/pages/student-rep/courses-sched.html" class="nav-item">
            <span class="nav-icon">📚</span><span>Courses & Schedule</span>
        </a>
        <a href="/FINAL_PROJECT/ClassSync/www/pages/student-rep/notifications.html" class="nav-item">
            <span class="nav-icon">🔔</span><span>Notifications</span>
        </a>
        <a href="/FINAL_PROJECT/ClassSync/www/pages/student-rep/rooms.html" class="nav-item">
            <span class="nav-icon">🏫</span><span>Room Availability</span>
        </a>`,

    room_admin: `
        <a href="/FINAL_PROJECT/ClassSync/www/pages/dashboards/room-admin.html" class="nav-item">
            <span class="nav-icon">📊</span><span>Dashboard</span>
        </a>
        <a href="/FINAL_PROJECT/ClassSync/www/pages/room-admin/rooms.html" class="nav-item">
            <span class="nav-icon">🏫</span><span>Manage Rooms</span>
        </a>
        <a href="/FINAL_PROJECT/ClassSync/www/pages/room-admin/notifications.html" class="nav-item">
            <span class="nav-icon">🔔</span><span>Notifications</span>
        </a>`,

    chairperson: `
        <a href="/FINAL_PROJECT/ClassSync/www/pages/dashboards/chairperson.html" class="nav-item">
            <span class="nav-icon">📊</span><span>Dashboard</span>
        </a>
        <a href="/FINAL_PROJECT/ClassSync/www/pages/chairperson/attendance-reports.html" class="nav-item">
            <span class="nav-icon">📈</span><span>Attendance Reports</span>
        </a>
        <a href="/FINAL_PROJECT/ClassSync/www/pages/chairperson/schedule-changes.html" class="nav-item">
            <span class="nav-icon">📅</span><span>Schedule Changes</span>
        </a>
        <a href="/FINAL_PROJECT/ClassSync/www/pages/chairperson/notifications.html" class="nav-item">
            <span class="nav-icon">🔔</span><span>Notifications</span>
        </a>`
};

function populateSidebar() {
    const sidebar = document.getElementById('dynamicSidebar');
    sidebar.innerHTML = `
        <div class="sidebar-header">
            <h2>ClassSync</h2>
            <p class="user-role">${formatRole(user.role)}</p>
        </div>
        <nav class="sidebar-nav">
            ${navLinks[user.role] || ''}
            <a href="/FINAL_PROJECT/ClassSync/www/pages/profile.html" class="nav-item active">
                <span class="nav-icon">👤</span><span>Profile</span>
            </a>
            <a href="#" class="nav-item" id="logoutBtn">
                <span class="nav-icon">🚪</span><span>Logout</span>
            </a>
        </nav>
    `;

    document.getElementById('logoutBtn').addEventListener('click', e => {
        e.preventDefault();
        if (confirm('Are you sure you want to logout?')) logout();
    });
}

function loadProfileData() {
    const setVal = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.value = val || '';
    };

    setVal('firstName', user.first_name);
    setVal('middleName', user.middle_name);
    setVal('surname', user.surname);
    setVal('email', user.email);
    setVal('studentId', user.student_id);
    setVal('role', formatRole(user.role));

    if (['student', 'student_rep'].includes(user.role)) {
        document.getElementById('studentFields').classList.remove('hidden');
        setVal('yearLevel', user.year_level);
        setVal('section', user.section);

        if (user.role === 'student_rep') {
            document.getElementById('officerFields').classList.remove('hidden');
            setVal('officerRole', user.officer_role);
        }
    }
}

async function updateProfile(payload) {
    try {
        const res = await fetch(`${API_URL}/AuthController.php?action=update_profile`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        
        if (data.success) {
            updateSessionUser(data.user);
            showMessage('Profile updated successfully!', 'success');
        } else {
            showMessage(data.message, 'error');
        }
    } catch (err) {
        console.error('Update error:', err);
        showMessage('Failed to update profile', 'error');
    }
}

document.getElementById('profileForm').addEventListener('submit', e => {
    e.preventDefault();
    
    const payload = {
        firstName: document.getElementById('firstName').value.trim(),
        middleName: document.getElementById('middleName').value.trim(),
        surname: document.getElementById('surname').value.trim()
    };
    
    if (['student', 'student_rep'].includes(user.role)) {
        payload.year = document.getElementById('yearLevel').value;
        payload.section = document.getElementById('section').value.trim();
        
        if (user.role === 'student_rep') {
            payload.officerRole = document.getElementById('officerRole').value;
        }
    }
    
    updateProfile(payload);
});

document.getElementById('cancelBtn').addEventListener('click', () => {
    if (confirm('Discard changes?')) loadProfileData();
});

function showMessage(msg, type) {
    const messageDiv = document.getElementById('message');
    messageDiv.textContent = msg;
    messageDiv.className = `alert alert-${type}`;
    messageDiv.classList.remove('hidden');
    setTimeout(() => messageDiv.classList.add('hidden'), 5000);
}

document.addEventListener('DOMContentLoaded', () => {
    populateSidebar();
    loadProfileData();
});