const API_URL =
    "/FINAL_PROJECT/ClassSync/api/controllers/RoomController.php?action=student-availability";

const roomGrid = document.getElementById("roomGrid");
const countAvailable = document.getElementById("countAvailable");
const countOccupied = document.getElementById("countOccupied");
const countMaintenance = document.getElementById("countMaintenance");

function loadRooms() {
    fetch(API_URL)
        .then(res => {
            if (!res.ok) throw new Error("API error");
            return res.json();
        })
        .then(rooms => {
            roomGrid.innerHTML = "";

            let available = 0;
            let occupied = 0;
            let maintenance = 0;

            rooms.forEach(room => {
                if (room.status === "available") available++;
                if (room.status === "occupied") occupied++;
                if (room.status === "maintenance") maintenance++;

                const badgeClass =
                    room.status === "available" ? "badge-available" :
                    room.status === "occupied" ? "badge-occupied" :
                    "badge-maintenance";

                let extraInfo = "";

                if (room.status === "occupied" && room.professor) {
                    extraInfo = `
                        <div class="room-info">
                            <strong>Professor:</strong> ${room.professor}<br>
                            <strong>Section:</strong> ${room.section}<br>
                            <strong>Schedule:</strong> ${room.schedule_time}
                        </div>
                    `;
                }

                const card = document.createElement("div");
                card.className = "room-card";

                card.innerHTML = `
                    <div class="room-number">${room.room_number}</div>
                    <div class="room-building">${room.building}</div>
                    <div class="room-capacity">Capacity: ${room.capacity}</div>

                    <span class="status-badge ${badgeClass}">
                        ${room.status.toUpperCase()}
                    </span>

                    ${extraInfo}
                `;

                roomGrid.appendChild(card);
            });

            // UPDATE COUNTERS
            countAvailable.textContent = available;
            countOccupied.textContent = occupied;
            countMaintenance.textContent = maintenance;

            if (rooms.length === 0) {
                roomGrid.innerHTML = "<p>No rooms found.</p>";
            }
        })
        .catch(err => {
            console.error(err);
            roomGrid.innerHTML =
                "<p style='color:red'>Failed to load rooms</p>";
        });
}

function viewSchedule(roomId) {
    alert("Full room schedule feature coming soon 👀");
}

document.addEventListener("DOMContentLoaded", loadRooms);
