/**
 * App.tsx — Root application component.
 * Single route: LogDashboard hosts both log viewer and analytics views.
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store/index';
import { LogDashboard } from './pages/LogDashboard';

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LogDashboard />} />
          {/* Legacy URL — stay in-app, no separate page */}
          <Route path="/dashboard" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </Provider>
  );
};

export default App;
