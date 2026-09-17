import React from 'react';
import ReactDOM from 'react-dom/client';
import RootApp from './RootApp';
import { initializeTheme } from '@/hooks/use-appearance';

// Initialize theme preference
initializeTheme();

const rootElement = document.getElementById('root');
if (rootElement) {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
        <React.StrictMode>
            <RootApp />
        </React.StrictMode>
    );
}
