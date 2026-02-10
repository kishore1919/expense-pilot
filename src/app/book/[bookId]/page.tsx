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
  Paper,
  Skeleton,
  Chip,
  Slide,
} from '@mui/material';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, collection, getDocs, addDoc, deleteDoc } from "firebase/firestore";
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
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
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

  const handleDeleteExpense = async (expenseId: string) => {
    if (!bookId || typeof bookId !== 'string' || Array.isArray(bookId)) return;
    if (!window.confirm('Are you sure you want to delete this expense?')) return;

    try {
      await deleteDoc(doc(db, `books/${bookId}/expenses`, expenseId));
      setExpenses((prev) => prev.filter((e) => e.id !== expenseId));
      setSelectedIds((prev) => prev.filter((id) => id !== expenseId));
    } catch (e) {
      console.error('Error deleting expense:', e);
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
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
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
            {expenses.length > 0 && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
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
            )}
          </Box>

          {/* Bulk Actions Bar */}
          <Slide direction="up" in={selectedIds.length > 0} mountOnEnter unmountOnExit>
            <Paper
              sx={{
                p: 2,
                mb: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                borderRadius: 2,
              }}
            >
              <Typography variant="body2" fontWeight={500}>
                {selectedIds.length} selected
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  size="small"
                  variant="outlined"
                  color="inherit"
                  onClick={() => setSelectedIds([])}
                  sx={{ borderColor: 'primary.contrastText', color: 'primary.contrastText' }}
                >
                  Cancel
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  color="error"
                  disabled={isBulkDeleting}
                  onClick={async () => {
                    if (selectedIds.length === 0) return;
                    if (!window.confirm(`Delete ${selectedIds.length} selected entries?`)) return;
                    setIsBulkDeleting(true);
                    try {
                      await Promise.all(selectedIds.map((id) => deleteDoc(doc(db, `books/${bookId}/expenses`, id))));
                      setExpenses((prev) => prev.filter((p) => !selectedIds.includes(p.id)));
                      setSelectedIds([]);
                    } catch (err) {
                      console.error('Bulk delete failed', err);
                    } finally { setIsBulkDeleting(false); }
                  }}
                >
                  Delete Selected
                </Button>
              </Box>
            </Paper>
          </Slide>

          {loading ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {[1, 2, 3, 4, 5].map((i) => (
                <ExpenseSkeleton key={i} />
              ))}
            </Box>
          ) : expenses.length > 0 ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {expenses.map((expense) => (
                <Paper
                  key={expense.id}
                  sx={{
                    p: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
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
                      variant="h6"
                      fontWeight={600}
                      sx={{ color: expense.type === 'out' ? 'error.main' : 'success.main' }}
                    >
                      {expense.type === 'out' ? '-' : '+'}{formatCurrency(expense.amount)}
                    </Typography>
                    <IconButton
                      onClick={() => handleDeleteExpense(expense.id)}
                      size="small"
                      sx={{
                        color: 'text.secondary',
                        '&:hover': {
                          color: 'error.main',
                          bgcolor: 'error.bg',
                        },
                      }}
                    >
                      <FiTrash2 size={18} />
                    </IconButton>
                  </Box>
                </Paper>
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

          {/* Delete All Button */}
          {expenses.length > 0 && (
            <Box sx={{ mt: 3, pt: 3, borderTop: '1px solid', borderColor: 'divider' }}>
              <Button
                disabled={isBulkDeleting}
                color="error"
                variant="outlined"
                size="small"
                onClick={async () => {
                  if (!window.confirm('Delete ALL expenses for this book?')) return;
                  setIsBulkDeleting(true);
                  try {
                    const docs = await getDocs(collection(db, `books/${bookId}/expenses`));
                    await Promise.all(docs.docs.map((d) => deleteDoc(doc(db, `books/${bookId}/expenses`, d.id))));
                    setExpenses([]);
                    setSelectedIds([]);
                  } catch (err) {
                    console.error('Delete all failed', err);
                  } finally { setIsBulkDeleting(false); }
                }}
              >
                Delete All Expenses
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
    </Box>
  );
}
