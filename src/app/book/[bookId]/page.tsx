'use client';

import React, { useState, useEffect } from 'react';
import { FiChevronLeft, FiTrash2, FiTrendingUp, FiTrendingDown, FiDollarSign } from 'react-icons/fi';
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
  Chip,
} from '@mui/material';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, collection, getDocs, addDoc, deleteDoc, writeBatch } from "firebase/firestore";
import { db } from '../../../app/firebase';
import AddExpenseModal from '../../components/AddExpenseModal';
import { useCurrency } from '../../context/CurrencyContext';

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

// Skeleton loaders
const StatSkeleton = () => (
  <Card>
    <CardContent sx={{ p: 3 }}>
      <Skeleton variant="text" width="40%" height={20} />
      <Skeleton variant="text" width="60%" height={40} />
    </CardContent>
  </Card>
);

const ExpenseSkeleton = () => (
  <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
    <Skeleton variant="circular" width={20} height={20} />
    <Box sx={{ flex: 1 }}>
      <Skeleton variant="text" width="50%" height={24} />
    </Box>
    <Skeleton variant="text" width="20%" height={28} />
  </Paper>
);

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
  const { formatCurrency } = useCurrency();

  useEffect(() => {
    const fetchBookDetails = async () => {
      if (!bookId || typeof bookId !== 'string' || Array.isArray(bookId)) {
        setError('Invalid book ID.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const bookRef = doc(db, 'books', bookId as string);
        const bookSnap = await getDoc(bookRef);

        if (bookSnap.exists()) {
          setBookName(bookSnap.data().name);
        } else {
          setBookName('Expense Book');
          setError('This book could not be found.');
        }

        const expensesQuery = await getDocs(collection(db, `books/${bookId}/expenses`));
        const expensesData = expensesQuery.docs.map((d) => {
          const data = d.data();
          const createdAtRaw = data.createdAt;
          const createdAt = createdAtRaw && typeof createdAtRaw.toDate === 'function' ? createdAtRaw.toDate() : (createdAtRaw ? new Date(createdAtRaw) : new Date());

          return {
            id: d.id,
            description: data.description,
            amount: data.amount,
            type: data.type ?? 'out',
            createdAt,
            remarks: data.remarks,
            category: data.category,
            paymentMode: data.paymentMode,
            attachments: data.attachments ?? [],
          } as Expense;
        });
        setExpenses(expensesData);
      } catch (e) {
        console.error("Error loading book details:", e);
        setError('Failed to load this book. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchBookDetails();
  }, [bookId]);

  const handleAddExpense = async (expense: { description: string; amount: number; type: 'in' | 'out'; createdAt: Date; remarks?: string; category?: string; paymentMode?: string; attachments?: string[] }) => {
    if (!bookId || typeof bookId !== 'string' || Array.isArray(bookId)) return;

    try {
      const docRef = await addDoc(collection(db, `books/${bookId}/expenses`), expense);
      setExpenses([...expenses, { id: docRef.id, ...expense }]);
      setIsModalOpen(false);
      return docRef.id;
    } catch (e) {
      console.error("Error adding document: ", e);
      throw e;
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget || !bookId || typeof bookId !== 'string') return;

    const idsToDelete = Array.isArray(deleteTarget) ? deleteTarget : [deleteTarget];
    if (idsToDelete.length === 0) {
      setDeleteTarget(null);
      return;
    }

    setIsDeleting(true);
    try {
      if (idsToDelete.length > 1) {
        const batch = writeBatch(db);
        idsToDelete.forEach((id) => {
          batch.delete(doc(db, `books/${bookId}/expenses`, id));
        });
        await batch.commit();
      } else {
        await deleteDoc(doc(db, `books/${bookId}/expenses`, idsToDelete[0]));
      }
      setExpenses((prev) => prev.filter((e) => !idsToDelete.includes(e.id)));
      setSelectedIds((prev) => prev.filter((id) => !idsToDelete.includes(id)));
    } catch (e) {
      console.error('Error deleting expense:', e);
      setError('Failed to delete expense(s).');
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  const cashIn = expenses.reduce((sum, item) => sum + (item.type === 'in' ? item.amount : 0), 0);
  const cashOut = expenses.reduce((sum, item) => sum + (item.type === 'out' ? item.amount : 0), 0);
  const netBalance = cashIn - cashOut;

  // Format date for display
  const formatDate = (date?: Date) => {
    if (!date) return '';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <Box>
      {/* Header */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton
              onClick={() => router.back()}
              sx={{
                color: 'text.secondary',
                bgcolor: 'action.hover',
                '&:hover': { bgcolor: 'action.selected' },
              }}
            >
              <FiChevronLeft />
            </IconButton>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h4" fontWeight={600}>
                {loading ? <Skeleton variant="text" width="60%" /> : bookName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {loading ? <Skeleton variant="text" width="40%" /> : `${expenses.length} expense${expenses.length !== 1 ? 's' : ''} recorded`}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                color="success"
                onClick={() => { setModalInitialType('in'); setIsModalOpen(true); }}
                startIcon={<FiTrendingUp />}
              >
                Cash In
              </Button>
              <Button
                variant="contained"
                color="error"
                onClick={() => { setModalInitialType('out'); setIsModalOpen(true); }}
                startIcon={<FiTrendingDown />}
              >
                Cash Out
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
      )}

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 4 }}>

          {loading ? (
            <StatSkeleton />
          ) : (
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: 2,
                      bgcolor: 'success.main',
                      color: 'success.contrastText',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <FiTrendingUp size={16} />
                  </Box>
                  <Typography variant="body2" color="text.secondary" fontWeight={500}>
                    Cash In
                  </Typography>
                </Box>
                <Typography variant="h4" fontWeight={600} color="success.main">
                  {formatCurrency(cashIn)}
                </Typography>
              </CardContent>
            </Card>
          )}
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          {loading ? (
            <StatSkeleton />
          ) : (
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: 2,
                      bgcolor: 'error.main',
                      color: 'error.contrastText',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <FiTrendingDown size={16} />
                  </Box>
                  <Typography variant="body2" color="text.secondary" fontWeight={500}>
                    Cash Out
                  </Typography>
                </Box>
                <Typography variant="h4" fontWeight={600} color="error.main">
                  {formatCurrency(cashOut)}
                </Typography>
              </CardContent>
            </Card>
          )}
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          {loading ? (
            <StatSkeleton />
          ) : (
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: 2,
                      bgcolor: netBalance >= 0 ? 'primary.main' : 'warning.main',
                      color: 'primary.contrastText',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <FiDollarSign size={16} />
                  </Box>
                  <Typography variant="body2" color="text.secondary" fontWeight={500}>
                    Net Balance
                  </Typography>
                </Box>
                <Typography
                  variant="h4"
                  fontWeight={600}
                  color={netBalance >= 0 ? 'primary.main' : 'warning.main'}
                >
                  {formatCurrency(netBalance)}
                </Typography>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>

      {/* Expenses List */}
      <Card>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" fontWeight={600}>
              Expenses
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {selectedIds.length > 0 ? (
                <>
                  <Button 
                    size="small" 
                    onClick={() => setSelectedIds([])}
                    sx={{ color: 'text.secondary', textTransform: 'none' }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="contained"
                    color="error"
                    size="small"
                    disableElevation
                    startIcon={<FiTrash2 />}
                    onClick={() => setDeleteTarget(selectedIds)}
                    disabled={isDeleting}
                    sx={{ textTransform: 'none', borderRadius: 2 }}
                  >
                    Delete
                  </Button>
                </>
              ) : (
                expenses.length > 0 && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Checkbox
                      size="small"
                      checked={expenses.length > 0 && selectedIds.length === expenses.length}
                      indeterminate={selectedIds.length > 0 && selectedIds.length < expenses.length}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedIds(expenses.map((ex) => ex.id));
                        else setSelectedIds([]);
                      }}
                    />
                    <Typography variant="body2" color="text.secondary">
                      Select all
                    </Typography>
                  </Box>
                )
              )}
            </Box>
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {[1, 2, 3, 4, 5].map((i) => (
                <ExpenseSkeleton key={i} />
              ))}
            </Box>
          ) : expenses.length > 0 ? (
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              {expenses.map((expense) => (
                <Box
                  key={expense.id}
                  sx={{
                    py: 2,
                    px: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    transition: 'background-color 150ms ease',
                    '&:hover': {
                      bgcolor: 'action.hover',
                    },
                  }}
                >
                  <Checkbox
                    size="small"
                    checked={selectedIds.includes(expense.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedIds([...selectedIds, expense.id]);
                      } else {
                        setSelectedIds(selectedIds.filter((id) => id !== expense.id));
                      }
                    }}
                  />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Typography variant="subtitle1" fontWeight={500} noWrap>
                        {expense.description}
                      </Typography>
                      {expense.category && (
                        <Chip
                          label={expense.category}
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: '0.75rem',
                            bgcolor: 'action.hover',
                          }}
                        />
                      )}
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {formatDate(expense.createdAt)}
                      {expense.paymentMode && ` • ${expense.paymentMode}`}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography
                      variant="subtitle1"
                      fontWeight={700}
                      sx={{ color: expense.type === 'out' ? 'error.main' : 'success.main', minWidth: 80, textAlign: 'right' }}
                    >
                      {expense.type === 'out' ? '-' : '+'}{formatCurrency(expense.amount)}
                    </Typography>
                    <IconButton
                      onClick={() => setDeleteTarget(expense.id)}
                      size="small"
                      disabled={isDeleting}
                      sx={{
                        color: 'text.secondary',
                        '&:hover': {
                          color: 'error.main',
                          bgcolor: 'action.hover',
                        },
                      }}
                    >
                      <FiTrash2 size={18} />
                    </IconButton>
                  </Box>
                </Box>
              ))}
            </Box>
          ) : (
            <Box sx={{ py: 8, textAlign: 'center' }}>
              <Typography color="text.secondary" gutterBottom>
                No expenses yet. Add your first one.
              </Typography>
              <Button
                variant="contained"
                onClick={() => { setModalInitialType('out'); setIsModalOpen(true); }}
                sx={{ mt: 2 }}
              >
                Add Expense
              </Button>
            </Box>
          )}


        </CardContent>
      </Card>

      <AddExpenseModal
        isOpen={isModalOpen}
        initialType={modalInitialType}
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
            {`Are you sure you want to delete ${
              Array.isArray(deleteTarget) && deleteTarget.length > 1
                ? `${deleteTarget.length} expenses`
                : 'this expense'
            }? This action cannot be undone.`}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)} disabled={isDeleting}>
            Cancel
          </Button>
          <Button onClick={handleConfirmDelete} color="error" disabled={isDeleting} autoFocus>
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
