const auth = firebase.auth()
const db = firebase.firestore()

//Admin Auth.check
auth.onAuthStateChanged(async (user) => {
    if (!user) {
        window.location.href = "Login.html"
        return;
    }

    const snap = await db.collection("users").doc(user.uid).get();

    const role = snap.data().role.trim();

    if (role !== "admin") {
        alert("Access denied: Not an admin")
        window.location.href = "index.html"
        return;
    }
});

db.collection('emergencies')
.onSnapshot(snapshot => {

    const container = document.getElementById('emergencyList');
    container.innerHTML = "";

    const docs = snapshot.docs.sort((a, b) => {
        return a.data().status === "Pending" ? -1 : 1;
    });

    docs.forEach(doc => {

        const data = doc.data();

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
            <button onclick="assignAmbulance('${doc.id}', ${lat || 0}, ${lng || 0})">Assign</button>
            <button onclick="markComplete('${doc.id}')">Complete</button>
        </div>
        `;

        container.appendChild(div);
    });

});
//Ambulance list
db.collection("ambulances")
    .onSnapshot(snapshot => {
        const container = document.getElementById('ambulanceList');
        container.innerHTML = "";

        snapshot.forEach(doc => {
            const data = doc.data()

            const div = document.createElement('div')
            const name = data.driverName || "No Name"

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

            container.appendChild(div)
        })
    })

    async function markComplete(emergencyId){
        await db.collection("emergencies").doc(emergencyId).update({
            status: "Completed"
        })
    }
    
function getDistance(lat1, lng1, lat2, lng2) {
    const R = 6371 //km
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLng = (lng2 - lng1) * Math.PI / 180

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
}

async function assignAmbulance(emergencyId, lat, lng) {

    const snapshot = await db.collection("ambulances").get();

    let nearest = null;
    let minDistance = Infinity;

    snapshot.forEach(doc => {
        const amb = doc.data()
        const ambLat = amb.location?.lat || 0;
        const ambLng = amb.location?.lng || 0;

        if (amb.status === "Available" && amb.location) {
            const dist = getDistance(
                lat,
                lng,
                ambLat,
                ambLng
            );
            if (dist < minDistance) {
                minDistance = dist;
                nearest = { id: doc.id, ...amb };

            }
        }
    })

    if (!nearest) {
        alert("no Ambulance Available");
        return;
    }

    await db.collection("ambulances").doc(nearest.id).update({
        status: "Busy"
    });

    await db.collection("emergencies").doc(emergencyId).update({
        status: "Assigned",
        ambulanceId: nearest.id
    })
    alert("Ambulance Assinged!")
}

//Map add
let map = L.map('map').setView([28.6319,77.2090],12); 

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
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

        if(!lat || !lng) return;

        if(ambulanceMarkers[doc.id]){
            ambulanceMarkers[doc.id].setLatLng([lat,lng]);
        }else{
            const marker = L.marker([lat,lng])
            .addTo(map)
            .bindPopup(`🚑 ${data.driverName}`);

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

        if(!lat || !lng) return;

        if(emergencyMarkers[doc.id]){
            emergencyMarkers[doc.id].setLatLng([lat,lng]);
        }else{
            const marker = L.marker([lat,lng],{
                icon: L.divIcon({
                    iconUrl: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
                    iconSize: [32,32]
                })
            })
            .addTo(map)
            .bindPopup(`🚨 ${data.name}`)

            emergencyMarkers[doc.id] = marker;
        }
    })
})