const API_URL = "/FINAL_PROJECT/ClassSync/api/controllers/RoomController.php";

const roomGrid = document.getElementById("roomGrid");
const countAvailable = document.getElementById("countAvailable");
const countOccupied = document.getElementById("countOccupied");
const countMaintenance = document.getElementById("countMaintenance");

function loadRooms() {
    fetch(API_URL)
        .then(res => res.json())
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

                    <select onchange="updateStatus(${room.id}, this.value)">
                        <option value="available" ${room.status === "available" ? "selected" : ""}>Available</option>
                        <option value="occupied" ${room.status === "occupied" ? "selected" : ""}>Occupied</option>
                        <option value="maintenance" ${room.status === "maintenance" ? "selected" : ""}>Maintenance</option>
                    </select>

                    <!-- CRUD buttons -->
                    <button onclick="editRoom(${room.id})">Edit</button>
                    <button onclick="deleteRoom(${room.id})" class="danger">Delete</button>
                `;


                roomGrid.appendChild(card);
            });

            countAvailable.textContent = available;
            countOccupied.textContent = occupied;
            countMaintenance.textContent = maintenance;
        })
        .catch(() => {
            roomGrid.innerHTML = "<p style='color:red'>Failed to load rooms</p>";
        });
}

function updateStatus(id, status) {
    fetch(API_URL, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status })
    }).then(() => loadRooms());
}

function editRoom(id) {
    const room_number = prompt("Enter new room number:");
    const building = prompt("Enter building:");
    const capacity = prompt("Enter capacity:");

    if (!room_number || !building || !capacity) return;

    fetch(API_URL, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            id,
            room_number,
            building,
            capacity
        })
    }).then(() => loadRooms());
}

function deleteRoom(id) {
    if (!confirm("Are you sure you want to delete this room?")) return;

    fetch(API_URL, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
    }).then(() => loadRooms());
}
function addRoom() {
    const room_number = prompt("Enter room number:");
    const building = prompt("Enter building:");
    const capacity = prompt("Enter capacity:");

    if (!room_number || !building || !capacity) {
        alert("All fields are required.");
        return;
    }

    fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            room_number,
            building,
            capacity
        })
    })
    .then(res => res.json())
    .then(() => loadRooms());
}

loadRooms();
