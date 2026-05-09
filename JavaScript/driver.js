const auth = firebase.auth();
const db = firebase.firestore();

auth.onAuthStateChanged(async (user) => {
    if (!user) {
        window.location.href = 'Login.html';
        return;
    }

    // FIX: Role check - sirf ambulanceDriver hi yahan reh sakta hai
    const snap = await db.collection("users").doc(user.uid).get();
    const role = snap.data()?.role?.trim();

    if (role !== "ambulanceDriver") {
        alert("Access denied: Not a driver");
        window.location.href = "index.html";
        return;
    }

    // Driver name show karo
    const driverNameEl = document.getElementById("driverName");
    if (driverNameEl) {
        driverNameEl.textContent = snap.data().name || "Driver";
    }

    startTracking(user.uid);
});

function startTracking(driverId) {
    if (!navigator.geolocation) {
        alert("Geolocation not supported");
        return;
    }

    navigator.geolocation.watchPosition(async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        try {
            await db.collection('ambulances').doc(driverId).set({
                location: { lat, lng }
            }, { merge: true });
        } catch (e) {
            console.error("Update failed", e);
        }

        const status = document.getElementById('status');
        if (status) {
            status.innerText = `📍 ${lat.toFixed(5)}, ${lng.toFixed(5)}`;
        }
    },
    (err) => {
        console.error(err);
        alert("Location permission denied or unavailable");
    },
    {
        enableHighAccuracy: true,
        maximumAge: 10000,
        timeout: 5000
    });
}

// Logout
document.addEventListener("DOMContentLoaded", () => {
    const logoutBtn = document.getElementById("driverLogoutBtn");
    if (logoutBtn) {
        logoutBtn.onclick = async () => {
            await auth.signOut();
            window.location.href = "index.html";
        };
    }
});