// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
// Temporarily removed StrictMode to prevent double rendering in development
root.render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);