import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useFirebase } from '../context/firebase.context';
import { onAuthStateChanged, User } from 'firebase/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const firebase = useFirebase();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebase.auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [firebase.auth]);

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '18px' 
      }}>
        Caricamento...
      </div>
    );
  }

  return user ? <>{children}</> : <Navigate to="/" replace />;
};

export default ProtectedRoute;
