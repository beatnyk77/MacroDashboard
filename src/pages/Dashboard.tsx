import React from 'react';
import { Navigate } from 'react-router-dom';

/**
 * Dashboard component previously served as the marketing landing page.
 * To ensure a pure terminal experience everywhere, this route now redirects to the terminal root.
 * All data components have been migrated to the Terminal view.
 */
export const Dashboard: React.FC = () => {
  return <Navigate to="/" replace />;
};
