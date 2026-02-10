'use client';

import React from 'react';
import { CircularProgress, Box } from '@mui/material';

const Loading = () => {
  return (
    <Box className="flex min-h-[50vh] items-center justify-center">
      <CircularProgress 
        size={48} 
        thickness={4} 
        sx={{ 
          color: 'primary.main',
          animationDuration: '1.4s',
        }} 
      />
    </Box>
  );
};

export default Loading;
