import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";
const firebaseConfig = {
  apiKey: "AIzaSyCPB0IzIKVmWUC51GnQlNTDuJzRW-KFv0s",
  authDomain: "cliniccompass-9cf0c.firebaseapp.com",
  projectId: "cliniccompass-9cf0c",
  storageBucket: "cliniccompass-9cf0c.appspot.com",
  messagingSenderId: "456885719738",
  appId: "1:456885719738:web:d68a9cc7435f1d803ee883",
  measurementId: "G-JDGHDKZQ3Y"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const functions = getFunctions(app);
export { app, db, functions }