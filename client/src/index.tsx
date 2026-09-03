import React from 'react';
import { createRoot } from 'react-dom/client';
import Router from './Router';
import { initGa } from './ga';
import 'normalize.css';

initGa();

const container = document.getElementById('root');
if (container) {
  createRoot(container).render(
    <React.StrictMode>
      <Router />
    </React.StrictMode>
  );
}
