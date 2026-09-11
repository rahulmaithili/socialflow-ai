import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import AppLayout from './components/layout/AppLayout';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import MediaPage from './pages/MediaPage';
import CreatePage from './pages/CreatePage';
import PagesPage from './pages/PagesPage';

import CalendarPage from './pages/CalendarPage';
import QueuePage from './pages/QueuePage';
import PublishedPage from './pages/PublishedPage';
import FailedPage from './pages/FailedPage';
import GroupsPage from './pages/GroupsPage';

import CampaignsPage from './pages/CampaignsPage';
import TrendsPage from './pages/TrendsPage';
import AIStudioPage from './pages/AIStudioPage';
import AnalyticsPage from './pages/AnalyticsPage';
import HistoryPage from './pages/HistoryPage';
import SettingsPage from './pages/SettingsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            
            <Route path="/" element={<AppLayout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="create" element={<CreatePage />} />
              <Route path="media" element={<MediaPage />} />
              <Route path="ai-studio" element={<AIStudioPage />} />
              <Route path="calendar" element={<CalendarPage />} />
              <Route path="queue" element={<QueuePage />} />
              <Route path="published" element={<PublishedPage />} />
              <Route path="failed" element={<FailedPage />} />
              <Route path="pages" element={<PagesPage />} />
              <Route path="groups" element={<GroupsPage />} />
              <Route path="campaigns" element={<CampaignsPage />} />
              <Route path="trends" element={<TrendsPage />} />
              <Route path="analytics" element={<AnalyticsPage />} />
              <Route path="history" element={<HistoryPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>
            
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
