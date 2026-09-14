import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged, signInWithPopup } from 'firebase/auth';
import { useFirebase } from '../../context/firebase.context';
import './Login.scss';

const LoginPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const firebase = useFirebase();

  // Se l'utente è già autenticato, non ha senso mostrare il login
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebase.auth, (currentUser) => {
      if (currentUser) {
        navigate('/home', { replace: true });
      }
    });

    return () => unsubscribe();
  }, [firebase.auth, navigate]);

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      await signInWithPopup(firebase.auth, firebase.provider);
      navigate('/home');
    } catch (error) {
      console.error('Errore durante l\'autenticazione:', error);
      alert('Errore durante il login. Riprova.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='login-page-container'>
      <h1>Ben Tur</h1>
      <div className='login-form-container'>
        <div className='login-google-container'>
          <button
            className='google-login-button'
            onClick={handleGoogleLogin}
            disabled={isLoading}
          >
            {isLoading ? 'Accesso in corso...' : 'Accedi con Google'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
