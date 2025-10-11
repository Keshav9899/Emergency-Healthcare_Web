function showform(formId) {
  document.querySelectorAll(".form-box").forEach(form => form.classList.remove("active"));
  document.getElementById(formId).classList.add("active");
}

// Firebase initialization
const firebaseApp = firebase.initializeApp({
  apiKey: "AIzaSyAwl22tT7kJD1U0toxE0WckzOxHAao9Nzg",
  authDomain: "emergency-healthcare-17c29.firebaseapp.com",
  projectId: "emergency-healthcare-17c29",
  storageBucket: "emergency-healthcare-17c29.firebasestorage.app",
  messagingSenderId: "210921508011",
  appId: "1:210921508011:web:8308e17f37863a40727bee"
});
const db = firebaseApp.firestore();
const auth = firebaseApp.auth();

// ✅ Register Function (Authentication + Firestore)
const register = () => {
  const name = document.getElementById("name").value;
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const contact = document.getElementById("contact").value;
  const emergencyContact = document.getElementById("emergencyContact").value;

  auth.createUserWithEmailAndPassword(email, password)
    .then((userCredential) => {
      const user = userCredential.user;
      return db.collection("users").doc(user.uid).set({
        name: name,
        email: email,
        password: password,
        contact: contact,
        emergencyContact: emergencyContact,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    })
    .then(() => {
      alert("Registration successful!");
      window.location.href = "index.html";
    })
    .catch((error) => {
      alert(error.message);
    });
};

// ✅ Login Function
const login = () => {
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;

  auth.signInWithEmailAndPassword(email, password)
    .then(() => {
      alert("Login successful!");
      window.location.href = "index.html";
    })
    .catch((error) => {
      alert(error.message);
    });
};

document.addEventListener('DOMContentLoaded', function () {
  const registerForm = document.getElementById('register-form');
  if (registerForm) {
    registerForm.addEventListener('submit', function (event) {
      event.preventDefault();
      register();
    });
  }
});