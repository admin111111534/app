// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA3eoSpAcyjKtlF6NH5Kr8Tm2T-q9EO1cg",
  authDomain: "jevrem-e63f3.firebaseapp.com",
  projectId: "jevrem-e63f3",
  storageBucket: "jevrem-e63f3.firebasestorage.app",
  messagingSenderId: "675200371116",
  appId: "1:675200371116:web:8ea8c0e666581a0cdf9209",
  measurementId: "G-V2QJQ3T2SQ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
getAnalytics(app);
export const db = getFirestore(app);