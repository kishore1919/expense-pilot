'use client';

import React from 'react';
import {
  Typography,
  Box,
  Card,
  CardContent,
} from '@mui/material';

export default function AdminPage() {
  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', py: 4 }}>
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h4" gutterBottom>
            Admin Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage categories for your expenses.
          </Typography>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 500 }}>
            Expense Categories
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Category management has moved to <strong>Settings</strong>. You can add and delete categories from there.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
