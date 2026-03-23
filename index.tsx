import './index.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import { AppLanguageProvider } from './contexts/AppLanguageContext';
import { initCapacitor } from './utils/capacitorInit';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

void initCapacitor();

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <AppLanguageProvider>
        <App />
      </AppLanguageProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
