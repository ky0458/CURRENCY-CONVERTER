
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, FacebookAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// --- THAY THẾ CONFIG BÊN DƯỚI BẰNG CONFIG CỦA BẠN TỪ FIREBASE CONSOLE ---
const firebaseConfig = {
    apiKey: "AIzaSyBs6ovkuJ0xtrkCaaBC4nTNkfsR68ttztA",
    authDomain: "giahanconverter-ggauth.firebaseapp.com",
    projectId: "giahanconverter-ggauth",
    storageBucket: "giahanconverter-ggauth.firebasestorage.app",
    messagingSenderId: "440586917766",
    appId: "1:440586917766:web:d96de99d7161e0141c7e07",
    measurementId: "G-48RTD3T2KH"
};
// --------------------------------------------------------------------------

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
export const facebookProvider = new FacebookAuthProvider();
