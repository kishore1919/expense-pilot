'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Switch,
  Select,
  MenuItem,
  FormControl,
  Divider,
  Chip,
  TextField,
  Button,
  Paper,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Alert,
  Grid,
  Skeleton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Tabs,
  Tab,
} from '@mui/material';
import {
  FiUser,
  FiMail,
  FiMoon,
  FiBell,
  FiShield,
  FiGlobe,
  FiTrash2,
  FiTag,
  FiChevronLeft,
  FiChevronRight,
  FiEdit2,
  FiCheck,
  FiX,
} from 'react-icons/fi';
import { collection, getDocs, addDoc, deleteDoc, doc, query, where } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { useCurrencyStore, useThemeStore } from '../stores';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useUserProfile } from '@/app/hooks/useUserProfile';

const CORE_CATEGORIES = ['Food', 'Travel', 'Medical', 'Shopping', 'Bills', 'Misc'];

// Skeleton loader
const SettingSkeleton = () => (
  <Card>
    <CardContent sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <Skeleton variant="circular" width={24} height={24} />
        <Skeleton variant="text" width="40%" height={28} />
      </Box>
      <Skeleton variant="text" width="100%" height={20} />
      <Skeleton variant="text" width="80%" height={20} />
    </CardContent>
  </Card>
);

const CategoryManager: React.FC = () => {
  const [user] = useAuthState(auth);
  const [categories, setCategories] = useState<Array<{ id: string; name: string; createdAt?: Date }>>([]);
  const [newCategory, setNewCategory] = useState('');
  const [loadingCats, setLoadingCats] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteCatTarget, setDeleteCatTarget] = useState<string | null>(null);
  const [isDeletingCat, setIsDeletingCat] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 5;

  const refreshCategories = useCallback(async () => {
    if (!user) return;
    try {
      setLoadingCats(true);
      const q = query(
        collection(db, 'categories'),
        where('userId', '==', user.uid)
      );
      const querySnapshot = await getDocs(q);
      const cats = querySnapshot.docs
        .map(d => {
          const data = d.data();
          return { 
            id: d.id, 
            name: data.name,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : (data.createdAt ? new Date(data.createdAt) : undefined)
          };
        })
        .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
      
      setCategories(cats);
      setError(null);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError('Failed to load categories.');
    } finally {
      setLoadingCats(false);
    }
  }, [user]);

  useEffect(() => {
    refreshCategories();
    
    // Listen for category updates from other components
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'categories-updated') {
        refreshCategories();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('categories-updated', refreshCategories);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('categories-updated', refreshCategories);
    };
  }, [refreshCategories]);

  const handleAddCategory = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newCategory.trim() || !user) return;

    const name = newCategory.trim();
    if (CORE_CATEGORIES.some(c => c.toLowerCase() === name.toLowerCase()) || categories.some(c => c.name.toLowerCase() === name.toLowerCase())) {
      setError('This category already exists.');
      return;
    }

    try {
      const createdAt = new Date();
      const docRef = await addDoc(collection(db, 'categories'), {
        name: name,
        userId: user.uid,
        createdAt: createdAt
      });
      setCategories((prev) => [{ id: docRef.id, name: name, createdAt }, ...prev]);
      setNewCategory('');
      setPage(1);
      setError(null);
      
      // Notify other components that categories have been updated
      localStorage.setItem('categories-updated', Date.now().toString());
      window.dispatchEvent(new Event('categories-updated'));
    } catch (err) {
      console.error('Error adding category:', err);
      setError('Failed to add category.');
    }
  };

  const handleDeleteCategory = (id: string) => {
    // Open the confirmation dialog
    setDeleteCatTarget(id);
  };

  const handleConfirmDeleteCategory = async () => {
    if (!deleteCatTarget) return;
    setIsDeletingCat(true);
    try {
      await deleteDoc(doc(db, 'categories', deleteCatTarget));
      setCategories((prev) => prev.filter(c => c.id !== deleteCatTarget));
      setError(null);
    } catch (err) {
      console.error('Error deleting category:', err);
      const msg = err instanceof Error ? err.message : String(err);
      setError(`Failed to delete category: ${msg}`);
    } finally {
      setIsDeletingCat(false);
      setDeleteCatTarget(null);
    }
  };

  // Combine and filter categories
  const filteredCategories = React.useMemo(() => {
    const result = categories;

    return result.sort((a, b) => {
      const dateA = a.createdAt?.getTime() || 0;
      const dateB = b.createdAt?.getTime() || 0;
      if (dateA !== dateB) return dateB - dateA;
      return a.name.localeCompare(b.name);
    });
  }, [categories]);

  // Pagination logic
  const totalFiltered = filteredCategories.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
  const displayedCategories = filteredCategories.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    setPage(1);
  }, [categories]);

  // Adjust page when categories / filtered count changes so we don't stay on an empty page
  useEffect(() => {
    const filteredCount = filteredCategories.length;
    if (filteredCount > 0 && filteredCount <= (page - 1) * pageSize) {
      setPage(p => Math.max(1, p - 1));
    }
  }, [filteredCategories, pageSize, page]);

  return (
    <Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      
      <Box 
        component="form" 
        onSubmit={handleAddCategory} 
        sx={{ display: 'flex', gap: 1.5, mb: 3 }}
        onFocus={refreshCategories}
      >
        <TextField
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          size="small"
          placeholder="New category name"
          sx={{
            flex: 1,
            '& .MuiOutlinedInput-root': {
              borderRadius: 8,
              backgroundColor: (theme) => theme.palette.mode === 'dark' ? 'background.default' : undefined,
              '& fieldset': { borderColor: (theme) => theme.palette.mode === 'dark' ? 'divider' : undefined },
              '&:hover fieldset': { borderColor: 'primary.main' },
            },
            '& .MuiInputBase-input::placeholder': { color: (theme) => theme.palette.mode === 'dark' ? 'text.secondary' : undefined }
          }}
        />
        <Button type="submit" variant="contained" disabled={!newCategory.trim()} sx={{ width: 92, borderRadius: 2, bgcolor: (theme) => theme.palette.mode === 'dark' ? 'background.default' : undefined, color: (theme) => theme.palette.mode === 'dark' ? 'text.secondary' : undefined, border: (theme) => theme.palette.mode === 'dark' ? '1px solid' : undefined, borderColor: 'divider' }}>
          Add
        </Button>
      </Box>

      {loadingCats ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} variant="rounded" height={48} />
          ))}
        </Box>
      ) : displayedCategories.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', borderColor: 'divider', borderRadius: 2 }}>
          <Typography color="text.secondary" gutterBottom>
            No custom categories yet.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Add one using the form above or create one while adding an expense.
          </Typography>
          <Button 
            variant="text" 
            onClick={refreshCategories} 
            sx={{ mt: 2 }}
            size="small"
          >
            Refresh
          </Button>
        </Paper>
      ) : (
        <Paper variant="outlined" sx={{ backgroundColor: (theme) => theme.palette.mode === 'dark' ? 'background.default' : undefined, borderColor: (theme) => theme.palette.mode === 'dark' ? 'divider' : undefined, borderRadius: 2, overflow: 'hidden' }}>
          <List disablePadding>
            {displayedCategories.map((c, index) => (
              <React.Fragment key={c.id}>
                {index > 0 && <Divider sx={{ borderColor: (theme) => theme.palette.mode === 'dark' ? 'divider' : undefined }} />}
                <ListItem
                  secondaryAction={
                    <IconButton 
                      edge="end" 
                      onClick={() => handleDeleteCategory(c.id)}
                      sx={{
                        color: 'text.secondary',
                        '&:hover': {
                          color: 'error.main',
                          bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(239,68,68,0.08)' : 'error.bg',
                        },
                      }}
                    >
                      <FiTrash2 size={18} />
                    </IconButton>
                  }
                  sx={{
                    py: 1.5,
                    px: 2,
                    display: 'flex',
                    alignItems: 'center',
                    backgroundColor: (theme) => theme.palette.mode === 'dark' ? 'background.default' : undefined,
                  }}
                >
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      bgcolor: 'primary.main',
                      mr: 2,
                      flexShrink: 0,
                    }}
                  />
                  <ListItemText 
                    primary={c.name}
                    primaryTypographyProps={{ fontWeight: 500 }}
                  />
                </ListItem>
              </React.Fragment>
            ))}
          </List>
        </Paper>
      )}

      {/* Pagination Controls */}
      {!loadingCats && totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2, px: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Showing {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, totalFiltered)} of {totalFiltered}
          </Typography>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <IconButton 
              size="small" 
              disabled={page === 1} 
              onClick={() => setPage(p => p - 1)}
            >
              <FiChevronLeft size={18} />
            </IconButton>
            <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', px: 1 }}>{page} / {totalPages}</Typography>
            <IconButton 
              size="small" 
              disabled={page === totalPages} 
              onClick={() => setPage(p => p + 1)}
            >
              <FiChevronRight size={18} />
            </IconButton>
          </Box>
        </Box>
      )}

      <Dialog
        open={deleteCatTarget !== null}
        onClose={() => !isDeletingCat && setDeleteCatTarget(null)}
      >
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this category? This cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteCatTarget(null)} disabled={isDeletingCat}>Cancel</Button>
          <Button onClick={handleConfirmDeleteCategory} color="error" autoFocus disabled={isDeletingCat}>
            {isDeletingCat ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default function SettingsPage() {
  const [user] = useAuthState(auth);
  const { profile, loading: profileLoading, updateUsername, checkUsernameAvailable } = useUserProfile();
  const [editingUsername, setEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [usernameSaving, setUsernameSaving] = useState(false);
  
  // Initialize notifications lazily from storage to avoid setState-in-effect/hydration issues.
  const [notifications, setNotifications] = useState<boolean>(() => {
    try {
      if (typeof window === 'undefined') return true;
      const savedNotifications = localStorage.getItem('pet_notifications');
      return savedNotifications !== null ? savedNotifications === 'true' : true;
    } catch {
      return true;
    }
  });
  const [loading, setLoading] = useState(true);
  const { currency, setCurrency, currencyOptions } = useCurrencyStore();
  const { isDarkMode, toggleDarkMode } = useThemeStore();

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const toggleNotifications = () => {
    setNotifications((prev) => {
      const next = !prev;
      try { localStorage.setItem('pet_notifications', String(next)); } catch {}
      return next;
    });
  };

  const handleStartEditUsername = () => {
    setNewUsername(profile?.username || '');
    setEditingUsername(true);
    setUsernameError(null);
  };

  const handleCancelEditUsername = () => {
    setEditingUsername(false);
    setNewUsername('');
    setUsernameError(null);
  };

  const handleSaveUsername = async () => {
    const trimmedUsername = newUsername.trim().toLowerCase();
    if (trimmedUsername.length < 3) {
      setUsernameError('Username must be at least 3 characters');
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(trimmedUsername)) {
      setUsernameError('Username can only contain letters, numbers, and underscores');
      return;
    }

    if (trimmedUsername !== profile?.username) {
      const available = await checkUsernameAvailable(trimmedUsername);
      if (!available) {
        setUsernameError('This username is already taken');
        return;
      }
    }

    try {
      setUsernameSaving(true);
      await updateUsername(trimmedUsername);
      setEditingUsername(false);
      setUsernameError(null);
    } catch (err) {
      setUsernameError('Failed to update username');
    } finally {
      setUsernameSaving(false);
    }
  };

  const settingsItems = [
    {
      icon: <FiUser size={20} />,
      label: 'Username',
      value: profileLoading ? (
        <Skeleton width={100} />
      ) : editingUsername ? (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TextField
            value={newUsername}
            onChange={(e) => {
              setNewUsername(e.target.value);
              setUsernameError(null);
            }}
            size="small"
            error={!!usernameError}
            helperText={usernameError}
            sx={{ width: 150 }}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSaveUsername();
              if (e.key === 'Escape') handleCancelEditUsername();
            }}
          />
          <IconButton size="small" onClick={handleSaveUsername} disabled={usernameSaving} color="success">
            <FiCheck size={16} />
          </IconButton>
          <IconButton size="small" onClick={handleCancelEditUsername} disabled={usernameSaving} color="error">
            <FiX size={16} />
          </IconButton>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography fontWeight={500}>{profile?.username || 'Set username'}</Typography>
          <IconButton size="small" onClick={handleStartEditUsername}>
            <FiEdit2 size={14} />
          </IconButton>
        </Box>
      ),
    },
    {
      icon: <FiMail size={20} />,
      label: 'Email',
      value: user?.email || 'N/A',
    },
    {
      icon: <FiShield size={20} />,
      label: 'Account Status',
      value: <Chip label="Active" color="success" size="small" />,
    },
    {
      icon: <FiUser size={20} />,
      label: 'User ID',
      value: <Typography variant="body2" color="text.secondary" sx={{ wordBreak: 'break-all' }}>{user?.uid || 'N/A'}</Typography>,
    },
  ];

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={600} gutterBottom>
          Settings
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage your account and preferences.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Account Information */}
        <Grid size={{ xs: 12, md: 6 }}>
          {loading ? (
            <SettingSkeleton />
          ) : (
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                  <Box sx={{ color: 'primary.main' }}>
                    <FiUser size={24} />
                  </Box>
                  <Typography variant="h5" fontWeight={600}>
                    Account Information
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                  {settingsItems.map((item, index) => (
                    <React.Fragment key={item.label}>
                      {index > 0 && <Divider sx={{ my: 2 }} />}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Box sx={{ color: 'text.secondary' }}>{item.icon}</Box>
                          <Typography color="text.secondary">{item.label}</Typography>
                        </Box>
                        <Box>
                          {typeof item.value === 'string' ? (
                            <Typography fontWeight={500}>{item.value}</Typography>
                          ) : (
                            item.value
                          )}
                        </Box>
                      </Box>
                    </React.Fragment>
                  ))}
                </Box>
              </CardContent>
            </Card>
          )}
        </Grid>

        {/* Preferences */}
        <Grid size={{ xs: 12, md: 6 }}>
          {loading ? (
            <SettingSkeleton />
          ) : (
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                  <Box sx={{ color: 'primary.main' }}>
                    <FiBell size={24} />
                  </Box>
                  <Typography variant="h5" fontWeight={600}>
                    Preferences
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {/* Notifications */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box sx={{ color: 'text.secondary' }}><FiBell size={20} /></Box>
                      <Box>
                        <Typography fontWeight={500}>Notifications</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Receive updates about your expenses
                        </Typography>
                      </Box>
                    </Box>
                    <Switch checked={notifications} onChange={toggleNotifications} color="primary" />
                  </Box>

                  <Divider />

                  {/* Dark Mode */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box sx={{ color: 'text.secondary' }}><FiMoon size={20} /></Box>
                      <Box>
                        <Typography fontWeight={500}>Dark Mode</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Switch between light and dark themes
                        </Typography>
                      </Box>
                    </Box>
                    <Switch checked={isDarkMode} onChange={toggleDarkMode} color="primary" />
                  </Box>

                  <Divider />

                  {/* Currency */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box sx={{ color: 'text.secondary' }}><FiGlobe size={20} /></Box>
                      <Box>
                        <Typography fontWeight={500}>Currency</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Used globally across all totals
                        </Typography>
                      </Box>
                    </Box>
                    <FormControl sx={{ minWidth: 120 }}>
                      <Select
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value as string)}
                        size="small"
                      >
                        {currencyOptions.map((option) => (
                          <MenuItem key={option.code} value={option.code}>
                            {option.code}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          )}
        </Grid>

        {/* Categories */}
        <Grid size={{ xs: 12 }}>
          {loading ? (
            <SettingSkeleton />
          ) : (
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                  <Box sx={{ color: 'primary.main' }}>
                    <FiTag size={24} />
                  </Box>
                  <Typography variant="h5" fontWeight={600}>
                    Categories
                  </Typography>
                </Box>
                <CategoryManager />
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>

      {/* Footer */}
      <Box sx={{ mt: 6, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Personal Expense Tracker v0.1.0
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
          Built with Next.js and Firebase
        </Typography>
      </Box>
    </Box>
  );
}
