function showform(formId) {
  document.querySelectorAll(".form-box").forEach(form => form.classList.remove("active"));
  document.getElementById(formId).classList.add("active");
}

// Firebase initialization
const firebaseConfig = {
  apiKey: "AIzaSyAwl22tT7kJD1U0toxE0WckzOxHAao9Nzg",
  authDomain: "emergency-healthcare-17c29.firebaseapp.com",
  projectId: "emergency-healthcare-17c29",
  storageBucket: "emergency-healthcare-17c29.appspot.com",
  messagingSenderId: "210921508011",
  appId: "1:210921508011:web:8308e17f37863a40727bee"
};

const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Register function
const register = () => {
  const name = document.getElementById("Name").value;
  const email = document.getElementById("Email").value;
  const password = document.getElementById("Password").value;
  const contact = document.getElementById("Pcontact").value;
  const emergencyContact = document.getElementById("Econtact").value;

  if (!name || !email || !password || !contact || !emergencyContact) {
    alert("Please fill all fields!");
    return;
  }

  auth.createUserWithEmailAndPassword(email, password)
    .then((result) => {
      const user = result.user;
      return db.collection("users").doc(user.uid).set({
        name: name,
        email: email,
        contact: contact,
        emergencyContact: emergencyContact,
        createdAt: new Date().toISOString()
      });
    })
      .then(()=>{
        alert("You are registered successfully!");
        window.location.href = "login.html";

      })
    .catch((error) => {
      alert(error.message);
    });
};

// Login function
const login = () => {
  const email = document.getElementById("LoginEmail").value;
  const password = document.getElementById("LoginPassword").value;

  if (!email || !password) {
    alert("Please fill all fields!");
    return;
  }

  auth.signInWithEmailAndPassword(email, password)
    .then((result) => {
      alert("You are logged in successfully!");
      window.location.href = "index.html";
    })
    .catch((error) => {
      alert(error.message);
    });
};
