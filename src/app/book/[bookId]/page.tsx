'use client';

import React, { useState, useEffect } from 'react';
import { FiPlus, FiChevronLeft, FiTrash2 } from 'react-icons/fi';
import { Button, IconButton, Typography, Box, Alert, Grid, Checkbox, Toolbar } from '@mui/material';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, collection, getDocs, addDoc, deleteDoc } from "firebase/firestore";
import { db } from '../../../app/firebase';
import AddExpenseModal from '../../components/AddExpenseModal';
import Loading from '../../components/Loading';
import Card from '../../components/Card';
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

const BookDetailPage = () => {
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
      // Validate the dynamic param is a single string to avoid runtime errors
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
          const data = d.data() as any;
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
      // Debug: log payload being stored so we can verify type/amount
      console.debug('Adding expense to Firestore:', expense);
      // Store createdAt as Date object - Firestore will convert it to a timestamp
      const docRef = await addDoc(collection(db, `books/${bookId}/expenses`), expense);
      console.debug('Added expense id:', docRef.id);
      setExpenses([...expenses, { id: docRef.id, ...expense }]);
      setIsModalOpen(false);
      // Return the new id so callers can await the result
      return docRef.id;
    } catch (e) {
      console.error("Error adding document: ", e);
      // Re-throw so caller (modal) can surface the error
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
  const totalExpense = cashOut;
  const netBalance = cashIn - cashOut;

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="space-y-6">
      <header className="surface-card flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between md:p-8">
        <div className="flex items-center gap-4">
          <IconButton onClick={() => router.back()} size="large" sx={{ color: 'text.secondary' }}>
            <FiChevronLeft />
          </IconButton>
          <div>
            <h1 className="page-title">{bookName}</h1>
            <p className="page-subtitle">
              {expenses.length} expense{expenses.length !== 1 ? 's' : ''} recorded
            </p>
          </div>
        </div>
        <Box sx={{ display: 'flex', gap: 2, width: { xs: '100%', md: 'auto' } }}>
          <Button 
            variant="contained" 
            fullWidth
            onClick={() => { setModalInitialType('in'); setIsModalOpen(true); }}
            sx={{ 
              backgroundColor: 'primary.container', 
              color: 'on-primary-container',
              '&:hover': { backgroundColor: 'primary.container', opacity: 0.9 },
              borderRadius: '100px',
              boxShadow: 'none'
            }}
          >
            + Cash In
          </Button>
          <Button 
            variant="contained" 
            fullWidth
            onClick={() => { setModalInitialType('out'); setIsModalOpen(true); }}
            sx={{ 
              backgroundColor: 'error.container', 
              color: 'on-error-container',
              '&:hover': { backgroundColor: 'error.container', opacity: 0.9 },
              borderRadius: '100px',
              boxShadow: 'none'
            }}
          >
            - Cash Out
          </Button>
        </Box>
      </header>

      {error && (
        <Alert severity="error" sx={{ borderRadius: '16px' }}>{error}</Alert>
      )}

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <Typography variant="body2" fontWeight="500" color="text.secondary">Cash In</Typography>
            <Typography variant="h4" sx={{ mt: 1, color: 'primary.main', fontWeight: '500' }}>{formatCurrency(cashIn)}</Typography>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <Typography variant="body2" fontWeight="500" color="text.secondary">Cash Out</Typography>
            <Typography variant="h4" sx={{ mt: 1, color: 'error.main', fontWeight: '500' }}>{formatCurrency(cashOut)}</Typography>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <Typography variant="body2" fontWeight="500" color="text.secondary">Net Balance</Typography>
            <Typography variant="h4" sx={{ mt: 1, fontWeight: '500', color: netBalance >= 0 ? 'primary.main' : 'error.main' }}>
              {formatCurrency(netBalance)}
            </Typography>
          </Card>
        </Grid>
      </Grid>

      <div className="surface-card overflow-hidden">
        <div className="border-b border-outline-variant px-6 py-4">
          <h2 className="section-title">Expenses</h2>
        </div>
        <div className="p-4 md:p-6">
          <Toolbar sx={{ px: 0, mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
              <Typography variant="body2" color="text.secondary">Select</Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button disabled={selectedIds.length === 0 || isBulkDeleting} color="error" variant="contained" onClick={async () => {
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
              }}>Delete Selected</Button>

              <Button disabled={expenses.length === 0 || isBulkDeleting} color="error" variant="outlined" onClick={async () => {
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
              }}>Delete All</Button>
            </Box>
          </Toolbar>

          {expenses.length > 0 ? (
            <div className="space-y-3">
              {expenses.map((expense) => (
                <div key={expense.id} className="flex items-center justify-between rounded-[16px] border border-outline-variant bg-surface-container-low px-4 py-3 transition hover:bg-surface-container">
                  <div className="flex items-center gap-4">
                    <Typography variant="body1" fontWeight="500">{expense.description}</Typography>
                  </div>

                  <div className="flex items-center gap-3">
                    <Typography 
                      variant="h6" 
                      fontWeight="600" 
                      sx={{ color: expense.type === 'out' ? 'error.main' : 'primary.main' }}
                    >
                      {expense.type === 'out' ? formatCurrency(-expense.amount) : formatCurrency(expense.amount)}
                    </Typography>
                    <IconButton
                      onClick={() => handleDeleteExpense(expense.id)}
                      size="small"
                      sx={{ 
                        color: 'text.secondary',
                        '&:hover': { backgroundColor: 'error.container', color: 'error.main' }
                      }}
                    >
                      <FiTrash2 size={18} />
                    </IconButton>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Box sx={{ py: 10, textAlign: 'center' }}>
              <Typography color="text.secondary">No expenses yet. Add your first one.</Typography>
            </Box>
          )}
        </div>
      </div>

      <AddExpenseModal isOpen={isModalOpen} initialType={modalInitialType} onClose={() => { setIsModalOpen(false); setModalInitialType(undefined); }} onAddExpense={handleAddExpense} />
    </div>
  );
};

export default BookDetailPage;
