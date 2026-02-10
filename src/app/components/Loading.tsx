'use client';

import React from 'react';
import { CircularProgress, Box } from '@mui/material';

export default function Loading() {
  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '50vh',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <CircularProgress size={48} thickness={4} />
    </Box>
  );
}
