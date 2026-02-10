'use client';

import React, { useState, useEffect } from 'react';
import { 
  FiChevronLeft, 
  FiTrash2, 
  FiPlus, 
  FiMinus, 
  FiSearch, 
  FiUserPlus, 
  FiDownload,
  FiChevronDown,
  FiChevronRight
} from 'react-icons/fi';
import {
  Button,
  IconButton,
  Typography,
  Box,
  Alert,
  Grid,
  Card,
  CardContent,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Paper,
  Skeleton,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Select,
  MenuItem,
  FormControl,
  Divider
} from '@mui/material';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, collection, getDocs, addDoc, deleteDoc, writeBatch, orderBy, query } from "firebase/firestore";
import { db } from '../../../app/firebase'; // Adjust path if needed based on your folder structure
import AddExpenseModal from '../../components/AddExpenseModal'; // Adjust path if needed
import { useCurrency } from '../../context/CurrencyContext'; // Adjust path if needed

interface Expense {
  id: string;
  description: string;
  amount: number;
  type?: 'in' | 'out';
  createdAt?: Date;
  remarks?: string;
  category?: string;
  paymentMode?: string;
  attachments?: string[];
}

// Helper to format date and time separately
const formatDate = (date?: Date) => {
  if (!date) return { date: '-', time: '' };
  return {
    date: date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
    time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  };
};

export default function BookDetailPage() {
  const router = useRouter();
  const { bookId } = useParams();
  const [bookName, setBookName] = useState('');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalInitialType, setModalInitialType] = useState<'in' | 'out' | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<string | string[] | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { formatCurrency } = useCurrency(); // Ensure you have this context or remove and use simple formatter

  useEffect(() => {
    const fetchBookDetails = async () => {
      if (!bookId || typeof bookId !== 'string') return;

      try {
        setLoading(true);
        const bookRef = doc(db, 'books', bookId);
        const bookSnap = await getDoc(bookRef);

        if (bookSnap.exists()) {
          setBookName(bookSnap.data().name);
        } else {
          setBookName('Expense Book');
        }

        // Fetch expenses ordered by date
        const q = query(collection(db, `books/${bookId}/expenses`), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        
        const expensesData = querySnapshot.docs.map((d) => {
          const data = d.data();
          const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : new Date();
          return {
            id: d.id,
            description: data.description || '--',
            amount: data.amount || 0,
            type: data.type || 'out',
            createdAt,
            remarks: data.remarks || '',
            category: data.category || 'General',
            paymentMode: data.paymentMode || 'Online',
            attachments: data.attachments || [],
          } as Expense;
        });

        setExpenses(expensesData);
      } catch (e) {
        console.error("Error loading data:", e);
        setError('Failed to load book data.');
      } finally {
        setLoading(false);
      }
    };

    fetchBookDetails();
  }, [bookId]);

  const handleAddExpense = async (expense: any) => {
    if (!bookId || typeof bookId !== 'string') return;
    try {
      const docRef = await addDoc(collection(db, `books/${bookId}/expenses`), {
        ...expense,
        createdAt: new Date() // Ensure server timestamp in real app
      });
      // Naive update for immediate UI feedback
      setExpenses([{ id: docRef.id, ...expense, createdAt: new Date() }, ...expenses]);
      setIsModalOpen(false);
    } catch (e) {
      console.error("Error adding:", e);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget || !bookId || typeof bookId !== 'string') return;
    setIsDeleting(true);
    const idsToDelete = Array.isArray(deleteTarget) ? deleteTarget : [deleteTarget];
    
    try {
      const batch = writeBatch(db);
      idsToDelete.forEach(id => {
        batch.delete(doc(db, `books/${bookId}/expenses`, id));
      });
      await batch.commit();
      
      setExpenses(prev => prev.filter(e => !idsToDelete.includes(e.id)));
      setSelectedIds(prev => prev.filter(id => !idsToDelete.includes(id)));
    } catch (e) {
      setError('Failed to delete.');
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  // Calculate Totals
  const cashIn = expenses.reduce((sum, item) => sum + (item.type === 'in' ? item.amount : 0), 0);
  const cashOut = expenses.reduce((sum, item) => sum + (item.type === 'out' ? item.amount : 0), 0);
  const netBalance = cashIn - cashOut;

  // Mock Running Balance Calculation (Reverse for display purposes if sorted Descending)
  // Note: For accurate running balance in a paginated list, you'd need backend support.
  // This is a visual approximation for the current page.
  let runningBalance = netBalance; 
  const expensesWithBalance = expenses.map(e => {
    const currentBalance = runningBalance;
    runningBalance -= (e.type === 'in' ? e.amount : -e.amount);
    return { ...e, balance: currentBalance };
  });

  return (
    <Box sx={{ pb: 4 }}>
      
      {/* --- Top Header Navigation --- */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton onClick={() => router.back()} size="small">
            <FiChevronLeft />
          </IconButton>
          <Typography variant="h5" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {bookName} 
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
           <Button variant="outlined" startIcon={<FiDownload />} sx={{ textTransform: 'none', borderColor: '#e0e0e0', color: 'text.primary' }}>
             Reports
           </Button>
        </Box>
      </Box>
      
      <Divider sx={{ mb: 3 }} />

      {/* --- Filter Bar --- */}
      <Box sx={{ display: 'flex', gap: 2, mb: 4, flexWrap: 'wrap' }}>
        {['Duration: All Time', 'Types: All', 'Members: All', 'Payment Modes: All', 'Categories: All'].map((label, index) => (
          <FormControl key={index} size="small" sx={{ minWidth: 140 }}>
            <Select 
              value={0} 
              displayEmpty 
              sx={{ bgcolor: 'white', fontSize: '0.875rem' }}
              renderValue={() => label}
            >
              <MenuItem value={0}>{label}</MenuItem>
            </Select>
          </FormControl>
        ))}
      </Box>

      {/* --- Search & Actions --- */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, gap: 2, flexWrap: 'wrap' }}>
        <TextField
          placeholder="Search by remark or amount..."
          size="small"
          sx={{ flex: 1, maxWidth: 500, bgcolor: 'white' }}
          InputProps={{
            startAdornment: <InputAdornment position="start"><FiSearch color="#999" /></InputAdornment>,
            endAdornment: <Box sx={{ border: '1px solid #eee', px: 1, borderRadius: 1, fontSize: 12, color: '#999' }}>/</Box>
          }}
        />
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button 
            variant="contained" 
            color="success" 
            startIcon={<FiPlus />}
            onClick={() => { setModalInitialType('in'); setIsModalOpen(true); }}
            sx={{ textTransform: 'none', px: 3, fontWeight: 600, bgcolor: '#00875A' }}
          >
            Cash In
          </Button>
          <Button 
            variant="contained" 
            color="error" 
            startIcon={<FiMinus />}
            onClick={() => { setModalInitialType('out'); setIsModalOpen(true); }}
            sx={{ textTransform: 'none', px: 3, fontWeight: 600, bgcolor: '#DE350B' }}
          >
            Cash Out
          </Button>
        </Box>
      </Box>

      {/* --- Summary Cards --- */}
      <Box sx={{ display: 'flex', gap: 3, mb: 4, flexDirection: { xs: 'column', md: 'row' } }}>
        {[
          { label: 'Cash In', amount: cashIn, color: '#00875A', icon: <FiPlus size={28} />, bg: '#E3FCEF' },
          { label: 'Cash Out', amount: cashOut, color: '#DE350B', icon: <FiMinus size={28} />, bg: '#FFEBE6' },
          { label: 'Net Balance', amount: netBalance, color: '#4361EE', icon: <Typography sx={{ fontWeight: 900, fontSize: 24 }}>=</Typography>, bg: '#eff2ff' },
        ].map((stat, idx) => (
          <Box key={idx} sx={{ flex: 1, minWidth: 0 }}>
            <Paper elevation={0} sx={{ 
              width: '100%',
              border: '1px solid #e0e0e0', 
              px: 2,
              py: 2, // Increased vertical padding (length)
              display: 'flex', 
              alignItems: 'center', 
              gap: 3, 
              height: '100%',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 12px 24px -10px rgba(0,0,0,0.1)'
              }
            }}>
              <Box sx={{ 
                width: 64, height: 64, borderRadius: '50%', 
                bgcolor: stat.bg, color: stat.color, 
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
              }}>
                {stat.icon}
              </Box>
              <Box>
                <Typography variant="subtitle1" color="text.secondary" fontWeight={600} textTransform="uppercase" gutterBottom>
                  {stat.label}
                </Typography>
                <Typography variant="h3" fontWeight={700} color="#172B4D" sx={{ letterSpacing: '-0.5px' }}>
                   {/* Use formatter if available, else simple fallback */}
                   {stat.amount.toLocaleString()} 
                </Typography>
              </Box>
            </Paper>
          </Box>
        ))}
      </Box>

      {/* --- Table Section --- */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Showing 1 - {expenses.length} of {expenses.length} entries
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
           <Select size="small" value={1} sx={{ height: 32 }}>
             <MenuItem value={1}>Page 1</MenuItem>
           </Select>
           <Typography variant="body2">of 1</Typography>
           <IconButton size="small" disabled><FiChevronLeft /></IconButton>
           <IconButton size="small" disabled><FiChevronRight /></IconButton>
        </Box>
      </Box>

      <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #f0f0f0' }}>
        <Table sx={{ minWidth: 650 }} aria-label="expenses table">
          <TableHead sx={{ bgcolor: '#F4F5F7' }}>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox 
                  size="small"
                  checked={expenses.length > 0 && selectedIds.length === expenses.length}
                  indeterminate={selectedIds.length > 0 && selectedIds.length < expenses.length}
                  onChange={(e) => e.target.checked ? setSelectedIds(expenses.map(ex => ex.id)) : setSelectedIds([])}
                />
              </TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#5E6C84', fontSize: '0.8rem' }}>Date & Time</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#5E6C84', fontSize: '0.8rem' }}>Details</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#5E6C84', fontSize: '0.8rem' }}>Category</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#5E6C84', fontSize: '0.8rem' }}>Mode</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#5E6C84', fontSize: '0.8rem' }}>Bill</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600, color: '#5E6C84', fontSize: '0.8rem' }}>Amount</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600, color: '#5E6C84', fontSize: '0.8rem' }}>Balance</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={8} align="center">Loading...</TableCell></TableRow>
            ) : expensesWithBalance.length === 0 ? (
              <TableRow><TableCell colSpan={8} align="center">No expenses found.</TableCell></TableRow>
            ) : (
              expensesWithBalance.map((row) => {
                const { date, time } = formatDate(row.createdAt);
                const isSelected = selectedIds.indexOf(row.id) !== -1;
                
                return (
                  <TableRow
                    key={row.id}
                    hover
                    selected={isSelected}
                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox
                        size="small"
                        checked={isSelected}
                        onChange={(e) => {
                          const newSelected = e.target.checked 
                            ? [...selectedIds, row.id] 
                            : selectedIds.filter(id => id !== row.id);
                          setSelectedIds(newSelected);
                        }}
                      />
                    </TableCell>
                    <TableCell component="th" scope="row">
                      <Typography variant="body2" fontWeight={500}>{date}</Typography>
                      <Typography variant="caption" color="text.secondary">{time}</Typography>
                    </TableCell>
                    <TableCell>
                       <Typography variant="body2" color={!row.description || row.description === '--' ? 'text.disabled' : 'text.primary'}>
                         {row.description}
                       </Typography>
                    </TableCell>
                    <TableCell><Typography variant="body2">{row.category}</Typography></TableCell>
                    <TableCell><Typography variant="body2">{row.paymentMode}</Typography></TableCell>
                    <TableCell><Box sx={{ width: 20, height: 2, bgcolor: '#eee' }} /></TableCell>
                    <TableCell align="right">
                      <Typography 
                        variant="body2" 
                        fontWeight={600}
                        color={row.type === 'in' ? 'success.main' : 'error.main'}
                      >
                         {row.amount.toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight={500}>
                         {row.balance.toLocaleString()}
                      </Typography>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Delete Fab/Action (Contextual) */}
      {selectedIds.length > 0 && (
         <Box sx={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', bgcolor: 'white', p: 2, borderRadius: 2, boxShadow: 3, display: 'flex', gap: 2, alignItems: 'center', zIndex: 10 }}>
           <Typography variant="body2">{selectedIds.length} items selected</Typography>
           <Button variant="contained" color="error" size="small" onClick={() => setDeleteTarget(selectedIds)}>Delete Selected</Button>
           <Button variant="outlined" size="small" onClick={() => setSelectedIds([])}>Cancel</Button>
         </Box>
      )}

      {/* Modals & Dialogs */}
      <AddExpenseModal
        isOpen={isModalOpen}
        initialType={modalInitialType}
        currentBalance={netBalance}
        onClose={() => { setIsModalOpen(false); setModalInitialType(undefined); }}
        onAddExpense={handleAddExpense}
      />

      <Dialog
        open={deleteTarget !== null}
        onClose={() => !isDeleting && setDeleteTarget(null)}
      >
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the selected items? This cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)} disabled={isDeleting}>Cancel</Button>
          <Button onClick={handleConfirmDelete} color="error" autoFocus disabled={isDeleting}>
             {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}