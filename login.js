// NEW FILE: login.js

// 1. Paste your Firebase configuration here
const firebaseConfig = {
  apiKey: "AIzaSyAMvju-nzd148477cpYTlb-BmPsr9RxEoM",
  authDomain: "tailor-eacde.firebaseapp.com",
  projectId: "tailor-eacde",
  storageBucket: "tailor-eacde.firebasestorage.app",
  messagingSenderId: "1070370733804",
  appId: "1:1070370733804:web:845e93d2ab043e0950efc9"
};

// 2. Initialize Firebase and Authentication service
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

document.getElementById('loginForm').addEventListener('submit', handleLogin);

function handleLogin(e) {
    e.preventDefault();
    
    // NOTE: We use email for Firebase Authentication
    const emailInput = document.getElementById('username').value.trim();
    const passwordInput = document.getElementById('password').value.trim();
    const errorMessage = document.getElementById('errorMessage');

    // Reset error message
    errorMessage.textContent = '';
    errorMessage.style.display = 'none';

    // 3. Call Firebase Authentication API
    auth.signInWithEmailAndPassword(emailInput, passwordInput)
        .then((userCredential) => {
            // Success! Redirect to the main page.
            window.location.href = 'customer.html'; 
        })
        .catch((error) => {
            // Failure! Display Firebase's error message.
            let message = "Login Failed! Please check credentials.";
            if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
                message = "Invalid Email or Password! (صارف ای میل یا پاس ورڈ غلط ہے)";
            }
            
            errorMessage.textContent = message;
            errorMessage.style.display = 'block';
            document.getElementById('password').value = '';
        });
}