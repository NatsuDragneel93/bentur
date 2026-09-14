import { useContext } from 'react';
import { User } from 'firebase/auth';
import { AuthContext } from '../context/auth.context';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve essere usato all\'interno di un AuthProvider');
  }
  return context;
};

// Per le pagine sotto ProtectedRoute, dove l'utente è sempre presente
export const useRequiredUser = (): User => {
  const { user } = useAuth();
  if (!user) {
    throw new Error('useRequiredUser deve essere usato solo in pagine protette');
  }
  return user;
};
