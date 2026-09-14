import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import './Login.scss';

const LoginPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { user, loading, signInWithGoogle } = useAuth();

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      await signInWithGoogle();
      navigate('/home');
    } catch (error) {
      console.error('Errore durante l\'autenticazione:', error);
      alert('Errore durante il login. Riprova.');
    } finally {
      setIsLoading(false);
    }
  };

  // Se l'utente è già autenticato, non ha senso mostrare il login
  if (!loading && user) {
    return <Navigate to="/home" replace />;
  }

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
