import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/baloo-bhaijaan-2/400.css';
import '@fontsource/baloo-bhaijaan-2/500.css';
import '@fontsource/baloo-bhaijaan-2/600.css';
import '@fontsource/baloo-bhaijaan-2/700.css';
import '@fontsource/baloo-bhaijaan-2/800.css';
import './styles.css';
import './world.css';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
