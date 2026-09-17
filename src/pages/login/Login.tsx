import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { faGoogle } from '@fortawesome/free-brands-svg-icons';
import { useAuth } from '../../hooks/useAuth';
import LanguageSwitcher from '../../components/LanguageSwitcher';
import Button from '../../components/ui/Button';
import loginBackground from '../../assets/login-background.jpeg';
import './Login.scss';

// Login con foto del palco fusa nello sfondo (variante 1b del redesign)
const LoginPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user, loading, signInWithGoogle } = useAuth();
  const { t } = useTranslation();

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await signInWithGoogle();
      navigate('/home');
    } catch (loginError) {
      console.error('Errore durante l\'autenticazione:', loginError);
      setError(t('auth.loginError'));
    } finally {
      setIsLoading(false);
    }
  };

  // Se l'utente è già autenticato, non ha senso mostrare il login
  if (!loading && user) {
    return <Navigate to="/home" replace />;
  }

  return (
    <div className="login">
      <img className="lighten login__photo" src={loginBackground} alt="" />
      <div className="login__scrim" />

      <div className="login__content">
        <span className="login__brand">BENTUR</span>
        <LanguageSwitcher className="login__language" />

        <div className="login__hero">
          <div className="bt-kicker login__kicker">
            <span className="login__wide">{t('login.kicker')}</span>
            <span className="login__narrow">{t('login.kickerShort')}</span>
          </div>
          <h1 className="login__wordmark">Ben Tur</h1>
          <p className="login__intro">
            <span className="login__wide">{t('login.intro')}</span>
            <span className="login__narrow">{t('login.introShort')}</span>
          </p>
          <div className="login__actions">
            <Button
              variant="primary"
              icon={faGoogle}
              className="login__google"
              onClick={handleGoogleLogin}
              disabled={isLoading}
            >
              {isLoading ? t('auth.loggingIn') : t('auth.loginWithGoogle')}
            </Button>
          </div>
          {error && <p className="login__error" role="alert">{error}</p>}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
