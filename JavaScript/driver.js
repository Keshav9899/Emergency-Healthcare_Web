const auth = firebase.auth();
const db = firebase.firestore();

let map;
let driverMarker;
let patientMarker;
let currentRoute;

auth.onAuthStateChanged(async (user) => {

    if (!user) {
        window.location.href = "Login.html";
        return;
    }

    const snap = await db.collection("users")
        .doc(user.uid)
        .get();

    const role = snap.data()?.role?.trim();

    if (role !== "ambulanceDriver") {
        window.location.href = "index.html";
        return;
    }
    await db.collection("ambulances")
.doc(user.uid)
.set({
    userId: user.uid,
    driverName: snap.data().name || "Driver",
    status: "Available"
}, { merge:true });

    document.getElementById("driverName").textContent =
        snap.data().name || "Driver";

    initMap();

    setupButtons(user.uid);

    startTracking(user.uid);

    watchAssignedEmergency(user.uid);
});

function initMap() {

    map = L.map('map').setView([28.6319, 77.2090], 13);

    L.tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        {
            attribution: '© OpenStreetMap'
        }
    ).addTo(map);
}

function setupButtons(driverId) {

    const availableBtn =
        document.getElementById("availableBtn");

    const busyBtn =
        document.getElementById("busyBtn");

    availableBtn.onclick = async () => {

        await db.collection("ambulances")
            .doc(driverId)
            .set({
                status: "Available",
                userId: driverId
            }, { merge: true });

        alert("Status Updated: Available");
    };

    busyBtn.onclick = async () => {

        await db.collection("ambulances")
            .doc(driverId)
            .set({
                status: "Busy",
                userId: driverId
            }, { merge: true });

        alert("Status Updated: Busy");
    };
}

function startTracking(driverId) {

    navigator.geolocation.watchPosition(

        async (pos) => {

            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;

            document.getElementById("status")
                .innerText =
                `📍 ${lat.toFixed(5)}, ${lng.toFixed(5)}`;

            await db.collection("ambulances")
                .doc(driverId)
                .set({
                    userId: driverId,
                    location: { lat, lng }
                }, { merge: true });

            if (driverMarker) {

                driverMarker.setLatLng([lat, lng]);

            } else {

                driverMarker = L.marker([lat, lng])
                    .addTo(map)
                    .bindPopup("🚑 Driver")
                    .openPopup();
            }
            if(!driverMarker)
            {map.setView([lat, lng], 15);}

        },

        (err) => {
            console.error(err);
        },

        {
            enableHighAccuracy: true,
            maximumAge: 10000,
            timeout: 5000
        }
    );
}

function watchAssignedEmergency(driverId) {

    db.collection("emergencies")
        .where("ambulanceId", "==", driverId)
        .where("status", "==", "Assigned")
        .onSnapshot(snapshot => {

            snapshot.forEach(doc => {

                const data = doc.data();

                const patientLat = data.location?.lat;
                const patientLng = data.location?.lng;

                if (
                    patientLat == null ||
                    patientLng == null
                ) return;

                if (patientMarker) {

                    patientMarker.setLatLng([
                        patientLat,
                        patientLng
                    ]);

                } else {

                    patientMarker = L.marker(
                        [patientLat, patientLng],
                        {
                            icon: L.icon({
                                iconUrl:
                                    "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
                                iconSize: [32, 32]
                            })
                        }
                    )
                        .addTo(map)
                        .bindPopup("🚨 Patient");
                }

                if (driverMarker) {

                    const driverPos =
                        driverMarker.getLatLng();

                    showRoute(
                        driverPos.lat,
                        driverPos.lng,
                        patientLat,
                        patientLng
                    );

                    calculateDistance(
                        driverPos.lat,
                        driverPos.lng,
                        patientLat,
                        patientLng
                    );
                }
            });
        });
}

function showRoute(
    ambLat,
    ambLng,
    patientLat,
    patientLng
) {

    if (currentRoute) {
        map.removeControl(currentRoute);
        currentRoute = null;
    }

    currentRoute = L.Routing.control({

        router: L.Routing.osrmv1({
            serviceUrl:
                'https://router.project-osrm.org/route/v1'
        }),

        waypoints: [
            L.latLng(ambLat, ambLng),
            L.latLng(patientLat, patientLng)
        ],

        lineOptions: {
            styles: [
                {
                    color: '#2563eb',
                    weight: 6
                }
            ]
        },

        createMarker: () => null,

        addWaypoints: false,
        draggableWaypoints: false,
        routeWhileDragging: false,
        fitSelectedRoutes: true,
        show: false

    }).addTo(map);
}

function calculateDistance(
    lat1,
    lng1,
    lat2,
    lng2
) {

    const R = 6371;

    const dLat =
        (lat2 - lat1) * Math.PI / 180;

    const dLng =
        (lng2 - lng1) * Math.PI / 180;

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) *
        Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);

    const c =
        2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const distance = R * c;

    document.getElementById("distanceLeft")
        .innerText =
        `${distance.toFixed(2)} KM Remaining`;
}

document.addEventListener("DOMContentLoaded", () => {

    const logoutBtn =
        document.getElementById("driverLogoutBtn");

    logoutBtn.onclick = async () => {

        await auth.signOut();

        window.location.href = "index.html";
    };
});