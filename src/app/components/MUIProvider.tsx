'use client';

import React, { useMemo } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { useTheme as useAppTheme } from '../context/ThemeContext';

export default function MUIProvider({ children }: { children: React.ReactNode }) {
  const { isDarkMode } = useAppTheme();

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: isDarkMode ? 'dark' : 'light',
          primary: {
            main: isDarkMode ? '#53dbc9' : '#006a60',
            contrastText: isDarkMode ? '#003732' : '#ffffff',
          },
          secondary: {
            main: isDarkMode ? '#b1ccc6' : '#4a635f',
            contrastText: isDarkMode ? '#1c3531' : '#ffffff',
          },
          error: {
            main: isDarkMode ? '#ffb4ab' : '#ba1a1a',
          },
          background: {
            default: isDarkMode ? '#191c1b' : '#fafdfa',
            paper: isDarkMode ? '#1d201f' : '#eaefee',
          },
          text: {
            primary: isDarkMode ? '#e0e3e1' : '#191c1b',
            secondary: isDarkMode ? '#bec9c6' : '#3f4947',
          },
        },
        shape: {
          borderRadius: 16,
        },
        typography: {
          fontFamily: 'var(--font-body), system-ui, sans-serif',
          h1: { fontFamily: 'var(--font-heading), sans-serif' },
          h2: { fontFamily: 'var(--font-heading), sans-serif' },
          h3: { fontFamily: 'var(--font-heading), sans-serif' },
          h4: { fontFamily: 'var(--font-heading), sans-serif' },
          h5: { fontFamily: 'var(--font-heading), sans-serif' },
          h6: { fontFamily: 'var(--font-heading), sans-serif' },
        },
        components: {
          MuiButton: {
            styleOverrides: {
              root: {
                borderRadius: 100,
                textTransform: 'none',
                fontWeight: 500,
                padding: '10px 24px',
                transition: 'all 0.3s cubic-bezier(0.3, 0.0, 0.8, 0.15)',
              },
              containedPrimary: {
                '&:hover': {
                  boxShadow: '0 4px 12px rgba(0, 106, 96, 0.2)',
                },
              },
            },
          },
          MuiDialog: {
            styleOverrides: {
              paper: {
                borderRadius: 28,
                padding: 16,
                backgroundImage: 'none',
              },
            },
          },
          MuiCard: {
            styleOverrides: {
              root: {
                borderRadius: 24,
                boxShadow: 'none',
                border: '1px solid transparent',
              },
            },
          },
        },
      }),
    [isDarkMode]
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
