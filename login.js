const firebaseConfig = {
    apiKey: "AIzaSyBlRmmCKp8BYCfhXSVO8oapI0MtnTbf5kU",
    authDomain: "skill-craft-79597.firebaseapp.com",
    projectId: "skill-craft-79597",
    storageBucket: "skill-craft-79597.appspot.com",
    messagingSenderId: "916636695046",
    appId: "1:916636695046:web:dd600d39c5ad1af81ea187",
    measurementId: "G-3MM50DH5SY"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

// DOM Elements
const loginForm = document.getElementById('loginForm');
const loginEmail = document.getElementById('loginEmail');
const loginPassword = document.getElementById('loginPassword');
const loginPasswordToggle = document.getElementById('loginPasswordToggle');
const googleSignIn = document.getElementById('googleSignIn');
const forgotPassword = document.getElementById('forgotPassword');
const signUpLink = document.getElementById('signUpLink');
const notification = document.getElementById('notification');
const notificationText = document.getElementById('notificationText');

// Toggle password visibility
loginPasswordToggle.addEventListener('click', function() {
    const type = loginPassword.getAttribute('type') === 'password' ? 'text' : 'password';
    loginPassword.setAttribute('type', type);
    this.innerHTML = type === 'password' ? '<i class="fas fa-eye"></i>' : '<i class="fas fa-eye-slash"></i>';
});

// Show notification
function showNotification(message, isSuccess = true) {
    notification.className = 'notification';
    notification.classList.add(isSuccess ? 'success' : 'error');
    notification.classList.add('show');
    notificationText.textContent = message;
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Handle form submission
loginForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const email = loginEmail.value;
    const password = loginPassword.value;
    
    auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            console.log("User signed in:", userCredential.user);
            // Redirection is handled by auth state listener
        })
        .catch((error) => {
            const errorCode = error.code;
            let errorMessage = 'An error occurred. Please try again.';
            
            switch(errorCode) {
                case 'auth/invalid-email':
                    errorMessage = 'Invalid email address.';
                    break;
                case 'auth/user-disabled':
                    errorMessage = 'This account has been disabled.';
                    break;
                case 'auth/user-not-found':
                    errorMessage = 'No account found with this email.';
                    break;
                case 'auth/wrong-password':
                    errorMessage = 'Incorrect password.';
                    break;
                case 'auth/too-many-requests':
                    errorMessage = 'Too many attempts. Try again later or reset password.';
                    break;
            }
            
            showNotification(errorMessage, false);
        });
});

// Auth state handler (manages redirects and notifications)
auth.onAuthStateChanged((user) => {
    console.log("Auth state changed - user:", user);
    if (user) {
        const userName = user.displayName || user.email.split('@')[0];
        showNotification(`Welcome ${userName}! Redirecting...`, true);
        
        setTimeout(() => {
            window.location.href = 'profile.html';
        }, 2000);
    }
});
