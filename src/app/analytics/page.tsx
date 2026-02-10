'use client';

import React, { useState, useEffect } from 'react';
import { FiTrendingUp, FiTrendingDown, FiDollarSign, FiBook } from 'react-icons/fi';
import { Typography, Box, Grid, LinearProgress, Divider } from '@mui/material';
import { collection, getDocs } from "firebase/firestore";
import { db } from '../firebase';
import Card from '../components/Card';
import Loading from '../components/Loading';
import { useCurrency } from '../context/CurrencyContext';

interface Expense {
  id: string;
  description: string;
  amount: number;
  createdAt?: string;
}

const AnalyticsPage = () => {
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [totalBooks, setTotalBooks] = useState(0);
  const [averageExpense, setAverageExpense] = useState(0);
  const [highestExpense, setHighestExpense] = useState(0);
  const [loading, setLoading] = useState(true);
  const { formatCurrency } = useCurrency();

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      const booksSnapshot = await getDocs(collection(db, 'books'));
      const booksData = booksSnapshot.docs.map(doc => ({ 
        id: doc.id, 
        name: doc.data().name 
      }));
      setTotalBooks(booksData.length);

      let totalAmount = 0;
      let expenseCount = 0;
      let highestAmount = 0;

      for (const book of booksData) {
        const expensesSnapshot = await getDocs(collection(db, `books/${book.id}/expenses`));
        expensesSnapshot.forEach((doc) => {
          const expense = doc.data() as Expense;
          const amount = expense.amount || 0;
          totalAmount += amount;
          expenseCount++;
          if (amount > highestAmount) {
            highestAmount = amount;
          }
        });
      }

      setTotalExpenses(totalAmount);
      setAverageExpense(expenseCount > 0 ? totalAmount / expenseCount : 0);
      setHighestExpense(highestAmount);
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    {
      title: 'Total Expenses',
      value: formatCurrency(totalExpenses),
      icon: FiDollarSign,
      color: 'primary'
    },
    {
      title: 'Total Books',
      value: totalBooks,
      icon: FiBook,
      color: 'secondary'
    },
    {
      title: 'Average Expense',
      value: formatCurrency(averageExpense),
      icon: FiTrendingUp,
      color: 'success'
    },
    {
      title: 'Highest Expense',
      value: formatCurrency(highestExpense),
      icon: FiTrendingDown,
      color: 'error'
    }
  ];

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="space-y-8">
      <header className="surface-card p-6 md:p-8">
        <h1 className="page-title">Analytics</h1>
        <p className="page-subtitle">Track your financial insights and spending patterns.</p>
      </header>

      <Grid container spacing={2}>
        {stats.map((stat, index) => (
          <Grid size={{ xs: 12, sm: 6, xl: 3 }} key={index}>
            <Card>
              <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box 
                  sx={{ 
                    display: 'flex', 
                    h: 48, 
                    w: 48, 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    borderRadius: '12px',
                    bgcolor: `${stat.color}.container`,
                    color: `on-${stat.color}-container`
                  }}
                >
                  <stat.icon size={24} />
                </Box>
              </Box>
              <Typography variant="body2" color="text.secondary">{stat.title}</Typography>
              <Typography variant="h4" sx={{ mt: 1, fontWeight: '500' }}>{stat.value}</Typography>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, xl: 6 }}>
          <Card className="p-7">
            <Typography variant="h5" sx={{ mb: 4, fontWeight: '500' }}>Expense Overview</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <Box>
                <Box sx={{ mb: 1, display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Spending Activity</Typography>
                  <Typography variant="body2" fontWeight="600">{totalExpenses > 0 ? 'Active' : 'No Activity'}</Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={totalExpenses > 0 ? 65 : 0} 
                  sx={{ height: 12, borderRadius: 6 }} 
                />
              </Box>

              <Box>
                <Box sx={{ mb: 1, display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Book Organization</Typography>
                  <Typography variant="body2" fontWeight="600">{totalBooks > 0 ? `${totalBooks} Books` : 'No Books'}</Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={totalBooks > 0 ? Math.min(totalBooks * 20, 100) : 0} 
                  color="secondary"
                  sx={{ height: 12, borderRadius: 6 }} 
                />
              </Box>

              <Box>
                <Box sx={{ mb: 1, display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Budget Health</Typography>
                  <Typography variant="body2" fontWeight="600">{totalExpenses > 0 ? 'Good' : 'N/A'}</Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={80} 
                  color="warning"
                  sx={{ height: 12, borderRadius: 6 }} 
                />
              </Box>
            </Box>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, xl: 6 }}>
          <Card className="p-7">
            <Typography variant="h5" sx={{ mb: 4, fontWeight: '500' }}>Quick Insights</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box 
                sx={{ 
                  display: 'flex', 
                  gap: 3, 
                  p: 3, 
                  borderRadius: '16px', 
                  border: '1px solid', 
                  borderColor: 'divider',
                  bgcolor: 'surface.container-lowest' 
                }}
              >
                <Box sx={{ display: 'flex', h: 40, w: 40, flexShrink: 0, alignItems: 'center', justifyContent: 'center', borderRadius: '8px', bgcolor: 'primary.container', color: 'on-primary-container' }}>
                  <FiTrendingUp />
                </Box>
                <Box>
                  <Typography variant="subtitle2" fontWeight="600">Spending Trend</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {totalExpenses > 0
                      ? `You've recorded ${formatCurrency(totalExpenses)} in total expenses across ${totalBooks} book${totalBooks !== 1 ? 's' : ''}.`
                      : 'Start adding expenses to see your spending trends.'
                    }
                  </Typography>
                </Box>
              </Box>

              <Box 
                sx={{ 
                  display: 'flex', 
                  gap: 3, 
                  p: 3, 
                  borderRadius: '16px', 
                  border: '1px solid', 
                  borderColor: 'divider',
                  bgcolor: 'surface.container-lowest' 
                }}
              >
                <Box sx={{ display: 'flex', h: 40, w: 40, flexShrink: 0, alignItems: 'center', justifyContent: 'center', borderRadius: '8px', bgcolor: 'secondary.container', color: 'on-secondary-container' }}>
                  <FiDollarSign />
                </Box>
                <Box>
                  <Typography variant="subtitle2" fontWeight="600">Average Transaction</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {averageExpense > 0
                      ? `Your average expense is ${formatCurrency(averageExpense)} per transaction.`
                      : 'Add expenses to calculate your average transaction amount.'
                    }
                  </Typography>
                </Box>
              </Box>

              <Box 
                sx={{ 
                  display: 'flex', 
                  gap: 3, 
                  p: 3, 
                  borderRadius: '16px', 
                  border: '1px solid', 
                  borderColor: 'divider',
                  bgcolor: 'surface.container-lowest' 
                }}
              >
                <Box sx={{ display: 'flex', h: 40, w: 40, flexShrink: 0, alignItems: 'center', justifyContent: 'center', borderRadius: '8px', bgcolor: 'error.container', color: 'on-error-container' }}>
                  <FiTrendingDown />
                </Box>
                <Box>
                  <Typography variant="subtitle2" fontWeight="600">Top Expense</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {highestExpense > 0
                      ? `Your highest single expense was ${formatCurrency(highestExpense)}.`
                      : 'No expenses recorded yet.'
                    }
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Card>
        </Grid>
      </Grid>
    </div>
  );
};

export default AnalyticsPage;
