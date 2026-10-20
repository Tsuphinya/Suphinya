import { initializeApp } from "firebase/app";

// @ts-ignore — getReactNativePersistence มีอยู่จริงตอน runtime แค่ type definitions ของ TypeScript ยังตามไม่ทัน (known issue ใน Firebase JS SDK)
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
  apiKey: "AIzaSyDYkJixxIWAaEHw8yyEIJ-00eCmbZBS4yI",
  authDomain: "fortune-tellingapp.firebaseapp.com",
  projectId: "fortune-tellingapp",
  storageBucket: "fortune-tellingapp.firebasestorage.app",
  messagingSenderId: "996514681026",
  appId: "1:996514681026:web:88e3f715e565bfbeef6b5b",
  measurementId: "G-ZP9CJFWEFE",
};

const app = initializeApp(firebaseConfig);

const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export const db = getFirestore(app);
export { auth };
export default app;
