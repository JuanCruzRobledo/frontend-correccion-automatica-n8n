import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';

// Inicializar tema claro por defecto
const savedTheme = localStorage.getItem('theme') || 'light';
document.documentElement.setAttribute('data-theme', savedTheme);

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
