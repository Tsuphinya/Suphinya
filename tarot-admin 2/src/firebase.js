import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// -----------------------------------------------------------------------
// Replace these values with your own project's config.
// Firebase console → Project settings → General → "Your apps" → SDK setup
// -----------------------------------------------------------------------
const firebaseConfig = {
 apiKey: "AIzaSyDYkJixxIWAaEHw8yyEIJ-00eCmbZBS4yI",
  authDomain: "fortune-tellingapp.firebaseapp.com",
  projectId: "fortune-tellingapp",
  storageBucket: "fortune-tellingapp.firebasestorage.app",
  messagingSenderId: "996514681026",
  appId: "1:996514681026:web:d945f094625cbf99ef6b5b",
  measurementId: "G-V8RFZ9MVG7"
};
 
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

// Firestore collection name used throughout the app
// 🌟 แก้ไข: ต้องตรงกับ collection ที่แอปมือถือ (Fortune-TellingApp) ใช้จริง
// แอปมือถืออ่านข้อมูลไพ่จาก collection(db, 'card') — ไม่ใช่ 'tarotCards'
export const CARDS_COLLECTION = "card";
