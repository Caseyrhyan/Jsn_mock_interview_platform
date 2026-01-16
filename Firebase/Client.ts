// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCHUHHk2BKpbZlrTvgSt1YnUQcS1XcnNIk",
  authDomain: "voca-prep-7f7fe.firebaseapp.com",
  projectId: "voca-prep-7f7fe",
  storageBucket: "voca-prep-7f7fe.firebasestorage.app",
  messagingSenderId: "408923795548",
  appId: "1:408923795548:web:6d11100739d9002973b699",
  measurementId: "G-3TZBQB0J82"
};

// Initialize Firebase
// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
export const auth = getAuth(app);