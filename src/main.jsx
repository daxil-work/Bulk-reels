import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <div id="reel-root" className="flex h-full w-full min-h-0">
    <App />
  </div>
);
