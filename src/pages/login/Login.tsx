import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithPopup, getRedirectResult } from 'firebase/auth';
import { useFirebase } from '../../context/firebase.context';
import './Login.scss';

const LoginPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const firebase = useFirebase();

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      const result = await signInWithPopup(firebase.auth, firebase.provider);
      const user = result.user;
      
      // Console.log del nome dell'utente
      console.log('Utente autenticato:', user.displayName);
      console.log('Email:', user.email);
      console.log('ID utente:', user.uid);
      
      // Naviga alla home page
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