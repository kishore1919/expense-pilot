/**
 * ProtectedLayout Component - Layout wrapper for route protection.
 * Handles authentication state and renders appropriate layout:
 * - Loading state while checking auth
 * - Sidebar + main content for authenticated users
 * - Centered content for auth pages (login)
 */
'use client';

import { usePathname } from 'next/navigation';
import { Box } from '@mui/material';
import { useSidebarStore } from '@/app/stores';
import { useProtectedRoute } from '@/app/hooks/useAuth';
import Loading from './Loading';
import Sidebar from './Sidebar';
import { ErrorBoundary } from './ErrorBoundary';
import { ServiceWorkerRegistration } from './ServiceWorkerRegistration';
import SearchModal from './SearchModal';
import { useState, useEffect } from 'react';

interface ProtectedLayoutProps {
  children: React.ReactNode;
}

export function ProtectedLayout({ children }: ProtectedLayoutProps) {
  const pathname = usePathname();
  const isAuthPage = pathname === '/login';
  const isCollapsed = useSidebarStore((state) => state.isCollapsed);
  const sidebarWidth = isCollapsed ? 72 : 260;
  const { loading, isAuthenticated } = useProtectedRoute();
  const [searchOpen, setSearchOpen] = useState(false);

  // Keyboard shortcut for search (Cmd/Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Show loading while checking auth or redirecting
  if (loading || (!isAuthenticated && !isAuthPage)) {
    return <Loading />;
  }

  // Don't render protected layout for auth pages
  if (isAuthPage) {
    return (
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
        }}
      >
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            p: 3,
          }}
        >
          <Box sx={{ width: '100%', maxWidth: '420px', mx: 'auto' }}>
            {children}
          </Box>
        </Box>
      </Box>
    );
  }

  return (
    <>
      <ServiceWorkerRegistration />
      <Sidebar onSearchClick={() => setSearchOpen(true)} />
      <Box
        component="main"
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          ml: { xs: 0, md: `${sidebarWidth}px` },
          transition: 'margin-left 200ms ease',
          pb: { xs: '80px', md: 0 },
        }}
      >
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            justifyContent: 'flex-start',
            alignItems: 'flex-start',
            p: { xs: 2, sm: 3, md: 4 },
          }}
        >
          <ErrorBoundary>
            <Box sx={{ width: '100%', maxWidth: '1200px', mx: 'auto' }}>
              {children}
            </Box>
          </ErrorBoundary>
        </Box>
      </Box>
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
