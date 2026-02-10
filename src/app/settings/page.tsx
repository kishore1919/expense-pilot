'use client';

import React, { useState } from 'react';
import { FiUser, FiMail, FiMoon, FiBell, FiShield, FiGlobe, FiTrash2 } from 'react-icons/fi';
import { Typography, Box, Switch, Select, MenuItem, FormControl, InputLabel, Divider, Chip, TextField, Button, Paper, List, ListItem, ListItemText, IconButton, CircularProgress, Alert } from '@mui/material';
import { collection, getDocs, addDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import Card from '../components/Card';
import { useCurrency } from '../context/CurrencyContext';
import { useTheme } from '../context/ThemeContext';

const CategoryManager: React.FC = () => {
  const [categories, setCategories] = React.useState<Array<{ id: string; name: string }>>([]);
  const [newCategory, setNewCategory] = React.useState('');
  const [loadingCats, setLoadingCats] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCats(true);
        const q = query(collection(db, 'categories'), orderBy('name', 'asc'));
        const querySnapshot = await getDocs(q);
        const cats = querySnapshot.docs.map(d => ({ id: d.id, name: d.data().name }));
        setCategories(cats);
        setError(null);
      } catch (err) {
        console.error('Error fetching categories:', err);
        setError('Failed to load categories.');
      } finally {
        setLoadingCats(false);
      }
    };

    fetchCategories();
  }, []);

  const handleAddCategory = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newCategory.trim()) return;

    try {
      const docRef = await addDoc(collection(db, 'categories'), { name: newCategory.trim() });
      setCategories((prev) => [...prev, { id: docRef.id, name: newCategory.trim() }].sort((a,b)=>a.name.localeCompare(b.name)));
      setNewCategory('');
    } catch (err) {
      console.error('Error adding category:', err);
      setError('Failed to add category.');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    try {
      await deleteDoc(doc(db, 'categories', id));
      setCategories((prev) => prev.filter(c => c.id !== id));
    } catch (err) {
      console.error('Error deleting category:', err);
      setError('Failed to delete category.');
    }
  };

  return (
    <div>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <form onSubmit={handleAddCategory} style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <TextField value={newCategory} onChange={(e) => setNewCategory(e.target.value)} size="small" label="New category name" sx={{ flex: 1 }} />
        <Button type="submit" variant="contained">Add</Button>
      </form>

      {loadingCats ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}><CircularProgress size={24} /></Box>
      ) : (
        <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
          {categories.length === 0 ? (
            <ListItem><ListItemText secondary="No categories yet." /></ListItem>
          ) : (
            <List>
              {categories.map((c) => (
                <ListItem key={c.id} secondaryAction={<IconButton edge="end" onClick={() => handleDeleteCategory(c.id)}><FiTrash2 /></IconButton>}>
                  <ListItemText primary={c.name} />
                </ListItem>
              ))}
            </List>
          )}
        </Paper>
      )}
    </div>
  );
};

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

        <Card className="p-7">
          <Typography variant="h5" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2, fontWeight: 500 }}>
            Categories
          </Typography>

          <CategoryManager />
        </Card>
      </div>
    </div>
  );
};

export default SettingsPage;
