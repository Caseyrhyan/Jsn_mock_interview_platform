
import { initializeApp, getApp, getApps} from "firebase/app";
import { getAuth } from 'firebase/auth';
import {getFirestore} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDezK5qE13U1DKtpGjKimnNtEFi5MZ5dnA",
  authDomain: "vocaprep-94f22.firebaseapp.com",
  projectId: "vocaprep-94f22",
  storageBucket: "vocaprep-94f22.firebasestorage.app",
  messagingSenderId: "741683774021",
  appId: "1:741683774021:web:08287727cd006455b5592c",
  measurementId: "G-D6Z9QNVJWK"

};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app)