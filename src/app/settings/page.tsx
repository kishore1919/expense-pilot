'use client';

import React, { useState } from 'react';
import { FiUser, FiMail, FiMoon, FiBell, FiShield, FiGlobe } from 'react-icons/fi';
import { Typography, Box, Switch, Select, MenuItem, FormControl, InputLabel, Divider, Chip } from '@mui/material';
import Card from '../components/Card';
import { useCurrency } from '../context/CurrencyContext';
import { useTheme } from '../context/ThemeContext';

const SettingsPage = () => {
  const [notifications, setNotifications] = useState(true);
  const { currency, setCurrency, currencyOptions } = useCurrency();
  const { isDarkMode, toggleDarkMode } = useTheme();

  React.useEffect(() => {
    // Initialize toggles from localStorage after mount to avoid SSR/hydration issues
    try {
      const savedNotifications = localStorage.getItem('pet_notifications');
      if (savedNotifications !== null) setNotifications(savedNotifications === 'true');
    } catch {
      // ignore localStorage errors
    }
  }, []);

  const toggleNotifications = () => {
    setNotifications((prev) => {
      const next = !prev;
      try { localStorage.setItem('pet_notifications', String(next)); } catch {}
      return next;
    });
  };

  return (
    <div className="space-y-8">
      <header className="surface-card p-6 md:p-8">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Manage your account and preferences.</p>
      </header>

      <div className="space-y-8">
        <Card className="p-7">
          <Typography variant="h5" sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2, fontWeight: 500 }}>
            <FiUser color="var(--md-sys-color-primary)" /> Account Information
          </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <FiMail color="var(--md-sys-color-outline)" />
                <Typography color="text.secondary">Email</Typography>
              </Box>
              <Typography fontWeight="500">Anonymous</Typography>
            </Box>
            
            <Divider />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <FiShield color="var(--md-sys-color-outline)" />
                <Typography color="text.secondary">Account Status</Typography>
              </Box>
              <Chip label="Active" color="success" size="small" sx={{ fontWeight: 600 }} />
            </Box>

            <Divider />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <FiUser color="var(--md-sys-color-outline)" />
                <Typography color="text.secondary">User ID</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">Anonymous</Typography>
            </Box>
          </Box>
        </Card>

        <Card className="p-7">
          <Typography variant="h5" sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2, fontWeight: 500 }}>
            <FiBell color="var(--md-sys-color-primary)" /> Preferences
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <FiBell size={24} color="var(--md-sys-color-outline)" />
                <Box>
                  <Typography fontWeight="500">Notifications</Typography>
                  <Typography variant="body2" color="text.secondary">Receive updates about your expenses</Typography>
                </Box>
              </Box>
              <Switch checked={notifications} onChange={toggleNotifications} color="primary" />
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <FiMoon size={24} color="var(--md-sys-color-outline)" />
                <Box>
                  <Typography fontWeight="500">Dark Mode</Typography>
                  <Typography variant="body2" color="text.secondary">Switch between light and dark themes</Typography>
                </Box>
              </Box>
              <Switch checked={isDarkMode} onChange={toggleDarkMode} color="primary" />
            </Box>

            <Divider />

            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' }, gap: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <FiGlobe size={24} color="var(--md-sys-color-outline)" />
                <Box>
                  <Typography fontWeight="500">Currency</Typography>
                  <Typography variant="body2" color="text.secondary">Used globally across all totals and expenses</Typography>
                </Box>
              </Box>
              <FormControl sx={{ minWidth: 200, width: { xs: '100%', md: 'auto' } }}>
                <Select
                  value={currency}
                  onChange={(event) => setCurrency(event.target.value as string)}
                  size="small"
                  sx={{ borderRadius: '12px' }}
                >
                  {currencyOptions.map((option) => (
                    <MenuItem key={option.code} value={option.code}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </Box>
        </Card>

        <Box sx={{ pb: 4, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">Personal Expense Tracker v0.1.0</Typography>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>Built with Next.js and Firebase</Typography>
        </Box>
      </div>
    </div>
  );
};

export default SettingsPage;
