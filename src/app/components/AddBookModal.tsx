/**
 * AddBookModal Component - Modal dialog for creating new expense books.
 * 
 * This component provides a simple form for creating new expense books.
 * Books are used to organize expenses by category, project, or time period.
 * 
 * @component
 * @module AddBookModal
 * 
 * @example
 * <AddBookModal
 *   isOpen={isModalOpen}
 *   onClose={() => setIsModalOpen(false)}
 *   onAddBook={handleAddBook}
 * />
 */
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
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import { FiX, FiBook, FiUser, FiList } from 'react-icons/fi';

/**
 * Props for AddBookModal component
 * @interface AddBookModalProps
 * @property {boolean} isOpen - Whether the modal is visible
 * @property {() => void} onClose - Callback when modal should close
 * @property {(bookName: string, type: 'personal' | 'ledger') => void} onAddBook - Callback with new book name and type
 */
interface AddBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddBook: (bookName: string, type: 'personal' | 'ledger') => void;
}

/**
 * Modal dialog for creating new expense books.
 * Displays a form with name input and style selection.
 * 
 * @param {AddBookModalProps} props - Component props
 * @returns {JSX.Element} Modal dialog component
 */
export default function AddBookModal({ isOpen, onClose, onAddBook }: AddBookModalProps) {
  // Form state
  const [bookName, setBookName] = useState('');
  const [type, setType] = useState<'personal' | 'ledger'>('personal');
  const [error, setError] = useState<string | null>(null);

  /**
   * Handles form submission.
   * Validates the book name and calls the onAddBook callback.
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookName.trim()) {
      setError('Please enter a book name');
      return;
    }
    onAddBook(bookName.trim(), type);
    setBookName('');
    setType('personal');
    setError(null);
  };

  /**
   * Resets form state and closes the modal.
   */
  const handleClose = () => {
    setBookName('');
    setType('personal');
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
                  Create Additional Book
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
            placeholder="e.g., Vacation, Project, Business"
            error={!!error}
            helperText={error}
            sx={{
              mb: 3,
              '& .MuiOutlinedInput-root': {
                bgcolor: 'background.paper',
              },
            }}
          />
          
          <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600 }}>
            Tracking Style
          </Typography>
          <ToggleButtonGroup
            value={type}
            exclusive
            onChange={(_, newType) => newType && setType(newType)}
            fullWidth
            size="small"
            sx={{ mb: 2 }}
          >
            <ToggleButton value="personal" sx={{ py: 1.5, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              <FiUser size={18} />
              <Typography variant="caption" sx={{ fontWeight: 600, textTransform: 'none' }}>Personal</Typography>
            </ToggleButton>
            <ToggleButton value="ledger" sx={{ py: 1.5, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              <FiList size={18} />
              <Typography variant="caption" sx={{ fontWeight: 600, textTransform: 'none' }}>Ledger</Typography>
            </ToggleButton>
          </ToggleButtonGroup>

          <Typography variant="body2" color="text.secondary">
            {type === 'personal' 
              ? 'Optimized for daily expenses with category tracking (like your main tracker).'
              : 'Classic ledger style for business or detailed balance tracking.'}
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
