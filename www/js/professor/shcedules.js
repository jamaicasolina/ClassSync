// js/professor/schedules.js

const API_URL = "/FINAL_PROJECT/ClassSync/api/controllers";
let currentScheduleId = null;
let isEditMode = false;

// Check authentication
requireRole('professor');

// Setup event listeners
document.addEventListener('DOMContentLoaded', () => {
    loadSchedules();
    loadCourses();
    loadRooms();

    document.getElementById('openCreateScheduleModal').onclick = openCreateScheduleModal;
    document.getElementById('closeScheduleModal').onclick = closeScheduleModal;
    document.getElementById('scheduleForm').onsubmit = handleScheduleSubmit;
    document.getElementById('logoutBtn').onclick = e => {
        e.preventDefault();
        if (confirm('Are you sure you want to logout?')) logout();
    };

    // Day checkbox listeners
    document.querySelectorAll('.day-checkbox').forEach(checkbox => {
        checkbox.onchange = toggleTimeInputs;
    });
});

/* =====================================
   TOGGLE TIME INPUTS
===================================== */
function toggleTimeInputs() {
    const anyChecked = Array.from(document.querySelectorAll('.day-checkbox')).some(cb => cb.checked);
    const timeInputs = document.getElementById('timeInputs');
    
    if (anyChecked) {
        timeInputs.classList.remove('hidden');
        document.getElementById('scheduleStartTime').required = true;
        document.getElementById('scheduleEndTime').required = true;
    } else {
        timeInputs.classList.add('hidden');
        document.getElementById('scheduleStartTime').required = false;
        document.getElementById('scheduleEndTime').required = false;
    }
}

/* =====================================
   LOAD COURSES
===================================== */
async function loadCourses() {
    try {
        const res = await fetch(`${API_URL}/CourseController.php?action=my_courses`);
        const data = await res.json();

        const select = document.getElementById('scheduleCourse');
        select.innerHTML = '<option value="">Select Course</option>';

        if (data.success && data.courses.length > 0) {
            data.courses.forEach(course => {
                const option = document.createElement('option');
                option.value = course.id;
                option.textContent = `${course.course_code} - ${course.course_name} (${course.year_level}-${course.section})`;
                select.appendChild(option);
            });
        }
    } catch (err) {
        console.error('Error loading courses:', err);
    }
}

/* =====================================
   LOAD ROOMS
===================================== */
async function loadRooms() {
    try {
        const res = await fetch(`${API_URL}/RoomController.php`);
        const rooms = await res.json();

        const select = document.getElementById('scheduleRoom');
        select.innerHTML = '<option value="">Select Room</option>';

        if (rooms.length > 0) {
            rooms.forEach(room => {
                const option = document.createElement('option');
                option.value = room.id;
                option.textContent = `${room.room_number} - ${room.building} (Capacity: ${room.capacity})`;
                select.appendChild(option);
            });
        }
    } catch (err) {
        console.error('Error loading rooms:', err);
    }
}

/* =====================================
   LOAD SCHEDULES
===================================== */
async function loadSchedules() {
    try {
        const res = await fetch(`${API_URL}/ScheduleController.php?action=my_schedules`);
        const data = await res.json();

        const scheduleDiv = document.getElementById('weeklySchedule');

        if (!data.success || data.schedules.length === 0) {
            scheduleDiv.innerHTML = '<p class="no-data">No schedules created yet. Click "Create Schedule" to add one.</p>';
            return;
        }

        // Group by day
        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const grouped = {};

        days.forEach(day => {
            grouped[day] = data.schedules.filter(s => s.day_of_week === day);
        });

        let html = '<div style="display: grid; gap: 20px;">';

        days.forEach(day => {
            const daySchedules = grouped[day];
            const dayName = day.charAt(0).toUpperCase() + day.slice(1);

            html += `
                <div class="card">
                    <div class="card-header">
                        <h3>${dayName}</h3>
                    </div>
                    <div class="card-body">
            `;

            if (daySchedules.length === 0) {
                html += '<p class="no-data">No classes scheduled</p>';
            } else {
                html += '<table class="table"><thead><tr><th>Time</th><th>Course</th><th>Room</th><th>Status</th><th>Actions</th></tr></thead><tbody>';
                
                daySchedules.forEach(schedule => {
                    const statusBadge = schedule.is_cancelled 
                        ? '<span class="badge badge-danger">Cancelled</span>'
                        : '<span class="badge badge-success">Active</span>';

                    const timeStr = `${formatTime(schedule.start_time)} - ${formatTime(schedule.end_time)}`;

                    html += `
                        <tr>
                            <td><strong>${timeStr}</strong></td>
                            <td>${schedule.course_code} - ${schedule.course_name}<br><small>${schedule.section}</small></td>
                            <td>${schedule.room_number || 'N/A'}</td>
                            <td>${statusBadge}</td>
                            <td>
                                <button class="btn btn-sm" onclick="openEditScheduleModal(${schedule.id})">Edit</button>
                                ${schedule.is_cancelled 
                                    ? `<button class="btn btn-sm btn-secondary" onclick="uncancelSchedule(${schedule.id})">Uncancel</button>`
                                    : `<button class="btn btn-sm btn-warning" onclick="openCancelModal(${schedule.id})">Cancel</button>`
                                }
                                <button class="btn btn-sm btn-danger" onclick="deleteSchedule(${schedule.id})">Delete</button>
                            </td>
                        </tr>
                    `;
                });

                html += '</tbody></table>';
            }

            html += '</div></div>';
        });

        html += '</div>';
        scheduleDiv.innerHTML = html;

    } catch (err) {
        console.error('Error loading schedules:', err);
        showMessage('Failed to load schedules', 'error');
    }
}

/* =====================================
   OPEN CREATE MODAL
===================================== */
function openCreateScheduleModal() {
    currentScheduleId = null;
    isEditMode = false;
    document.getElementById('scheduleModalTitle').textContent = 'Create Schedule';
    document.getElementById('scheduleForm').reset();
    document.getElementById('scheduleId').value = '';
    document.getElementById('reasonGroup').classList.add('hidden');
    document.getElementById('timeInputs').classList.add('hidden');
    
    document.querySelectorAll('.day-checkbox').forEach(cb => cb.checked = false);
    
    document.getElementById('scheduleModal').classList.remove('hidden');
}

/* =====================================
   OPEN EDIT MODAL
===================================== */
async function openEditScheduleModal(scheduleId) {
    try {
        const res = await fetch(`${API_URL}/ScheduleController.php?action=get&id=${scheduleId}`);
        const data = await res.json();

        if (!data.success) {
            showMessage('Failed to load schedule', 'error');
            return;
        }

        const schedule = data.schedule;
        currentScheduleId = scheduleId;
        isEditMode = true;

        document.getElementById('scheduleModalTitle').textContent = 'Edit Schedule';
        document.getElementById('scheduleId').value = scheduleId;
        document.getElementById('scheduleCourse').value = schedule.course_id;
        document.getElementById('scheduleRoom').value = schedule.room_id || '';
        document.getElementById('scheduleStartTime').value = schedule.start_time;
        document.getElementById('scheduleEndTime').value = schedule.end_time;

        // Check the day
        document.querySelectorAll('.day-checkbox').forEach(cb => {
            cb.checked = cb.value === schedule.day_of_week;
        });

        toggleTimeInputs();
        document.getElementById('reasonGroup').classList.remove('hidden');
        document.getElementById('scheduleReason').required = true;

        document.getElementById('scheduleModal').classList.remove('hidden');

    } catch (err) {
        console.error('Error loading schedule:', err);
        showMessage('Failed to load schedule', 'error');
    }
}

/* =====================================
   CLOSE MODAL
===================================== */
function closeScheduleModal() {
    document.getElementById('scheduleModal').classList.add('hidden');
    document.getElementById('scheduleForm').reset();
    document.getElementById('reasonGroup').classList.add('hidden');
    document.getElementById('scheduleReason').required = false;
    currentScheduleId = null;
    isEditMode = false;
}

/* =====================================
   HANDLE SCHEDULE SUBMIT
===================================== */
async function handleScheduleSubmit(e) {
    e.preventDefault();

    const course_id = document.getElementById('scheduleCourse').value;
    const room_id = document.getElementById('scheduleRoom').value;
    const start_time = document.getElementById('scheduleStartTime').value;
    const end_time = document.getElementById('scheduleEndTime').value;

    // Get selected days
    const selectedDays = Array.from(document.querySelectorAll('.day-checkbox:checked')).map(cb => cb.value);

    if (selectedDays.length === 0) {
        showMessage('Please select at least one day', 'error');
        return;
    }

    if (isEditMode) {
        // Update existing schedule (single day only)
        const reason = document.getElementById('scheduleReason').value.trim();
        if (!reason) {
            showMessage('Please provide a reason for the change', 'error');
            return;
        }

        await updateSchedule({
            id: currentScheduleId,
            room_id,
            day_of_week: selectedDays[0],
            start_time,
            end_time,
            reason
        });
    } else {
        // Create new schedules (batch)
        await createScheduleBatch({
            course_id,
            room_id,
            days: selectedDays,
            start_time,
            end_time
        });
    }
}

/* =====================================
   CREATE SCHEDULE BATCH
===================================== */
async function createScheduleBatch(payload) {
    try {
        const res = await fetch(`${API_URL}/ScheduleController.php?action=create_batch`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await res.json();

        if (data.success) {
            showMessage(data.message, 'success');
            if (data.failed_days.length > 0) {
                showMessage(`Failed to create schedules for: ${data.failed_days.join(', ')}`, 'error');
            }
            closeScheduleModal();
            loadSchedules();
        } else {
            showMessage(data.message, 'error');
        }
    } catch (err) {
        console.error('Error creating schedules:', err);
        showMessage('Failed to create schedules', 'error');
    }
}

/* =====================================
   UPDATE SCHEDULE
===================================== */
async function updateSchedule(payload) {
    try {
        const res = await fetch(`${API_URL}/ScheduleController.php?action=update`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await res.json();

        if (data.success) {
            showMessage('Schedule updated successfully!', 'success');
            closeScheduleModal();
            loadSchedules();
        } else {
            showMessage(data.message, 'error');
        }
    } catch (err) {
        console.error('Error updating schedule:', err);
        showMessage('Failed to update schedule', 'error');
    }
}

/* =====================================
   OPEN CANCEL MODAL
===================================== */
function openCancelModal(scheduleId) {
    const reason = prompt('Enter reason for cancellation:');
    if (reason && reason.trim()) {
        cancelSchedule(scheduleId, reason.trim());
    }
}

/* =====================================
   CANCEL SCHEDULE
===================================== */
async function cancelSchedule(scheduleId, reason) {
    try {
        const res = await fetch(`${API_URL}/ScheduleController.php?action=cancel`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: scheduleId, reason })
        });

        const data = await res.json();

        if (data.success) {
            showMessage('Schedule cancelled successfully', 'success');
            loadSchedules();
        } else {
            showMessage(data.message, 'error');
        }
    } catch (err) {
        console.error('Error cancelling schedule:', err);
        showMessage('Failed to cancel schedule', 'error');
    }
}

/* =====================================
   UNCANCEL SCHEDULE
===================================== */
async function uncancelSchedule(scheduleId) {
    if (!confirm('Uncancel this schedule?')) return;

    try {
        const res = await fetch(`${API_URL}/ScheduleController.php?action=uncancel`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: scheduleId })
        });

        const data = await res.json();

        if (data.success) {
            showMessage('Schedule uncancelled successfully', 'success');
            loadSchedules();
        } else {
            showMessage(data.message, 'error');
        }
    } catch (err) {
        console.error('Error uncancelling schedule:', err);
        showMessage('Failed to uncancel schedule', 'error');
    }
}

/* =====================================
   DELETE SCHEDULE
===================================== */
async function deleteSchedule(scheduleId) {
    if (!confirm('Are you sure you want to delete this schedule?')) return;

    try {
        const res = await fetch(`${API_URL}/ScheduleController.php?action=delete`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: scheduleId })
        });

        const data = await res.json();

        if (data.success) {
            showMessage('Schedule deleted successfully', 'success');
            loadSchedules();
        } else {
            showMessage(data.message, 'error');
        }
    } catch (err) {
        console.error('Error deleting schedule:', err);
        showMessage('Failed to delete schedule', 'error');
    }
}

/* =====================================
   UTILITY FUNCTIONS
===================================== */
function formatTime(time) {
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayHour = h % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
}

function showMessage(msg, type) {
    const messageDiv = document.getElementById('message');
    messageDiv.textContent = msg;
    messageDiv.className = `alert alert-${type}`;
    messageDiv.classList.remove('hidden');

    setTimeout(() => {
        messageDiv.classList.add('hidden');
    }, 5000);
}