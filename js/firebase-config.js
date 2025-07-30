// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCYIy-cKJBEdqHcF_MdLHjv8FWJgYjkR5w",
    authDomain: "depi-5a814.firebaseapp.com",
    databaseURL: "https://depi-5a814-default-rtdb.firebaseio.com",
    projectId: "depi-5a814",
    storageBucket: "depi-5a814.firebasestorage.app",
    messagingSenderId: "576108269318",
    appId: "1:576108269318:android:63931280c74bcebb455887"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Get a reference to the database service
const database = firebase.database();
