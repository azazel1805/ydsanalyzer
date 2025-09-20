// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Adım 1'de aldığın firebaseConfig objesini buraya yapıştır
const firebaseConfig = {
  apiKey: "AIzaSyAJAVIn3skPFRtdZ5ZU61r-M4vv_2h36AE",
  authDomain: "yds-analyzer-app.firebaseapp.com",
  projectId: "yds-analyzer-app",
  storageBucket: "yds-analyzer-app.firebasestorage.app",
  messagingSenderId: "347469498705",
  appId: "1:347469498705:web:a90d928c52a02d12116b70"
};

// Firebase'i başlat
const app = initializeApp(firebaseConfig);

// Diğer bileşenlerde kullanmak için servisleri export et
export const auth = getAuth(app);
export const db = getFirestore(app);
