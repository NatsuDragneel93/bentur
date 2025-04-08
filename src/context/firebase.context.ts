import React, { createContext, useContext } from 'react';
import FirebaseService from '../services/firebase.service';

const FirebaseContext = createContext(FirebaseService);

export const useFirebase = () => {
    return useContext(FirebaseContext);
};

// export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
//     return (
//         <FirebaseContext.Provider value={FirebaseService}>
//             {children}
//         </FirebaseContext.Provider>
//     );
// };