import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBTX4367sR797doLzEs5NEWKRjRTwIyU84",
  authDomain: "vertical-phoenix-8tj8l.firebaseapp.com",
  projectId: "vertical-phoenix-8tj8l",
  storageBucket: "vertical-phoenix-8tj8l.firebasestorage.app",
  messagingSenderId: "261541213943",
  appId: "1:261541213943:web:c5f2c3c4ed71686d2e45f2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Services
export const auth = getAuth(app);
export const db = getFirestore(app, "ai-studio-d24a1f2b-fcbc-48ec-8825-20a140c01734");
export const googleProvider = new GoogleAuthProvider();

// Custom Admin Email from Metadata to seed administrator state seamlessly
export const ADMIN_EMAIL = "montserratsarlopez@gmail.com";
