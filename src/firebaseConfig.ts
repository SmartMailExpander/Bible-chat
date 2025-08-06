import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBqURpQv0Ib42BEQ_Qvng1_FsrEzr-1OmA",
  authDomain: "chat-app-db7ba.firebaseapp.com",
  projectId: "chat-app-db7ba",
  storageBucket: "chat-app-db7ba.firebasestorage.app",
  messagingSenderId: "861495273544",
  appId: "1:861495273544:web:dca71ac6985f4a7286107d",
  measurementId: "G-XWL54H6E8X"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app); 