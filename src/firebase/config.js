// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyD3PZFjppdvpc65UF1JsnS1gf4oUQoKBw4",
    authDomain: "sponsor-trail.firebaseapp.com",
    projectId: "sponsor-trail",
    storageBucket: "sponsor-trail.appspot.com",
    messagingSenderId: "939217999818",
    appId: "1:939217999818:web:65370dad789f42dd646133",
    measurementId: "G-0FQTX0C0FT"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);