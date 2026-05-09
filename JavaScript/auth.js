function showform(formId) {
  document.querySelectorAll(".form-box").forEach(form => form.classList.remove("active"));
  const target = document.getElementById(formId);
  if (target) target.classList.add("active");
}

const auth = firebase.auth();
const db = firebase.firestore();

const googleProvider = new firebase.auth.GoogleAuthProvider();

//Google Login

const googleLogin = async () => {
  try {
    const result = await auth.signInWithPopup(googleProvider);
    const user = result.user;

    const userRef = db.collection("users").doc(user.uid);
    const snap = await userRef.get();

    let data;
    if (!snap.exists) {
      data = {
        name: user.displayName || " ",
        email: user.email,
        contact: "",
        emergencyContact: "",
        medicalHistory: "",
        allergies: "",
        role: "patient",
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        provider: "google",
        profileComplete: false
      };
      await userRef.set(data)
    } else {
      data = snap.data()
    }

    // Role-based redirect for Google login
    const role = data.role;
    if (role === "admin") {
      window.location.href = "admin.html";
    } else if (role === "ambulanceDriver") {
      window.location.href = "driver.html";
    } else if (!data.contact) {
      window.location.href = "complete_profile.html";
    } else {
      window.location.href = "index.html";
    }
  }
  catch (error) {
    alert(error.message);
  }
}

document.getElementById("googleSignInRegister")?.addEventListener("click", googleLogin);
document.getElementById("googleSignInLogin")?.addEventListener("click", googleLogin);

// Register (Auth + Firestore)

const register = () => {
  const name = document.getElementById("name")?.value || "";
  const email = document.getElementById("email")?.value || "";
  const password = document.getElementById("password")?.value || "";
  const contact = document.getElementById("contact")?.value || "";
  const emergencyContact = document.getElementById("emergencyContact")?.value || "";
  const role = document.getElementById("role")?.value || "patient";

 auth.createUserWithEmailAndPassword(email, password)
  .then((userCredential) => {
    const user = userCredential.user;
    return db.collection("users").doc(user.uid).set({
      name, email, contact, emergencyContact, role,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    })
    .then(() => user);
  })
  .then(async (user) => {
    alert("Registration successful!");
    if (role === "admin") {
      window.location.href = "admin.html";
    } else if (role === "ambulanceDriver") {
      await db.collection('ambulances').doc(user.uid).set({
        driverName: name,
        contact: contact,
        location: { lat: 0, lng: 0 },
        status: "Available",
        userId: user.uid
      });
      window.location.href = "driver.html";
    } else {
      window.location.href = "index.html";
    }
  })
  .catch((error) => {
    alert(error.message);
  });
}

// Login

const login = async () => {
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;
  try {
    const userCredential = await auth.signInWithEmailAndPassword(email, password);
    const user = userCredential.user;
    const snap = await db.collection("users").doc(user.uid).get();
    const role = snap.data().role;
    if (role === "ambulanceDriver") {
      window.location.href = "driver.html";
    } else if (role === "admin") {
      window.location.href = "admin.html";
    } else {
      window.location.href = "index.html";
    }
  } catch (error) {
    alert(error.message);
  }
};

// Form submit handlers

document.addEventListener("DOMContentLoaded", () => {

  const registerForm = document.getElementById("registerForm");
  if (registerForm) {
    registerForm.addEventListener("submit", (e) => {
      e.preventDefault();
      register();
    })
  }

  const loginForm = document.getElementById("login-form");
  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      login();
    })
  }

  auth.onAuthStateChanged(async (user) => {

    const dropdownName = document.getElementById("dropdownName");
    const dropdownEmail = document.getElementById("dropdownEmail");
    const dropdownPhone = document.getElementById('dropdownPhone');
    const dropdownEmergency = document.getElementById('dropdownEmergency');
    const avatarCircle = document.getElementById("avatarCircle");
    const profileWrapper = document.getElementById("profileWrapper");
    const loginLinks = document.getElementById("loginLinks");
    const logoutBtn = document.getElementById("logoutBtn");
    const dropdownMenu = document.getElementById("dropdownMenu");

    if (!user) {
      if (profileWrapper) profileWrapper.style.display = "none";
      if (loginLinks) loginLinks.style.display = "block";
      return;
    }

    try {
      const snap = await db.collection("users").doc(user.uid).get();
      const data = snap.exists ? snap.data() : {};
      const role = data.role || "";

      // FIX: Role-based redirect - admin/driver ko index.html pe nahi rehne dena
      const currentPage = window.location.pathname;
      const isIndexPage = currentPage.includes("index") || currentPage.endsWith("/") || currentPage.endsWith(".html") && !currentPage.includes("admin") && !currentPage.includes("driver") && !currentPage.includes("Login") && !currentPage.includes("Register");

      if (role === "admin" && isIndexPage) {
        window.location.href = "admin.html";
        return;
      }
      if (role === "ambulanceDriver" && isIndexPage) {
        window.location.href = "driver.html";
        return;
      }

      if (dropdownName) dropdownName.textContent = data.name || user.displayName || "User";
      if (dropdownEmail) dropdownEmail.textContent = data.email || user.email || "";
      if (dropdownPhone) dropdownPhone.textContent = "phone: " + (data.contact || "Not added");
      if (dropdownEmergency) dropdownEmergency.textContent = "Emergency: " + (data.emergencyContact || "N/A");

      if (avatarCircle) {
        avatarCircle.src = user.photoURL ||
          "https://ui-avatars.com/api/?name=" + encodeURIComponent(data.name || user.email || "User");
      }

      if (profileWrapper) profileWrapper.style.display = "block";
      if (loginLinks) loginLinks.style.display = "none";

      if (logoutBtn) {
        logoutBtn.onclick = async () => {
          await auth.signOut();
          window.location.href = "index.html";
        };
      }

      if (avatarCircle && dropdownMenu) {
        avatarCircle.addEventListener("click", (e) => {
          e.stopPropagation();
          dropdownMenu.classList.toggle("show");
        });
        document.addEventListener("click", (e) => {
          if (profileWrapper && !profileWrapper.contains(e.target)) {
            dropdownMenu.classList.remove("show");
          }
        });
      }

    } catch (error) {
      console.error(error);
    }
  });
});

// Password toggle

document.addEventListener("click", (e) => {
  if (!e.target.classList.contains("toggle-password")) return;
  const inputId = e.target.dataset.target;
  const input = document.getElementById(inputId);
  if (!input) return;
  if (input.type === "password") {
    input.type = "text";
    e.target.textContent = "Visibility_off";
  } else {
    input.type = "password";
    e.target.textContent = "Visibility";
  }
})