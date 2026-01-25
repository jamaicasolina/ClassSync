const SCHEDULE_API = "http://localhost/FINAL_PROJECT/ClassSync/api/controllers/ScheduleController.php";
const COURSE_API = "http://localhost/FINAL_PROJECT/ClassSync/api/controllers/CourseController.php";
const ROOM_API = "http://localhost/FINAL_PROJECT/ClassSync/api/controllers/RoomController.php";
let currentScheduleId = null, isEditMode = false;

requireRole('professor');

document.addEventListener('DOMContentLoaded', () => {
    loadSchedules();
    loadCourses();
    loadRooms();

    const dayCheckboxes = document.querySelectorAll('.day-checkbox');
    dayCheckboxes.forEach(cb => cb.onchange = toggleDayTimeInputs);

    document.getElementById('openCreateScheduleModal').onclick = openCreateScheduleModal;
    document.getElementById('closeScheduleModal').onclick = closeScheduleModal;
    document.getElementById('scheduleForm').onsubmit = handleScheduleSubmit;
    document.getElementById('logoutBtn').onclick = e => {
        e.preventDefault();
        if (confirm('Are you sure you want to logout?')) logout();
    };
});

function toggleDayTimeInputs(e) {
    const day = e.target.dataset.day,
        container = document.getElementById(`${day}-times`),
        [startInput, endInput] = [container.querySelector('.day-start-time'), container.querySelector('.day-end-time')];
    if (e.target.checked) {
        container.classList.add('active');
        startInput.required = endInput.required = true;
    } else {
        container.classList.remove('active');
        startInput.required = endInput.required = false;
        startInput.value = endInput.value = '';
    }
}

async function loadCourses() {
    try {
        const res = await fetch(`${COURSE_API}?action=my_courses`), data = await res.json();
        const select = document.getElementById('scheduleCourse');
        select.innerHTML = '<option value="">Select Course</option>';
        if (data.success && data.courses.length) {
            data.courses.forEach(c => {
                const option = new Option(`${c.course_code} - ${c.course_name} (${c.year_level}-${c.section})`, c.id);
                select.appendChild(option);
            });
        }
    } catch (err) {
        console.error('Error loading courses:', err);
    }
}

async function loadRooms() {
    try {
        const res = await fetch(ROOM_API), rooms = await res.json();
        const select = document.getElementById('scheduleRoom');
        select.innerHTML = '<option value="">No Room Assigned</option>';
        if (rooms.length) {
            rooms.forEach(r => {
                const option = new Option(`${r.room_number} - ${r.building} (Capacity: ${r.capacity})`, r.id);
                select.appendChild(option);
            });
        }
    } catch (err) {
        console.error('Error loading rooms:', err);
    }
}

async function loadSchedules() {
    try {
        const res = await fetch(`${SCHEDULE_API}?action=my_schedules`), data = await res.json();
        const scheduleDiv = document.getElementById('weeklySchedule');
        if (!data.success || !data.schedules.length) {
            scheduleDiv.innerHTML = '<p class="no-data">No schedules created yet. Click "Create Schedule" to add one.</p>';
            return;
        }

        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
            grouped = days.reduce((acc, d) => ({ ...acc, [d]: data.schedules.filter(s => s.day_of_week === d) }), {});

        scheduleDiv.innerHTML = `<div style="display: grid; gap: 20px;">
            ${days.map(day => {
                const daySchedules = grouped[day],
                    dayName = day.charAt(0).toUpperCase() + day.slice(1),
                    content = !daySchedules.length
                        ? '<p class="no-data">No classes scheduled</p>'
                        : `<table class="table"><thead><tr><th>Time</th><th>Course</th><th>Room</th><th>Status</th><th>Actions</th></tr></thead><tbody>${
                            daySchedules.map(schedule => {
                                const statusBadge = schedule.is_cancelled
                                    ? '<span class="badge badge-danger">Cancelled</span>'
                                    : '<span class="badge badge-success">Active</span>';
                                const timeStr = `${formatTime(schedule.start_time)} - ${formatTime(schedule.end_time)}`;
                                return `<tr>
                                    <td><strong>${timeStr}</strong></td>
                                    <td>${schedule.course_code} - ${schedule.course_name}<br><small>${schedule.section}</small></td>
                                    <td>${schedule.room_number || 'N/A'}</td>
                                    <td>${statusBadge}</td>
                                    <td>
                                        <button class="btn btn-sm" onclick="openEditScheduleModal(${schedule.id})">Edit</button>
                                        ${schedule.is_cancelled
                                            ? `<button class="btn btn-sm btn-secondary" onclick="uncancelSchedule(${schedule.id})">Uncancel</button>`
                                            : `<button class="btn btn-sm btn-warning" onclick="openCancelModal(${schedule.id})">Cancel</button>`}
                                        <button class="btn btn-sm btn-danger" onclick="deleteSchedule(${schedule.id})">Delete</button>
                                    </td>
                                </tr>`;
                            }).join('')
                        }</tbody></table>`;
                return `<div class="card"><div class="card-header"><h3>${dayName}</h3></div><div class="card-body">${content}</div></div>`;
            }).join('')}
        </div>`;
    } catch (err) {
        console.error('Error loading schedules:', err);
        showMessage('Failed to load schedules', 'error');
    }
}

function openCreateScheduleModal() {
    currentScheduleId = null; isEditMode = false;
    document.getElementById('scheduleModalTitle').textContent = 'Create Schedule';
    document.getElementById('scheduleForm').reset();
    document.getElementById('scheduleId').value = '';
    document.getElementById('reasonGroup').classList.add('hidden');

    document.querySelectorAll('.day-checkbox').forEach(cb => {
        cb.checked = false;
        const container = document.getElementById(`${cb.dataset.day}-times`);
        container.classList.remove('active');
        container.querySelector('.day-start-time').required = false;
        container.querySelector('.day-end-time').required = false;
    });

    document.getElementById('scheduleModal').classList.remove('hidden');
}

async function openEditScheduleModal(scheduleId) {
    try {
        const res = await fetch(`${SCHEDULE_API}?action=get&id=${scheduleId}`), data = await res.json();
        if (!data.success) return showMessage('Failed to load schedule', 'error');

        const s = data.schedule;
        currentScheduleId = scheduleId; isEditMode = true;

        document.getElementById('scheduleModalTitle').textContent = 'Edit Schedule';
        document.getElementById('scheduleId').value = scheduleId;
        document.getElementById('scheduleCourse').value = s.course_id;
        document.getElementById('scheduleRoom').value = s.room_id || '';

        document.querySelectorAll('.day-checkbox').forEach(cb => {
            cb.checked = false;
            document.getElementById(`${cb.dataset.day}-times`).classList.remove('active');
        });

        const dayCheckbox = document.querySelector(`.day-checkbox[data-day="${s.day_of_week}"]`);
        if (dayCheckbox) {
            dayCheckbox.checked = true;
            const container = document.getElementById(`${s.day_of_week}-times`);
            container.classList.add('active');
            container.querySelector('.day-start-time').value = s.start_time;
            container.querySelector('.day-end-time').value = s.end_time;
            container.querySelector('.day-start-time').required = true;
            container.querySelector('.day-end-time').required = true;
        }

        const reasonGroup = document.getElementById('reasonGroup');
        reasonGroup.classList.remove('hidden');
        document.getElementById('scheduleReason').required = true;

        document.getElementById('scheduleModal').classList.remove('hidden');
    } catch (err) {
        console.error('Error loading schedule:', err);
        showMessage('Failed to load schedule', 'error');
    }
}

function closeScheduleModal() {
    document.getElementById('scheduleModal').classList.add('hidden');
    document.getElementById('scheduleForm').reset();
    const reasonGroup = document.getElementById('reasonGroup');
    reasonGroup.classList.add('hidden');
    document.getElementById('scheduleReason').required = false;

    document.querySelectorAll('.time-inputs-inline').forEach(div => div.classList.remove('active'));

    currentScheduleId = null; isEditMode = false;
}

async function handleScheduleSubmit(e) {
    e.preventDefault();

    const course_id = document.getElementById('scheduleCourse').value,
        room_id = document.getElementById('scheduleRoom').value;

    if (!course_id) return showMessage('Please select a course', 'error');

    const selectedDays = Array.from(document.querySelectorAll('.day-checkbox:checked')).map(cb => {
        const day = cb.value,
            container = document.getElementById(`${day}-times`);
        return {
            day,
            start_time: container.querySelector('.day-start-time').value,
            end_time: container.querySelector('.day-end-time').value
        };
    }).filter(d => d.start_time && d.end_time);

    if (!selectedDays.length) return showMessage('Please select at least one day and set its time', 'error');

    if (isEditMode) {
        const reason = document.getElementById('scheduleReason').value.trim();
        if (!reason) return showMessage('Please provide a reason for the change', 'error');

        await updateSchedule({
            id: currentScheduleId,
            room_id: room_id || null,
            day_of_week: selectedDays[0].day,
            start_time: selectedDays[0].start_time,
            end_time: selectedDays[0].end_time,
            reason
        });
    } else {
        await createScheduleBatch({ course_id, room_id: room_id || null, schedules: selectedDays });
    }
}

async function createScheduleBatch({ course_id, room_id, schedules }) {
    try {
        let created = 0, failed = [];

        for (const s of schedules) {
            const res = await fetch(`${SCHEDULE_API}?action=create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ course_id, room_id, day_of_week: s.day, start_time: s.start_time, end_time: s.end_time })
            });
            const data = await res.json();
            data.success ? created++ : failed.push(s.day);
        }

        if (created) {
            showMessage(`Created ${created} schedule(s) successfully!`, 'success');
            if (failed.length) showMessage(`Failed for: ${failed.join(', ')}`, 'error');
            closeScheduleModal();
            loadSchedules();
        } else {
            showMessage('Failed to create schedules - possible room conflicts', 'error');
        }
    } catch (err) {
        console.error('Error creating schedules:', err);
        showMessage('Failed to create schedules', 'error');
    }
}

async function updateSchedule(payload) {
    try {
        const res = await fetch(`${SCHEDULE_API}?action=update`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        data.success ? (showMessage('Schedule updated successfully!', 'success'), closeScheduleModal(), loadSchedules())
                     : showMessage(data.message, 'error');
    } catch (err) {
        console.error('Error updating schedule:', err);
        showMessage('Failed to update schedule', 'error');
    }
}

function openCancelModal(scheduleId) {
    const reason = prompt('Enter reason for cancellation:');
    if (reason?.trim()) cancelSchedule(scheduleId, reason.trim());
}

async function cancelSchedule(scheduleId, reason) {
    try {
        const res = await fetch(`${SCHEDULE_API}?action=cancel`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: scheduleId, reason })
        });
        const data = await res.json();
        data.success ? (showMessage('Schedule cancelled successfully', 'success'), loadSchedules())
                     : showMessage(data.message, 'error');
    } catch (err) {
        console.error('Error cancelling schedule:', err);
        showMessage('Failed to cancel schedule', 'error');
    }
}

async function uncancelSchedule(scheduleId) {
    if (!confirm('Uncancel this schedule?')) return;
    try {
        const res = await fetch(`${SCHEDULE_API}?action=uncancel`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: scheduleId })
        });
        const data = await res.json();
        data.success ? (showMessage('Schedule uncancelled successfully', 'success'), loadSchedules())
                     : showMessage(data.message, 'error');
    } catch (err) {
        console.error('Error uncancelling schedule:', err);
        showMessage('Failed to uncancel schedule', 'error');
    }
}

async function deleteSchedule(scheduleId) {
    if (!confirm('Are you sure you want to delete this schedule?')) return;
    try {
        const res = await fetch(`${SCHEDULE_API}?action=delete`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: scheduleId })
        });
        const data = await res.json();
        data.success ? (showMessage('Schedule deleted successfully', 'success'), loadSchedules())
                     : showMessage(data.message, 'error');
    } catch (err) {
        console.error('Error deleting schedule:', err);
        showMessage('Failed to delete schedule', 'error');
    }
}

function formatTime(time) {
    const [h, m] = time.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 || 12;
    return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`;
}

function showMessage(msg, type) {
    const el = document.getElementById('message');
    el.textContent = msg;
    el.className = `alert alert-${type}`;
    el.classList.remove('hidden');
    setTimeout(() => el.classList.add('hidden'), 5000);
}
