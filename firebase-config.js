import { initializeApp } from "https://www.gstatic.com/firebasejs/10.5.0/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.5.0/firebase-database.js";

// Gantikan dengan konfigurasi Firebase anda
const firebaseConfig = {
  apiKey: "AIzaSyBo3XUE50eWFE9-Azop41J808GD_ovh81I",
  authDomain: "laka-trail-run-2026.firebaseapp.com",
  databaseURL: "https://laka-trail-run-2026-default-rtdb.firebaseio.com",
  projectId: "laka-trail-run-2026",
  storageBucket: "laka-trail-run-2026.firebasestorage.app",
  messagingSenderId: "691422515370",
  appId: "1:691422515370:web:3f0507585e51e77cacc0d3"
};
const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
