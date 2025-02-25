import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.scss';

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Logica di autenticazione (da implementare)
    if (username === 'user' && password === 'password') {
      navigate('/home');
    } else {
      alert('Credenziali non valide');
    }
  };

  return (
    <div className='login-page-container'>
      <h1>Ben Tur</h1>
      <div className='login-form-container'>
        <form className='login-form' onSubmit={handleSubmit}>
          <div className='login-form-field'>
            <label>Username</label>
            <input
              className='login-form-field-input'
              type="text"
              value={username}
              placeholder='Username'
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div className='login-form-field'>
            <label>Password</label>
            <input
              className='login-form-field-input'
              type="password"
              value={password}
              placeholder='Password'
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button type="submit">Login</button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;