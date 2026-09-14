import { createContext } from 'react';
import { User } from 'firebase/auth';

export interface AuthContextValue {
  user: User | null;
  // true finché Firebase non ha comunicato il primo stato di autenticazione
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
