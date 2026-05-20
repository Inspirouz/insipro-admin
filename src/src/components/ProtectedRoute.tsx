import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { isAuthenticated, setToken } from '../lib/auth';

const DEV_TOKEN = (import.meta as { env?: { VITE_DEV_TOKEN?: string } }).env?.VITE_DEV_TOKEN;

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();

  if (DEV_TOKEN) {
    setToken(DEV_TOKEN);
  }

  useEffect(() => {
    const authenticated = isAuthenticated();
    if (!authenticated && location.pathname !== '/login') {
      navigate('/login');
    }
  }, [location.pathname, navigate]);

  const authenticated = isAuthenticated();
  if (!authenticated && location.pathname !== '/login') {
    return null;
  }

  return <>{children}</>;
}
