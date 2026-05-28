import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? ""
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

googleProvider.setCustomParameters({
  prompt: "select_account"
});

export const loginWithGoogle = async () => {
  try {
    console.log("[Firebase] Initiating Popup...");
    const result = await signInWithPopup(auth, googleProvider);
    console.log("[Firebase] Auth Successful:", result.user.email);
    return result.user;
  } catch (error: any) {
    console.error("[Firebase] CRITICAL AUTH ERROR:");
    console.error("Code:", error.code);
    console.error("Message:", error.message);
    throw error;
  }
};

export const logout = () => signOut(auth);

export default app;
