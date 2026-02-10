'use client';

import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Box, 
  TextField, 
  Button, 
  List, 
  ListItem, 
  ListItemText, 
  IconButton, 
  Paper,
  Alert,
  CircularProgress
} from '@mui/material';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy } from "firebase/firestore";
import { db } from '../firebase';

interface Category {
  id: string;
  name: string;
}

const AdminPage = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategory, setNewCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'categories'), orderBy('name', 'asc'));
      const querySnapshot = await getDocs(q);
      const categoriesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name
      }));
      setCategories(categoriesData);
    } catch (err) {
      console.error("Error fetching categories:", err);
      setError("Failed to load categories.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory.trim()) return;

    try {
      const docRef = await addDoc(collection(db, 'categories'), {
        name: newCategory.trim()
      });
      setCategories([...categories, { id: docRef.id, name: newCategory.trim() }].sort((a, b) => a.name.localeCompare(b.name)));
      setNewCategory('');
    } catch (err) {
      console.error("Error adding category:", err);
      setError("Failed to add category.");
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;

    try {
      await deleteDoc(doc(db, 'categories', id));
      setCategories(categories.filter(cat => cat.id !== id));
    } catch (err) {
      console.error("Error deleting category:", err);
      setError("Failed to delete category.");
    }
  };

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', py: 4 }}>
      <header className="surface-card p-6 md:p-8 mb-8">
        <Typography variant="h4" className="page-title" sx={{ mb: 1 }}>Admin Dashboard</Typography>
        <Typography variant="body1" className="page-subtitle">Manage categories for your expenses.</Typography>
      </header>

      {error && <Alert severity="error" sx={{ mb: 4, borderRadius: '16px' }}>{error}</Alert>}

      <Paper sx={{ p: 4, borderRadius: '28px', bgcolor: 'surface.container' }}>
        <Typography variant="h6" sx={{ mb: 3, fontWeight: 500 }}>Expense Categories</Typography>
        
        <form onSubmit={handleAddCategory} style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
          <TextField
            fullWidth
            size="small"
            label="New Category Name"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
          />
          <Button 
            type="submit" 
            variant="contained" 
            startIcon={<FiPlus />}
            sx={{ borderRadius: '12px', px: 3 }}
          >
            Add
          </Button>
        </form>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={32} />
          </Box>
        ) : (
          <List sx={{ bgcolor: 'background.paper', borderRadius: '16px', overflow: 'hidden' }}>
            {categories.length === 0 ? (
              <ListItem>
                <ListItemText secondary="No categories found. Add one above." />
              </ListItem>
            ) : (
              categories.map((category) => (
                <ListItem
                  key={category.id}
                  secondaryAction={
                    <IconButton edge="end" aria-label="delete" onClick={() => handleDeleteCategory(category.id)}>
                      <FiTrash2 />
                    </IconButton>
                  }
                  sx={{ borderBottom: '1px solid', borderColor: 'divider' }}
                >
                  <ListItemText primary={category.name} />
                </ListItem>
              ))
            )}
          </List>
        )}
      </Paper>
    </Box>
  );
};

export default AdminPage;