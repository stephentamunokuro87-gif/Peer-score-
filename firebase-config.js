// Your Firebase configuration - REPLACE WITH YOUR ACTUAL FIREBASE CONFIG
const firebaseConfig = {
apiKey: "AIzaSyBV8J2hbd2DFiRukPv6yKYLDr0WfkDoyfk",
  authDomain: "my-first-work-d2cee.firebaseapp.com",
  projectId: "my-first-work-d2cee",
  storageBucket: "my-first-work-d2cee.firebasestorage.app",
  messagingSenderId: "547405307840",
  appId: "1:547405307840:web:39604cc40c649e121ef225",
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();