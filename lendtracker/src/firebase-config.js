import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyDz_QI6nJANl-kcGtPuYGf-nghnFblGmWM",
  authDomain: "lendtracker.firebaseapp.com",
  databaseURL: "https://lendtracker-default-rtdb.firebaseio.com",
  projectId: "lendtracker",
  storageBucket: "lendtracker.firebasestorage.app",
  messagingSenderId: "753123847162",
  appId: "1:753123847162:web:12f070c5b3cb847e435243",
  measurementId: "G-SD7F8V6SHL",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);

// const userRef = ref(db, "Users");

// get(userRef)
//   .then((snapshot) => {
//     if (snapshot.exists()) {
//       const userData = snapshot.val();
//       console.log(userData);
//       copyObjectToClipboard(userData);
//     } else {
//       console.log("No data found at this path");
//     }
//   })
//   .catch((error) => {
//     console.error("Error reading data:", error);
//   });

// async function copyObjectToClipboard(obj) {
//   try {
//     const objectAsString = JSON.stringify(obj, null, 2);
//     await clipboard.write(objectAsString); // ✅ Works in Node.js
//     console.log("Object copied to clipboard successfully!");
//   } catch (err) {
//     console.error("Failed to copy object to clipboard:", err);
//   }
// }
