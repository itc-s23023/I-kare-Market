// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getStorage, connectStorageEmulator } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyD6KV0qJzSqqtBMYbaMeSy7wTwSGsEiiTs",
  authDomain: "ec-site-da13b.firebaseapp.com",
  projectId: "ec-site-da13b",
  storageBucket: "ec-site-da13b.appspot.com",
  messagingSenderId: "898771380051",
  appId: "1:898771380051:web:00fbaa73d886964a7ce3a6",
  measurementId: "G-1HQEKEY1GG"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Analytics only in browser environment
let analytics;
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}

const db = getFirestore(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Initialize Storage with proper configuration
const storage = getStorage(app);

// Development環境での追加設定（本番環境では不要）
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
  console.log('Development environment detected');
}

export { app, analytics, db, auth, googleProvider, storage };
