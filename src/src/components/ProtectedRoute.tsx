import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { isAuthenticated } from '../lib/auth';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();

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
