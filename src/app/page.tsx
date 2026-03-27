/**
 * Dashboard Component - Main dashboard page showing financial overview and management.
 * Integrated with Loans, Investments, and Budgets for a holistic view.
 */
'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  FiPlus, 
  FiCreditCard, 
  FiArrowRight,
  FiActivity,
  FiUser,
  FiArrowUpRight,
  FiArrowDownRight
} from 'react-icons/fi';
import {
  Box,
  Alert,
  Grid,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Skeleton,
} from '@mui/material';
import AddBookModal from './components/AddBookModal';
import { useBooks } from '@/app/hooks/useBooks';
import { useRecentTransactions } from '@/app/hooks/useRecentTransactions';
import { useCurrencyStore } from '@/app/stores';
import { useProtectedRoute } from '@/app/hooks/useAuth';

/**
 * Main Dashboard component displaying financial overview and management.
 */
export default function HomePage() {
  const { formatCurrency } = useCurrencyStore();
  const { user, loading: authLoading } = useProtectedRoute();
  const router = useRouter();
  
  const { loading: booksLoading, error: booksError, addBook } = useBooks({ calculateNet: true });
  const { transactions, loading: transactionsLoading } = useRecentTransactions(5);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const handleAddBook = useCallback(async (bookName: string, type: 'personal' | 'ledger' = 'personal') => {
    try {
      setAddError(null);
      await addBook(bookName, type);
      setIsModalOpen(false);
    } catch (err) {
      setAddError(err instanceof Error ? err.message : 'Failed to create book');
    }
  }, [addBook]);

  const loading = authLoading || booksLoading || transactionsLoading;

  const today = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  const quickActions = [
    { label: 'Personal Tracker', icon: <FiUser size={18} />, path: '/personal', color: '#6366F1' },
    { label: 'Add Loan', icon: <FiCreditCard size={18} />, path: '/loans', color: '#EF4444' },
  ];

  return (
    <Box className="fade-in" sx={{ py: { xs: 2, sm: 4 }, px: { xs: 1, sm: 2 } }}>
      {/* Welcome Section */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography 
            variant="h4" 
            fontWeight={700} 
            sx={{ 
              fontSize: { xs: '1.5rem', sm: '2rem' },
              color: 'text.primary',
              mb: 0.5
            }}
          >
            Welcome back, {user?.displayName?.split(' ')[0] || 'User'}!
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {today} • Track your expenses and manage your books.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<FiUser />}
            onClick={() => router.push('/personal')}
            sx={{ 
              borderRadius: 2.5, 
              px: 3, 
              py: 1, 
              textTransform: 'none',
              fontWeight: 600,
              display: { xs: 'none', sm: 'flex' }
            }}
          >
            Personal Tracker
          </Button>
          <Button
            variant="contained"
            startIcon={<FiPlus />}
            onClick={() => setIsModalOpen(true)}
            sx={{ 
              borderRadius: 2.5, 
              px: 3, 
              py: 1, 
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)',
              textTransform: 'none',
              fontWeight: 600
            }}
          >
            New Book
          </Button>
        </Box>
      </Box>

      {(booksError || addError) && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          {booksError || addError}
        </Alert>
      )}

      {/* Stats Grid removed - using Quick Actions and Recent Transactions instead */}

      <Typography variant="h6" fontWeight={700} sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
        <FiActivity size={20} color="#6366F1" />
        Quick Actions
      </Typography>

      <Grid container spacing={3} sx={{ mb: 6 }}>
        {quickActions.map((action) => (
          <Grid size={{ xs: 12, sm: 4 }} key={action.label}>
            <Paper
              component={Link}
              href={action.path}
              elevation={0}
              sx={{
                p: 3,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: 2,
                borderRadius: 4,
                border: '1px solid',
                borderColor: 'divider',
                textDecoration: 'none',
                color: 'text.primary',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  borderColor: 'primary.main',
                  bgcolor: 'rgba(99, 102, 241, 0.02)',
                  transform: 'translateY(-4px)',
                  boxShadow: '0 12px 20px -10px rgba(99, 102, 241, 0.15)',
                }
              }}
            >
              <Box 
                sx={{ 
                  width: 48, 
                  height: 48, 
                  borderRadius: 3, 
                  bgcolor: `${action.color}15`, 
                  color: action.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {action.icon}
              </Box>
              <Box sx={{ width: '100%' }}>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 0.5 }}>
                  {action.label}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  Manage your {action.label.split(' ').pop()?.toLowerCase()}s <FiArrowRight size={14} />
                </Typography>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Recent Transactions Section */}
      <Typography variant="h6" fontWeight={700} sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
        <FiActivity size={20} color="#6366F1" />
        Recent Transactions
        <Typography variant="body2" color="text.secondary" fontWeight={400} sx={{ ml: 1 }}>
          Across all books
        </Typography>
      </Typography>

      <Paper elevation={0} sx={{ mb: 6, border: '1px solid', borderColor: 'divider', borderRadius: 3, overflow: 'hidden' }}>
        {transactionsLoading ? (
          <Box sx={{ p: 3 }}>
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} height={60} sx={{ mb: 1 }} />
            ))}
          </Box>
        ) : transactions.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">No transactions yet</Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table sx={{ minWidth: 650 }}>
              <TableHead sx={{ bgcolor: 'background.default' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Book</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Category</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>Amount</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transactions.slice(0, 5).map((tx) => {
                  const date = tx.createdAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
                  const isIncome = tx.type === 'in';
                  return (
                    <TableRow 
                      key={`${tx.bookId}-${tx.id}`} 
                      hover 
                      onClick={() => router.push(`/book/${tx.bookId}`)}
                      sx={{ textDecoration: 'none', cursor: 'pointer' }}
                    >
                      <TableCell>
                        <Typography variant="body2" fontWeight={500}>{date}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={500}>{tx.description}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={tx.bookName} 
                          size="small" 
                          sx={{ fontWeight: 500, fontSize: '0.75rem' }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">{tx.category}</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                          {isIncome ? (
                            <FiArrowUpRight size={16} color="#22c55e" />
                          ) : (
                            <FiArrowDownRight size={16} color="#ef4444" />
                          )}
                          <Typography 
                            variant="body2" 
                            fontWeight={600} 
                            color={isIncome ? 'success.main' : 'error.main'}
                          >
                            {isIncome ? '+' : '-'}{formatCurrency(tx.amount)}
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Books Section */}
      <AddBookModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddBook={handleAddBook}
      />
    </Box>
  );
}
