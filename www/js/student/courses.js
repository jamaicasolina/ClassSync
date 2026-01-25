const API_URL = "http://localhost/FINAL_PROJECT/ClassSync/api/controllers/CourseController.php";

requireRole('student');
const user = getSessionUser();

document.addEventListener('DOMContentLoaded', () => {
    loadEnrolledCourses();
    document.getElementById('logoutBtn').onclick = e => {
        e.preventDefault();
        if (confirm('Are you sure you want to logout?')) logout();
    };
});

async function loadEnrolledCourses() {
    try {
        const res = await fetch(`${API_URL}?action=my_enrolled`),
              data = await res.json(),
              list = document.getElementById('enrolledCoursesList');

        if (!data.success || !data.courses.length) {
            list.innerHTML = '<p class="no-data">You are not enrolled in any courses yet.</p>';
            return;
        }

        list.innerHTML = `
            <table class="table">
                <thead>
                    <tr>
                        <th>Course Code</th><th>Course Name</th><th>Professor</th><th>Year/Section</th><th>Enrolled On</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.courses.map(c => `
                        <tr>
                            <td><strong>${c.course_code}</strong></td>
                            <td>${c.course_name}</td>
                            <td>${c.professor_name || 'N/A'}</td>
                            <td>${c.year_level}-${c.section}</td>
                            <td>${new Date(c.enrolled_at).toLocaleDateString()}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } catch (err) {
        console.error('Error loading courses:', err);
        showMessage('Failed to load enrolled courses', 'error');
    }
}

function showMessage(msg, type) {
    const el = document.getElementById('message');
    el.textContent = msg;
    el.className = `alert alert-${type}`;
    el.classList.remove('hidden');
    setTimeout(() => el.classList.add('hidden'), 5000);
}
