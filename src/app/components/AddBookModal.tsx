'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  IconButton,
  Typography,
  Box,
} from '@mui/material';
import { FiX, FiBook } from 'react-icons/fi';

interface AddBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddBook: (bookName: string) => void;
}

export default function AddBookModal({ isOpen, onClose, onAddBook }: AddBookModalProps) {
  const [bookName, setBookName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookName.trim()) {
      setError('Please enter a book name');
      return;
    }
    onAddBook(bookName.trim());
    setBookName('');
    setError(null);
  };

  const handleClose = () => {
    setBookName('');
    setError(null);
    onClose();
  };

  return (
    <Dialog 
      open={isOpen} 
      onClose={handleClose} 
      fullWidth 
      maxWidth="xs"
      PaperProps={{
        sx: {
          borderRadius: 3,
        },
      }}
    >
      <form onSubmit={handleSubmit}>
        <DialogTitle sx={{ p: 3, pb: 0 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 2,
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <FiBook size={20} />
                </Box>
                <Typography variant="h5" fontWeight={600}>
                  Create New Book
                </Typography>
              </Box>
            </Box>
            <IconButton 
              onClick={handleClose} 
              sx={{ 
                color: 'text.secondary',
                mt: -0.5,
                mr: -1,
              }}
            >
              <FiX />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ p: 3, pt: 3 }}>
          <TextField
            autoFocus
            label="Book Name"
            fullWidth
            value={bookName}
            onChange={(e) => {
              setBookName(e.target.value);
              setError(null);
            }}
            placeholder="e.g., Groceries, Vacation, Monthly Budget"
            error={!!error}
            helperText={error}
            sx={{
              '& .MuiOutlinedInput-root': {
                bgcolor: 'background.paper',
              },
            }}
          />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Books help you organize expenses by purpose, project, or time period.
          </Typography>
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={handleClose} color="inherit">
            Cancel
          </Button>
          <Button 
            type="submit" 
            variant="contained" 
            disableElevation
            disabled={!bookName.trim()}
          >
            Create Book
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
