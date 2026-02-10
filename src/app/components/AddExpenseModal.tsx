'use client';

import React, { useState, useEffect } from 'react';
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
  Alert,
  ToggleButton, 
  ToggleButtonGroup,
  MenuItem,
  Grid
} from '@mui/material';
import { FiX } from 'react-icons/fi';
import { useCurrency } from '../context/CurrencyContext';
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from '../firebase';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialType?: 'in' | 'out';
  onAddExpense: (expense: {
    description: string;
    amount: number;
    type: 'in' | 'out';
    createdAt: Date;
    remarks?: string;
    category?: string;
    paymentMode?: string;
    attachments?: string[];
  }) => void;
}

const DEFAULT_CATEGORIES = ['Misc', 'Food', 'Medical', 'Travel'];

const AddExpenseModal: React.FC<AddExpenseModalProps> = ({ isOpen, onClose, onAddExpense, initialType }) => {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'in' | 'out'>(initialType ?? 'out');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState(() => new Date().toISOString().slice(11,16));
  const [remarks, setRemarks] = useState('');
  const [category, setCategory] = useState('Misc');
  const [paymentMode, setPaymentMode] = useState('Online');
  const [attachments, setAttachments] = useState<FileList | null>(null);
  const [availableCategories, setAvailableCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { currency } = useCurrency();

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
    }
  }, [isOpen]);

  // Ensure the selected type matches the initialType when the modal opens
  useEffect(() => {
    if (isOpen) {
      setType(initialType ?? 'out');
    }
  }, [isOpen, initialType]);

  const fetchCategories = async () => {
    try {
      const q = query(collection(db, 'categories'), orderBy('name', 'asc'));
      const querySnapshot = await getDocs(q);
      const categoriesData = querySnapshot.docs.map(doc => doc.data().name as string);
      
      if (categoriesData.length > 0) {
        setAvailableCategories(categoriesData);
        // If current category is not in the new list, reset it
        if (!categoriesData.includes(category)) {
          setCategory(categoriesData[0]);
        }
      } else {
        setAvailableCategories(DEFAULT_CATEGORIES);
      }
    } catch (err) {
      console.error("Error fetching categories:", err);
      setAvailableCategories(DEFAULT_CATEGORIES);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!description || !amount) {
      setErrorMessage('Please provide a description and amount.');
      return;
    }

    const createdAt = new Date(`${date}T${time}`);

    setIsSaving(true);
    try {
      const payload: any = {
        description,
        amount: parseFloat(amount),
        type,
        createdAt,
        category,
        paymentMode,
      };

      if (remarks && remarks.trim() !== '') {
        payload.remarks = remarks.trim();
      }

      if (attachments && attachments.length > 0) {
        payload.attachments = Array.from(attachments).map((f) => f.name);
      }

      console.debug('Prepared payload for save:', payload);

      await onAddExpense(payload);

      // close on success
      handleClose();
    } catch (err: any) {
      console.error('Save failed:', err);
      setErrorMessage(err?.message || 'Failed to save entry. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setDescription('');
    setAmount('');
    setType('out');
    setDate(new Date().toISOString().slice(0, 10));
    setTime(new Date().toISOString().slice(11,16));
    setRemarks('');
    setCategory('Misc');
    setPaymentMode('Online');
    setAttachments(null);
    setErrorMessage(null);
    onClose();
  };

  return (
    <Dialog 
      open={isOpen} 
      onClose={handleClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: { borderRadius: '28px' }
      }}
    >
      <DialogTitle sx={{ m: 0, p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" component="div" fontWeight="500">
          Add Entry
        </Typography>
        <IconButton onClick={handleClose} size="large" sx={{ color: 'text.secondary' }}>
          <FiX />
        </IconButton>
      </DialogTitle>
      
      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ p: 3, pt: 0 }}>
          <Box sx={{ mb: 3 }}>
            <ToggleButtonGroup
              value={type}
              exclusive
              onChange={(_, newType) => newType && setType(newType)}
              fullWidth
              sx={{
                '& .MuiToggleButton-root': {
                  borderRadius: '100px',
                  py: 1.5,
                  px: 3,
                  border: '1px solid',
                  borderColor: 'divider',
                  '&.Mui-selected': {
                    backgroundColor: type === 'in' ? 'primary.container' : 'error.container',
                    color: type === 'in' ? 'on-primary-container' : 'on-error-container',
                    border: 'none',
                    '&:hover': {
                      backgroundColor: type === 'in' ? 'primary.container' : 'error.container',
                      opacity: 0.9,
                    }
                  }
                }
              }}
            >
              <ToggleButton value="in" sx={{ mr: 1 }}>Cash In</ToggleButton>
              <ToggleButton value="out" sx={{ ml: 1 }}>Cash Out</ToggleButton>
            </ToggleButtonGroup>
          </Box>

          <TextField
            id="entry-description"
            label="Description"
            fullWidth
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g., Groceries, Rent, Salary"
            sx={{ mb: 3 }}
          />

          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid size={6}>
              <TextField
                id="entry-date"
                label="Date"
                type="date"
                fullWidth
                value={date}
                onChange={(e) => setDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid size={6}>
              <TextField
                id="entry-time"
                label="Time"
                type="time"
                fullWidth
                value={time}
                onChange={(e) => setTime(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>

          {errorMessage && (
            <Box sx={{ mb: 2 }}>
              <Alert severity="error">{errorMessage}</Alert>
            </Box>
          )}

          <TextField
            id="entry-amount"
            label={`Amount (${currency})`}
            type="number"
            fullWidth
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={`0.00 ${currency}`}
            sx={{ mb: 3 }}
          />

          <TextField
            id="entry-remarks"
            label="Remarks"
            fullWidth
            multiline
            rows={3}
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="e.g. Enter Details (Name, Bill No, Item Name, Quantity etc)"
            sx={{ mb: 3 }}
          />

          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid size={6}>
              <TextField
                id="entry-category"
                select
                label="Category"
                fullWidth
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {availableCategories.map((cat) => (
                  <MenuItem key={cat} value={cat}>
                    {cat}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={6}>
              <TextField
                id="entry-paymentMode"
                select
                label="Payment Mode"
                fullWidth
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value)}
              >
                <MenuItem value="Online">Online</MenuItem>
                <MenuItem value="Cash">Cash</MenuItem>
                <MenuItem value="Card">Card</MenuItem>
              </TextField>
            </Grid>
          </Grid>

          <Box>
            <label htmlFor="entry-attachments">
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1, px: 1 }}>
                Attach Bills
              </Typography>
            </label>
            <input 
              id="entry-attachments"
              type="file" 
              multiple 
              onChange={(e) => setAttachments(e.target.files)} 
              style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}
            />
            <Typography variant="caption" color="text.secondary">
              Attach up to 4 images or PDF files
            </Typography>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={handleClose} color="inherit" disabled={isSaving}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" color="primary" disableElevation disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default AddExpenseModal;
