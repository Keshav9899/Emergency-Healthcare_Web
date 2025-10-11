function showform(formId) {
  document.querySelectorAll(".form-box").forEach(form => form.classList.remove("active"));
  document.getElementById(formId).classList.add("active");
}

// Firebase initialization
const firebaseConfig = {
  apiKey: "AIzaSyAwl22tT7kJD1U0toxE0WckzOxHAao9Nzg",
  authDomain: "emergency-healthcare-17c29.firebaseapp.com",
  projectId: "emergency-healthcare-17c29",
  storageBucket: "emergency-healthcare-17c29.firebasestorage.app",
  messagingSenderId: "210921508011",
  appId: "1:210921508011:web:8308e17f37863a40727bee"
};

const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Register function

const register = () => {
  // Get values from input fields

  const name = document.querySelector('input[name="Name"]').value;
  const email = document.querySelector('input[name="Email"]').value;
  const password = document.querySelector('input[name="Password"]').value;
  const contact = document.querySelectorAll('input[name="contact"]')[0].value;
  const emergencyContact = document.querySelectorAll('input[name="contact"]')[1].value;

auth.createUserWithEmailAndPassword(email, password)
.then((userCredential)=>{
const user = userCredential.user;

//store data in firestore database
return db.collection("users").add({
    name: name,
    email: email,
    password: password, // ⚠️ only for testing; don’t store plain passwords in real apps
    contact: contact,
    emergencyContact: emergencyContact,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });

})
  .then(() => {
    alert("User registered successfully!");
    window.location.href = "Login.html";
  })
  .catch((error) => {
    alert("Error adding user: " + error.message);
  });
};

// Login function

const login = () => {
  const email = document.getElementById("LoginEmail").value;
  const password = document.getElementById("LoginPassword").value;

  auth.signInWithEmailAndPassword(email, password)
    .then(() => {
      alert("You are logged in successfully!");
      window.location.href = "index.html";
    })
    .catch((error) => {
      alert(error.message);
    });
};
