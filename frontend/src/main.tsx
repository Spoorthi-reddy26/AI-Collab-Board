(window as any).global = window;
import './index.css'
import App from './App'
import { createRoot } from 'react-dom/client'

// Polyfills for browser
(globalThis as any).global = globalThis;
(globalThis as any).process = {
  env: {},
};

createRoot(document.getElementById("root")!).render(
  <App />
);