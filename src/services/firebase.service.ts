import { initializeApp } from "firebase/app";
import { Auth, getAuth, GoogleAuthProvider } from "firebase/auth";
import { Firestore, getFirestore } from "firebase/firestore";
import { firebaseConfig } from "../environment/firebaseConfig";

export interface FirebaseServices {
    auth: Auth;
    provider: GoogleAuthProvider;
    database: Firestore;
}

// I moduli ES vengono valutati una sola volta: l'app Firebase è già un singleton
const app = initializeApp(firebaseConfig);

const provider = new GoogleAuthProvider();
// Mostra sempre la scelta dell'account Google
provider.setCustomParameters({ prompt: 'select_account' });

const firebaseServices: FirebaseServices = Object.freeze({
    auth: getAuth(app),
    provider,
    database: getFirestore(app),
});

export default firebaseServices;
