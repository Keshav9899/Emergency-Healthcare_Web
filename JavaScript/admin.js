let currentRoute = null;
const auth = firebase.auth();
const db = firebase.firestore();

// Admin Auth Check
auth.onAuthStateChanged(async (user) => {
    if (!user) {
        window.location.href = "Login.html";
        return;
    }

    const snap = await db.collection("users").doc(user.uid).get();
    const role = snap.data().role.trim();

    if (role !== "admin") {
        alert("Access denied: Not an admin");
        window.location.href = "index.html";
        return;
    }

    // Setup logout button (only after auth confirmed)
    const logoutBtn = document.getElementById("adminLogoutBtn");
    if (logoutBtn) {
        logoutBtn.onclick = async () => {
            await auth.signOut();
            window.location.href = "index.html";
        };
    }
});

// Emergency List
db.collection('emergencies')
    .onSnapshot(snapshot => {

        const container = document.getElementById('emergencyList');
        container.innerHTML = "";

        const docs = snapshot.docs.sort((a, b) => {
            return a.data().status === "Pending" ? -1 : 1;
        });

        docs.forEach(doc => {
            const data = doc.data();
            if (data.status === "Completed") {

                if (emergencyMarkers[doc.id]) {
                    map.removeLayer(emergencyMarkers[doc.id]);
                    delete emergencyMarkers[doc.id];
                }

                return;
            }
            const lat = data.location?.lat || "N/A";
            const lng = data.location?.lng || "N/A";

            const div = document.createElement('div');
            div.className = "card";


            div.innerHTML = `
        <div class="card-header">
            <span class="name">${data.name}</span>
            <span class="status ${data.status.toLowerCase()}">${data.status}</span>
        </div>
        <div class="card-body">
            <p>📞 ${data.contact}</p>
            <p>📍 Lat: ${lat}, Lng: ${lng}</p>
        </div>
        <div class="card-actions">
        ${data.status === "Pending"
                    ? `<button onclick="assignAmbulance('${doc.id}', ${lat || 0}, ${lng || 0})">Assign</button>`
                    : ""
                }
        ${data.status !== "Completed"
                    ? `<button onclick="markComplete('${doc.id}')">Complete</button>`
                    : ""
                }
        </div>
        `;

            container.appendChild(div);
        });
    });

// Ambulance List
db.collection("ambulances")
    .onSnapshot(snapshot => {
        const container = document.getElementById('ambulanceList');
        container.innerHTML = "";

        snapshot.forEach(doc => {
            const data = doc.data();
            const div = document.createElement('div');
            const name = data.driverName || "No Name";

            div.innerHTML = `
        <div class="card">
        <div class="card-header">
        <span>Driver: ${name}</span>
        <span class="${data.status === "Available" ? "status available" : "status busy"}">
        ${data.status}
        </span>
        </div>
        </div>
        `;
            container.appendChild(div);
        });
    });

// FIX: typo "collectin" -> "collection", aur "amublanceId" -> "ambulanceId"
async function markComplete(emergencyId) {
    const emergencyRef = db.collection("emergencies").doc(emergencyId); // FIX: "collectin" -> "collection"
    const snap = await emergencyRef.get();

    if (!snap.exists) return;

    const data = snap.data();
    const ambulanceId = data.ambulanceId; // FIX: "amublanceId" -> "ambulanceId"

    await emergencyRef.update({
        status: "Completed"
    });

    if (ambulanceId) {
        await db.collection("ambulances").doc(ambulanceId).update({
            status: "Available"
        });
    }
    if (currentRoute) {
        map.removeControl(currentRoute);
        currentRoute = null;
    }
    alert("Emergency Completed & Ambulance Freed!");

}

function getDistance(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

async function assignAmbulance(emergencyId, lat, lng) {
    const snapshot = await db.collection("ambulances").get();

    let nearest = null;
    let minDistance = Infinity;

    snapshot.forEach(doc => {
        const amb = doc.data();
        const ambLat = amb.location?.lat || 0;
        const ambLng = amb.location?.lng || 0;

        if (amb.status === "Available" && amb.location) {
            const dist = getDistance(lat, lng, ambLat, ambLng);
            if (dist < minDistance) {
                minDistance = dist;
                nearest = { id: doc.id, ...amb };
            }
        }

    });

    if (!nearest) {
        alert("No Ambulance Available");
        return;
    }

    await db.collection("ambulances").doc(nearest.id).update({
        status: "Busy"
    });

    await db.collection("emergencies").doc(emergencyId).update({
        status: "Assigned",
        ambulanceId: nearest.id
    });
    showRoute(
        nearest.location.lat,
        nearest.location.lng,
        lat,
        lng
    )
    map.setView([lat,lng], 14);
    alert("Ambulance Assigned!");
}

// Map
let map = L.map('map').setView([28.6319, 77.2090], 12);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

let ambulanceMarkers = {};
let emergencyMarkers = {};

db.collection("ambulances")
    .onSnapshot(snapshot => {
        snapshot.forEach(doc => {
            const data = doc.data();
            const lat = data.location?.lat;
            const lng = data.location?.lng;

            if (!lat || !lng) return;

            if (ambulanceMarkers[doc.id]) {
                ambulanceMarkers[doc.id].setLatLng([lat, lng]);
            } else {
                const marker = L.marker([lat, lng])
                    .addTo(map)
                    .bindPopup(`
                    🚑 ${data.driverName}<br>
                    Status: ${data.status}
                    
                    `);
                ambulanceMarkers[doc.id] = marker;
            }
        });
    });

db.collection("emergencies")
    .onSnapshot(snapshot => {
        snapshot.forEach(doc => {
            const data = doc.data();
            const lat = data.location?.lat;
            const lng = data.location?.lng;

            if (!lat || !lng) return;

            if (emergencyMarkers[doc.id]) {
                emergencyMarkers[doc.id].setLatLng([lat, lng]);
            } else {
                const marker = L.marker([lat, lng], {
                    icon: L.icon({
                        iconUrl: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
                        iconSize: [32, 32]
                    })
                })
                    .addTo(map)
                    .bindPopup(`🚨 ${data.name}`);
                emergencyMarkers[doc.id] = marker;
            }
        });
    });
function showRoute(ambLat, ambLng, patientLat, patientLng) {
    if (currentRoute) {
        map.removeControl(currentRoute);
    }

    currentRoute = L.Routing.control({
        createMarker: () => null,
        waypoints: [
            L.latLng(ambLat, ambLng),
            L.latLng(patientLat, patientLng)
        ],
        routeWhileDragging: false,
        draggableWaypoints: false,
        addWaypoints: false,
        show: false
    }).addTo(map);
}