import { useContext } from 'react';
import { ToastContext } from '../context/toast.context';

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast deve essere usato all\'interno di un ToastProvider');
  }
  return context;
};
