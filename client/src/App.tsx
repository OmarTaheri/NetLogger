import { Routes, Route } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import LinksPage from './pages/LinksPage';
import LinkDetailPage from './pages/LinkDetailPage';
import VisitorsPage from './pages/VisitorsPage';
import DomainsPage from './pages/DomainsPage';
import SettingsPage from './pages/SettingsPage';
import WebhooksPage from './pages/WebhooksPage';
import NotFoundPage from './pages/NotFoundPage';

export default function App() {
  const { user, loading, login, logout } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-hud-bg">
        <div className="animate-spin h-8 w-8 border-b-2 border-hud-accent" />
      </div>
    );
  }

  if (!user) {
    return <LoginPage onLogin={login} />;
  }

  return (
    <Routes>
      <Route element={<Layout username={user.username} onLogout={logout} />}>
        <Route index element={<DashboardPage />} />
        <Route path="/links" element={<LinksPage />} />
        <Route path="/links/:id" element={<LinkDetailPage />} />
        <Route path="/visitors" element={<VisitorsPage />} />
        <Route path="/domains" element={<DomainsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/webhooks" element={<WebhooksPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
