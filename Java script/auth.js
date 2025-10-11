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
  const name = document.querySelector('input[name="Name"]').value;
  const email = document.querySelector('input[name="Email"]').value;
  const password = document.querySelector('input[name="Password"]').value;
  const contact = document.querySelector('input[name="contact"]').value;
  const emergencyContact = document.querySelectorAll('input[name="contact"]')[1].value;

  firebase.auth().createUserWithEmailAndPassword(email, password)
    .then((userCredential) => {
      const user = userCredential.user;

      // Store user data in Firestore
      db.collection("users").doc(user.uid).set({
        name: name,
        email: email,
        contact: contact,
        emergencyContact: emergencyContact,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      })
      .then(() => {
        alert("Registration successful!");
        window.location.href = "login.html";
      });
    })
    .catch((error) => {
      alert(error.message);
      console.log(error);
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
