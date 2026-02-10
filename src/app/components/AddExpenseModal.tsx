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
  Grid,
} from '@mui/material';
import { FiX, FiTrendingUp, FiTrendingDown } from 'react-icons/fi';
import { useCurrency } from '../context/CurrencyContext';
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from '../firebase';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialType?: 'in' | 'out';
  currentBalance?: number;
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

export default function AddExpenseModal({ isOpen, onClose, onAddExpense, initialType, currentBalance = 0 }: AddExpenseModalProps) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'in' | 'out'>(initialType ?? 'out');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [remarks, setRemarks] = useState('');
  const [category, setCategory] = useState('Misc');
  const [paymentMode, setPaymentMode] = useState('Online');
  const [availableCategories, setAvailableCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { currency, formatCurrency } = useCurrency();

  // Calculate projected balance after this entry
  const projectedBalance = React.useMemo(() => {
    const amountNum = parseFloat(amount) || 0;
    if (type === 'in') {
      return currentBalance + amountNum;
    } else {
      return currentBalance - amountNum;
    }
  }, [currentBalance, amount, type]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const q = query(collection(db, 'categories'), orderBy('name', 'asc'));
        const querySnapshot = await getDocs(q);
        const categoriesData = querySnapshot.docs.map(doc => doc.data().name as string);

        if (categoriesData.length > 0) {
          setAvailableCategories(categoriesData);
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

    if (isOpen) {
      fetchCategories();
    }
  }, [isOpen, category]);

  useEffect(() => {
    if (isOpen) {
      setType(initialType ?? 'out');
    }
  }, [isOpen, initialType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!description || !amount) {
      setErrorMessage('Please provide a description and amount.');
      return;
    }

    const createdAt = new Date(`${date}T00:00:00`);

    setIsSaving(true);
    try {
      const payload: {
        description: string;
        amount: number;
        type: 'in' | 'out';
        createdAt: Date;
        category: string;
        paymentMode: string;
        remarks?: string;
      } = {
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

      await onAddExpense(payload);
      handleClose();
    } catch (err) {
      console.error('Save failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to save entry. Please try again.';
      setErrorMessage(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setDescription('');
    setAmount('');
    setType('out');
    setDate(new Date().toISOString().slice(0, 10));
    setRemarks('');
    setCategory('Misc');
    setPaymentMode('Online');
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
        sx: {
          borderRadius: 3,
        },
      }}
    >
      <form onSubmit={handleSubmit}>
        <DialogTitle sx={{ p: 3, pb: 0 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Typography variant="h5" fontWeight={600}>
              Add Entry
            </Typography>
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
          {/* Type Toggle */}
          <Box sx={{ mb: 3 }}>
            <ToggleButtonGroup
              value={type}
              exclusive
              onChange={(_, newType) => newType && setType(newType)}
              fullWidth
              sx={{
                gap: 1,
                '& .MuiToggleButtonGroup-grouped': {
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  py: 1.5,
                  '&.Mui-selected': {
                    bgcolor: type === 'in' ? 'success.main' : 'error.main',
                    color: 'white',
                    borderColor: type === 'in' ? 'success.main' : 'error.main',
                    '&:hover': {
                      bgcolor: type === 'in' ? 'success.dark' : 'error.dark',
                    },
                  },
                },
              }}
            >
              <ToggleButton value="in">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <FiTrendingUp size={18} />
                  Cash In
                </Box>
              </ToggleButton>
              <ToggleButton value="out">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <FiTrendingDown size={18} />
                  Cash Out
                </Box>
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

          {/* Balance Display */}
          <Box sx={{ mb: 3, p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Current Balance
              </Typography>
              <Typography
                variant="subtitle1"
                fontWeight={600}
                color={currentBalance >= 0 ? 'success.main' : 'error.main'}
              >
                {formatCurrency(currentBalance)}
              </Typography>
            </Box>
            {amount && parseFloat(amount) > 0 && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Balance after this entry
                </Typography>
                <Typography
                  variant="subtitle1"
                  fontWeight={600}
                  color={projectedBalance >= 0 ? 'success.main' : 'error.main'}
                >
                  {formatCurrency(projectedBalance)}
                </Typography>
              </Box>
            )}
          </Box>

          {/* Description */}
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

          {/* Amount and Date */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid size={{ xs: 7 }}>
              <TextField
                id="entry-amount"
                label={`Amount (${currency})`}
                type="number"
                fullWidth
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
              />
            </Grid>
            <Grid size={{ xs: 5 }}>
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
          </Grid>

          {/* Category and Payment Mode */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid size={{ xs: 6 }}>
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
            <Grid size={{ xs: 6 }}>
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

          {/* Remarks */}
          <TextField
            id="entry-remarks"
            label="Remarks (optional)"
            fullWidth
            multiline
            rows={2}
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Add any additional details..."
            sx={{ mb: 2 }}
          />

          {errorMessage && (
            <Alert severity="error" sx={{ mt: 1 }}>{errorMessage}</Alert>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={handleClose} color="inherit" disabled={isSaving}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            variant="contained" 
            disableElevation 
            disabled={isSaving || !description || !amount}
            color={type === 'in' ? 'success' : 'error'}
          >
            {isSaving ? 'Saving...' : 'Save Entry'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
