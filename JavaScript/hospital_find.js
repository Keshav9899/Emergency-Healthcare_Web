(function () {
  document.addEventListener("DOMContentLoaded", () => {

    const btn = document.getElementById("findHospitals");
    const list = document.getElementById("hList");

    // Safety check
    if (!btn || !list) {
      console.error("Required HTML elements not found.");
      return;
    }

    // Create hospital list item
    function makeItem(h) {
      const li = document.createElement("li");

      li.style.padding = "14px 20px";
      li.style.borderTop = "1px solid #ecf1fb";

      li.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; gap:12px; flex-wrap:wrap;">
          
          <div>
            <div style="font-weight:700;color:#183a75;">
              ${h.name}
            </div>

            <div style="color:#5a6ea8; font-size:.9rem;">
              ${h.address}<br>

              <strong style="color:#183a75;">
                ${h.distance.toFixed(2)} km away
              </strong>
            </div>
          </div>

          <div>
            <a 
              class="btn btn-primary"
              target="_blank"
              href="https://www.google.com/maps/dir/?api=1&destination=${h.lat},${h.lng}"
            >
              Directions
            </a>
          </div>

        </div>
      `;

      return li;
    }

    // Calculate distance using Haversine formula
    function calculateDistance(lat1, lon1, lat2, lon2) {
      const R = 6371;

      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;

      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) *
        Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);

      return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    // Main function
    async function findNearby() {

      if (!navigator.geolocation) {
        alert("Geolocation is not supported by your browser.");
        return;
      }

      list.innerHTML = `
        <li style="padding:20px;">
          Getting your location...
        </li>
      `;

      navigator.geolocation.getCurrentPosition(

        // Success
        async (pos) => {

          const { latitude, longitude } = pos.coords;

          list.innerHTML = `
            <li style="padding:20px;">
              Loading nearby hospitals...
            </li>
          `;

          try {

            // Overpass API Query
            const query = `
              [out:json];
              (
                node["amenity"="hospital"](around:5000, ${latitude}, ${longitude});
                way["amenity"="hospital"](around:5000, ${latitude}, ${longitude});
                relation["amenity"="hospital"](around:5000, ${latitude}, ${longitude});
              );
              out center;
            `;

            const response = await fetch(
              "https://overpass-api.de/api/interpreter",
              {
                method: "POST",
                body: query
              }
            );

            const data = await response.json();

            list.innerHTML = "";

            if (!data.elements || data.elements.length === 0) {
              list.innerHTML = `
                <li style="padding:20px;">
                  No nearby hospitals found.
                </li>
              `;
              return;
            }

            const hospitals = data.elements.map((p) => {

              const lat = p.lat || p.center?.lat;
              const lng = p.lon || p.center?.lon;

              const distance = calculateDistance(
                latitude,
                longitude,
                lat,
                lng
              );

              return {
                name: p.tags?.name || "Unknown Hospital",
                address: p.tags?.["addr:full"] || "Address not available",
                lat,
                lng,
                distance
              };
            });

            // Sort nearest first
            hospitals.sort((a, b) => a.distance - b.distance);

            // Render list
            hospitals.forEach((h) => {
              list.appendChild(makeItem(h));
            });

          } catch (err) {

            console.error(err);

            list.innerHTML = `
              <li style="padding:20px; color:red;">
                Error loading hospitals.
              </li>
            `;
          }
        },

        // Error
        (err) => {

          console.error(err);

          alert(
            "Unable to retrieve your location. Please allow location access."
          );
        },

        // Options
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    }

    // Button click
    btn.addEventListener("click", findNearby);

  });
})();