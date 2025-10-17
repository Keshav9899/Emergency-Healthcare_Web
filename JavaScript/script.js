(function () {
  const sosBtn = document.getElementById('sosBtn');
  const sosModal = document.getElementById('sosModal');
  const sosCountdown = document.getElementById('sosCountdown');
  const cancelSosBtn = document.getElementById('cancelSosBtn');
  const sendNowBtn = document.getElementById('sendNowBtn');

  if (!sosBtn || !sosModal) return;

  let timerId = null;
  let remaining = 15;

  function openModal() {
    remaining = 15;
    sosCountdown.textContent = String(remaining);
    sosModal.style.display = 'flex';
    timerId = setInterval(() => {
      remaining -= 1;
      sosCountdown.textContent = String(remaining);
      if (remaining <= 0) {
        clearInterval(timerId);
        triggerSOS();
      }
    }, 1000);
  }

  function closeModal() {
    sosModal.style.display = 'none';
    if (timerId) clearInterval(timerId);
    timerId = null;
  }

  function triggerSOS() {
    closeModal();
    window.location.href = 'tel:102';
  }

  sosBtn.addEventListener('click', (e) => {
    e.preventDefault();
    openModal();
  });

  if (cancelSosBtn) cancelSosBtn.addEventListener('click', closeModal);
  if (sendNowBtn) sendNowBtn.addEventListener('click', triggerSOS);

  sosModal.addEventListener('click', (e) => {
    if (e.target === sosModal) closeModal();
  });
})();

//Report for someone else javascript

(function () {
  const form = document.getElementById('report-form');
  if (!form) return;

  const useMyLocBtn = document.getElementById('useMyLocation');
  const addressInput = document.getElementById('reportAddress');
  const coordHelper = document.getElementById('coordHelper');
  const descInput = document.getElementById('reportDesc');
  const phoneInput = document.getElementById('reportPhone');

  // Try geolocation for convenience
  useMyLocBtn?.addEventListener('click', () => {
    if (!navigator.geolocation) {
      alert('Geolocation not supported.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        coordHelper.textContent = `Coordinates: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
        // Leave address manual; you can reverse‑geocode later server‑side if needed
      },
      (err) => alert('Could not get location: ' + err.message),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  });

  // Submit without login
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const payload = {
      address: addressInput.value.trim(),
      description: descInput.value.trim(),
      phone: phoneInput.value.trim() || null,
      coords: coordHelper.textContent || null,
      source: 'public-report',
      createdAt: Date.now(),
      status: 'new'
    };

    // Optional: write to Firestore if sdk available on page
    if (window.firebase && firebase.apps && firebase.apps.length > 0) {
      try {
        const app = firebase.app();
        const db = app.firestore();
        await db.collection('incidents').add(payload);
        alert('Report logged. Dialing services is available below.');
      } catch (err) {
        alert('Could not log report, but you can still call emergency numbers.');
      }
    } else {
      // If Firebase not loaded on index, just proceed with calling flow
      alert('Ready to notify services.');
    }

    // Offer calls immediately (works on mobile)
    // For desktop, these links may do nothing unless a call app is installed
    document.getElementById('callAmbulance').click();
  });
})();
