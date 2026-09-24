import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBcf1eysXtdI5vOgI02yd8sCFs3wGWJ90A",
  authDomain: "bticket-burundi.firebaseapp.com",
  databaseURL: "https://bticket-burundi-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "bticket-burundi",
  storageBucket: "bticket-burundi.firebasestorage.app",
  messagingSenderId: "407762427157",
  appId: "1:407762427157:web:13faa01bff95a114575d1c",
  measurementId: "G-TDYXLEYKCD",
};

export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

/**
 * Secondary Firebase app used to create accounts (e.g. scanner agents)
 * without replacing the currently signed-in session.
 */
export function getSecondaryAuth() {
  const existing = getApps().find((a) => a.name === "bticket-secondary");
  return getAuth(existing ?? initializeApp(firebaseConfig, "bticket-secondary"));
}
export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);

/** bTicket platform commission (2%). */
export const COMMISSION_RATE = 0.02;
