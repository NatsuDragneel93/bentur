import React from 'react';
import './ui.scss';

const LoadingState: React.FC<{ message?: string }> = ({ message = 'Caricamento...' }) => (
  <div className="bt-loading" role="status">{message}</div>
);

export default LoadingState;
