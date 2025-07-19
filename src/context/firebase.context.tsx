import React, { createContext, useContext } from 'react';
import FirebaseService from '../services/firebase.service';

// Creiamo il contesto con un valore di default null
const FirebaseContext = createContext<typeof FirebaseService | null>(null);

export const useFirebase = () => {
    const context = useContext(FirebaseContext);
    if (!context) {
        throw new Error('useFirebase deve essere usato all\'interno di un FirebaseProvider');
    }
    return context;
};

export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <FirebaseContext.Provider value={FirebaseService}>
            {children}
        </FirebaseContext.Provider>
    );
};