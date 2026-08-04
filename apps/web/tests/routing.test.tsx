import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import App from '../src/App';
import { AuthProvider } from '../src/providers/AuthProvider';
import * as authApi from '../src/api/auth';

vi.mock('../src/api/auth', () => ({
  getMe: vi.fn(),
  getAuthConfig: vi.fn(),
  login: vi.fn(),
  googleSignIn: vi.fn(),
  linkGoogle: vi.fn(),
  completeOnboarding: vi.fn(),
  logout: vi.fn(),
}));

vi.mock('../src/api/publicLinks', () => ({
  getGuestLinkConfig: vi.fn().mockResolvedValue({
    defaultDomain: 'localhost:3000',
    templates: [
      { id: 'redirect', name: 'Signal Redirect', description: 'Redirect preview' },
      { id: 'captcha', name: 'Human Check', description: 'Human check preview' },
    ],
    lockedTemplates: ['Google Drive'],
    limits: { lifetimeHours: 24, maxVisits: 25, customDomains: false, gpsModes: ['optional', 'disabled'] },
  }),
  createGuestLink: vi.fn(),
  getGuestLinkResults: vi.fn(),
}));

vi.mock('../src/api/domains', () => ({
  getDomains: vi.fn().mockResolvedValue([
    { id: 7, domain: 'signals.example.test', isActive: true, createdAt: '2026-08-02T00:00:00.000Z' },
  ]),
}));

vi.mock('../src/api/templates', () => ({
  getTemplatePreview: vi.fn().mockResolvedValue({ html: '<!doctype html><html><body>Template preview</body></html>' }),
}));

const mockedAuth = vi.mocked(authApi);

function LocationProbe() {
  const location = useLocation();
  return <output data-testid="location">{location.pathname}</output>;
}

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider><App /><LocationProbe /></AuthProvider>
    </MemoryRouter>,
  );
}

describe('application route guards', () => {
  beforeEach(() => {
    mockedAuth.getMe.mockRejectedValue(new Error('unauthenticated'));
    mockedAuth.getAuthConfig.mockResolvedValue({ googleEnabled: false, googleClientId: null, demoAccounts: [] });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('renders the public login page without a Google divider when Google is disabled', async () => {
    renderAt('/login');
    expect(await screen.findByRole('heading', { name: 'Welcome back' })).toBeInTheDocument();
    expect(screen.queryByText('or use your credentials')).not.toBeInTheDocument();
    expect(screen.getByTestId('location')).toHaveTextContent('/login');
  });

  it('fills the standard demo account credentials when its card is selected', async () => {
    mockedAuth.getAuthConfig.mockResolvedValue({
      googleEnabled: false,
      googleClientId: null,
      demoAccounts: [{ label: 'Demo User', email: 'user@netlogger.local', password: 'User12345678!', role: 'user' }],
    });

    renderAt('/login');
    await screen.findByRole('heading', { name: 'Welcome back' });
    fireEvent.click(screen.getByRole('button', { name: /Demo User/i }));
    expect(screen.getByLabelText('Email or username')).toHaveValue('user@netlogger.local');
    expect(screen.getByLabelText('Password')).toHaveValue('User12345678!');
  });

  it('uses the same login form when an administrator demo account is selected', async () => {
    mockedAuth.getAuthConfig.mockResolvedValue({
      googleEnabled: false,
      googleClientId: null,
      demoAccounts: [{ label: 'Administrator', email: 'admin@netlogger.local', password: 'Admin123456!', role: 'admin' }],
    });

    renderAt('/login');
    await screen.findByRole('heading', { name: 'Welcome back' });
    fireEvent.click(screen.getByRole('button', { name: /Administrator/i }));
    expect(screen.getByLabelText('Email or username')).toHaveValue('admin@netlogger.local');
    expect(screen.getByLabelText('Password')).toHaveValue('Admin123456!');
    expect(screen.getByTestId('location')).toHaveTextContent('/login');
  });

  it('redirects protected application routes to login', async () => {
    renderAt('/app/visitors');
    expect(await screen.findByRole('heading', { name: 'Welcome back' })).toBeInTheDocument();
    expect(screen.getByTestId('location')).toHaveTextContent('/login');
  });

  it('keeps the quick-link builder public without an account', async () => {
    renderAt('/create');
    expect(await screen.findByRole('heading', { name: 'Template' })).toBeInTheDocument();
    expect(screen.getByText('Guest operator')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Dashboard — account required/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Google Drive — account required/i })).toBeDisabled();
    expect(await screen.findByTitle('Redirect live preview')).toHaveAttribute('sandbox', '');
    expect(screen.getByTestId('location')).toHaveTextContent('/create');
  });

  it('uses the same builder in full mode for a signed-in account', async () => {
    mockedAuth.getMe.mockResolvedValue({
      id: 12,
      email: 'operator@example.test',
      displayName: 'Signal Operator',
      role: 'user',
      onboardingCompleted: true,
      providers: ['password'],
    });

    renderAt('/create');
    expect(await screen.findByRole('heading', { name: 'Template' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Google Drive/i })).toBeInTheDocument();
    expect(screen.getByText('Signal Operator')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Dashboard' })).toBeInTheDocument();
  });

  it('preserves legacy dashboard URLs through the protected /app route', async () => {
    renderAt('/links');
    expect(await screen.findByRole('heading', { name: 'Welcome back' })).toBeInTheDocument();
    expect(screen.getByTestId('location')).toHaveTextContent('/login');
  });

  it('keeps an administrator in the read-only admin portal', async () => {
    mockedAuth.getMe.mockResolvedValue({
      id: 1,
      email: 'admin@netlogger.local',
      displayName: 'Administrator',
      role: 'admin',
      onboardingCompleted: true,
      providers: ['password'],
    });

    renderAt('/app');
    expect(await screen.findByRole('heading', { name: 'Admin overview' })).toBeInTheDocument();
    expect(screen.getByTestId('location')).toHaveTextContent('/admin');
    expect(screen.queryByRole('link', { name: 'User app' })).not.toBeInTheDocument();
  });

  it('logs an administrator out through the unified login route', async () => {
    mockedAuth.getMe.mockResolvedValue({
      id: 1,
      email: 'admin@netlogger.local',
      displayName: 'Administrator',
      role: 'admin',
      onboardingCompleted: true,
      providers: ['password'],
    });
    mockedAuth.logout.mockResolvedValue({ ok: true });

    renderAt('/admin');
    await screen.findByRole('heading', { name: 'Admin overview' });
    fireEvent.click(screen.getByRole('button', { name: 'Logout' }));
    expect(await screen.findByRole('heading', { name: 'Welcome back' })).toBeInTheDocument();
    expect(screen.getByTestId('location')).toHaveTextContent('/login');
  });

  it('sends a new Google account to onboarding before the workspace', async () => {
    mockedAuth.getMe.mockResolvedValue({
      id: 23,
      email: 'new@example.test',
      displayName: 'New Operator',
      role: 'user',
      onboardingCompleted: false,
      providers: ['google'],
    });

    renderAt('/app');
    expect(await screen.findByRole('heading', { name: 'Make it yours' })).toBeInTheDocument();
    expect(screen.getByTestId('location')).toHaveTextContent('/onboarding');
  });
});
