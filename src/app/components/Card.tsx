import React from 'react';
import { Card as MuiCard, CardContent } from '@mui/material';

interface CardProps {
  children: React.ReactNode;
  sx?: React.ComponentProps<typeof MuiCard>['sx'];
}

export default function Card({ children, sx = {} }: CardProps) {
  return (
    <MuiCard sx={sx}>
      <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
        {children}
      </CardContent>
    </MuiCard>
  );
}
