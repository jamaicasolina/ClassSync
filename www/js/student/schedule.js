const API_URL = "http://localhost/FINAL_PROJECT/ClassSync/api/controllers";

requireRole('student');
const user = getSessionUser();

document.addEventListener('DOMContentLoaded', () => {
  ['userYear', 'userSection'].forEach(id => {
    document.getElementById(id).textContent = user[id.replace('user', '').toLowerCase()];
  });

  loadSchedule();

  document.getElementById('logoutBtn').onclick = e => {
    e.preventDefault();
    if (confirm('Logout?')) logout();
  };
});

async function loadSchedule() {
  try {
    const res = await fetch(`${API_URL}/ScheduleController.php?action=my_student_schedules`, { credentials: 'include' }),
          data = await res.json(),
          div = document.getElementById('weeklySchedule');

    if (!data.success || !data.schedules.length) {
      div.innerHTML = '<p class="no-data">No schedule available.</p>';
      return;
    }

    div.innerHTML = `<table class="table"><tbody>${
      data.schedules.map(s => `
        <tr>
          <td>${formatTime(s.start_time)} - ${formatTime(s.end_time)}</td>
          <td>${s.course_code}</td>
          <td>${s.professor_name}</td>
          <td>${s.room_number || 'TBA'}</td>
        </tr>`).join('')
    }</tbody></table>`;

  } catch {
    showMessage('Failed to load schedule', 'error');
  }
}

const formatTime = t => {
  const [h, m] = t.split(':'),
        hour = h % 12 || 12,
        suffix = h >= 12 ? 'PM' : 'AM';
  return `${hour}:${m} ${suffix}`;
};

function showMessage(msg, type) {
  const el = document.getElementById('message');
  el.textContent = msg;
  el.className = `alert alert-${type}`;
  el.classList.remove('hidden');
  setTimeout(() => el.classList.add('hidden'), 4000);
}
