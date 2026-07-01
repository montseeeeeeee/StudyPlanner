import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCWHhO-haykimyNRAOSZDAVZuIOdTSCbeE",
  authDomain: "studyplanner-bb1c2.firebaseapp.com",
  projectId: "studyplanner-bb1c2",
  storageBucket: "studyplanner-bb1c2.firebasestorage.app",
  messagingSenderId: "332382276470",
  appId: "1:332382276470:web:6be9dbf37b7b56aa438857",
  measurementId: "G-F4HPQVWQWH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// Custom Admin Email from Metadata to seed administrator state seamlessly
export const ADMIN_EMAIL = "montserratsarlopez@gmail.com";
