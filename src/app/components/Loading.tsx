/**
 * Loading Component - Simple, elegant loading animation.
 * Features a minimalist design with smooth, subtle motion.
 */
'use client';

import React from 'react';
import { Box, Typography, keyframes, alpha } from '@mui/material';

// Smooth rotation for the ring
const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

// Subtle fade for the text
const pulse = keyframes`
  0%, 100% { opacity: 0.4; }
  50% { opacity: 1; }
`;

export default function Loading() {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        width: '100%',
        bgcolor: 'background.default',
        gap: 3,
      }}
    >
      {/* Minimal Spinner */}
      <Box
        sx={{
          position: 'relative',
          width: 48,
          height: 48,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Box
          sx={{
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            border: (theme) => `2px solid ${alpha(theme.palette.primary.main, 0.1)}`,
            borderTopColor: 'primary.main',
            animation: `${spin} 0.8s linear infinite`,
          }}
        />
      </Box>

      {/* Simple Text */}
      <Typography
        variant="body2"
        sx={{
          fontWeight: 500,
          color: 'text.secondary',
          letterSpacing: '0.05em',
          animation: `${pulse} 1.5s ease-in-out infinite`,
        }}
      >
        Loading Expenses...
      </Typography>
    </Box>
  );
}


