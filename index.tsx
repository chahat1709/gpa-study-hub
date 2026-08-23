import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './components/App';
import ErrorBoundary from './components/ErrorBoundary';
import './public/index.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Could not find root element to mount to');
}

// Remove loading skeleton once React is ready
const skeleton = document.getElementById('app-skeleton');
if (skeleton) {
  skeleton.style.transition = 'opacity 0.3s ease-out';
  skeleton.style.opacity = '0';
  setTimeout(() => skeleton.remove(), 300);
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
