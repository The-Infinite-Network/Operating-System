import { initializeApp } from "firebase/app";
import {
  Auth,
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? ""
};

export function isCompleteFirebaseConfig(config: typeof firebaseConfig) {
  return Object.values(config).every((value) => value.trim().length > 0);
}

const app = isCompleteFirebaseConfig(firebaseConfig) ? initializeApp(firebaseConfig) : null;
export const auth: Auth | null = app ? getAuth(app) : null;
export const googleProvider = auth ? new GoogleAuthProvider() : null;

googleProvider?.setCustomParameters({
  prompt: "select_account",
});

export const loginWithGoogle = async () => {
  if (!auth || !googleProvider) {
    throw new Error("Firebase auth is not configured for this environment.");
  }

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

export const logout = () => (auth ? signOut(auth) : Promise.resolve());

export default app;
