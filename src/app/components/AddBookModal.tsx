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
  Typography 
} from '@mui/material';
import { FiX } from 'react-icons/fi';

interface AddBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddBook: (bookName: string) => void;
}

const AddBookModal: React.FC<AddBookModalProps> = ({ isOpen, onClose, onAddBook }) => {
  const [bookName, setBookName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (bookName.trim()) {
      onAddBook(bookName.trim());
      setBookName('');
    }
  };

  const handleClose = () => {
    setBookName('');
    onClose();
  };

  return (
    <Dialog 
      open={isOpen} 
      onClose={handleClose}
      fullWidth
      maxWidth="xs"
      PaperProps={{
        sx: { borderRadius: '28px' }
      }}
    >
      <DialogTitle sx={{ m: 0, p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" component="div" fontWeight="500">
          Create New Book
        </Typography>
        <IconButton onClick={handleClose} size="large" sx={{ color: 'text.secondary' }}>
          <FiX />
        </IconButton>
      </DialogTitle>
      
      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ p: 3, pt: 0 }}>
          <TextField
            autoFocus
            label="Book Name"
            fullWidth
            value={bookName}
            onChange={(e) => setBookName(e.target.value)}
            placeholder="e.g., Groceries, Vacation, etc."
            required
            variant="outlined"
          />
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={handleClose} color="inherit">
            Cancel
          </Button>
          <Button type="submit" variant="contained" color="primary" disableElevation>
            Create Book
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default AddBookModal;
