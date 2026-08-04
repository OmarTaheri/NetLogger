import { lazy, Suspense, type ReactNode } from 'react';
import { Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import LinksPage from './pages/LinksPage';
import LinkDetailPage from './pages/LinkDetailPage';
import VisitorsPage from './pages/VisitorsPage';
import DomainsPage from './pages/DomainsPage';
import SettingsPage from './pages/SettingsPage';
import WebhooksPage from './pages/WebhooksPage';
import NotFoundPage from './pages/NotFoundPage';
import PublicCreateLinkPage from './pages/PublicCreateLinkPage';
import GuestResultsPage from './pages/GuestResultsPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminUsersPage from './pages/AdminUsersPage';
import AdminDomainsPage from './pages/AdminDomainsPage';
import AdminLayout from './components/AdminLayout';

const LandingPage = lazy(() => import('./pages/LandingPage'));

function LoadingScreen() {
  return <div className="min-h-screen flex items-center justify-center bg-hud-bg"><div className="animate-spin h-8 w-8 border-b-2 border-hud-accent" /></div>;
}

function Protected({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  return children;
}

function UserOnly({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  if (user.role !== 'user') return <Navigate to="/admin" replace />;
  return children;
}

function PublicOnly({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  return user ? <Navigate to={user.role === 'admin' ? '/admin' : '/app'} replace /> : children;
}

function AdminOnly({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  if (user.role !== 'admin') return <Navigate to="/app" replace />;
  return children;
}

function LegacyLinkRedirect() {
  const { id } = useParams();
  return <Navigate to={`/app/links/${id}`} replace />;
}

export default function App() {
  const { user, logout } = useAuth();
  return (
    <Routes>
      <Route path="/" element={<Suspense fallback={<LoadingScreen />}><LandingPage /></Suspense>} />
      <Route path="/login" element={<PublicOnly><LoginPage /></PublicOnly>} />
      <Route path="/signup" element={<PublicOnly><SignupPage /></PublicOnly>} />
      <Route path="/create" element={<Layout displayName={user?.displayName || 'Guest operator'} onLogout={user ? logout : undefined} guestMode={!user}><PublicCreateLinkPage /></Layout>} />
      <Route path="/create/results/:slug" element={<GuestResultsPage />} />

      <Route path="/app" element={<UserOnly><Layout displayName={user?.displayName || 'Operator'} onLogout={logout} /></UserOnly>}>
        <Route index element={<DashboardPage />} />
        <Route path="links" element={<LinksPage />} />
        <Route path="links/:id" element={<LinkDetailPage />} />
        <Route path="visitors" element={<VisitorsPage />} />
        <Route path="domains" element={<DomainsPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="webhooks" element={<WebhooksPage />} />
      </Route>

      <Route path="/admin" element={<AdminOnly><AdminLayout displayName={user?.displayName || 'Administrator'} onLogout={logout} /></AdminOnly>}>
        <Route index element={<AdminDashboardPage />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="domains" element={<AdminDomainsPage />} />
      </Route>

      <Route path="/dashboard" element={<Navigate to="/app" replace />} />
      <Route path="/links" element={<Navigate to="/app/links" replace />} />
      <Route path="/links/:id" element={<LegacyLinkRedirect />} />
      <Route path="/visitors" element={<Navigate to="/app/visitors" replace />} />
      <Route path="/domains" element={<Navigate to="/app/domains" replace />} />
      <Route path="/webhooks" element={<Navigate to="/app/webhooks" replace />} />
      <Route path="/settings" element={<Navigate to="/app/settings" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
