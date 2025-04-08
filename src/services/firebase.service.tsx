import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { Firestore, getFirestore } from "firebase/firestore";
import { firebaseConfig } from "../environment/firebaseConfig";

class FirebaseService {
    public auth: any;
    public provider: any
    public database: Firestore | undefined;
    public static instance: any

    constructor() {
        if (!FirebaseService.instance) {
            const app = initializeApp(firebaseConfig);
            this.auth = getAuth(app);
            this.provider = new GoogleAuthProvider();
            this.database = getFirestore(app);
            FirebaseService.instance = this;
        }
        return FirebaseService.instance;
    }
}

const instance = new FirebaseService();
Object.freeze(instance);
export default instance;