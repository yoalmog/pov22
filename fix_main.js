import fs from 'fs';
let content = fs.readFileSync('src/main.tsx', 'utf8');
content = content.replace("}import {", "}\nimport {");
// I'll just rewrite main.tsx
const unregister = `
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      registration.unregister();
    }
  });
}
`;
fs.writeFileSync('src/main.tsx', `
import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';

${unregister}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
`);
