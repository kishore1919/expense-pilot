'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  Box, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  IconButton, 
  Skeleton, 
  useTheme, 
  useMediaQuery,
  Paper,
  Divider,
  ToggleButton,
  ToggleButtonGroup
} from '@mui/material';
import { 
  FiChevronLeft, 
  FiTrendingUp, 
  FiTrendingDown, 
  FiPieChart, 
  FiActivity,
  FiTag
} from 'react-icons/fi';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Legend,
  AreaChart,
  Area,
  Label
} from 'recharts';
import { doc, getDoc, collection, getDocs, query } from "firebase/firestore";
import { auth, db } from '../../../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useCurrency } from '../../../context/CurrencyContext';

interface Expense {
  id: string;
  description: string;
  amount: number;
  type: 'in' | 'out';
  createdAt: Date;
  category: string;
  paymentMode: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#42a5f5', '#66bb6a', '#ffa726'];

export default function BookAnalyticsPage() {
  const { bookId } = useParams();
  const router = useRouter();
  const [user] = useAuthState(auth);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { formatCurrency } = useCurrency();

  const [bookName, setBookName] = useState('');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'1' | '7' | '30' | '90' | '365' | 'all'>('30');

  useEffect(() => {
    const fetchData = async () => {
      if (!bookId || typeof bookId !== 'string' || !user) return;

      try {
        setLoading(true);
        const bookRef = doc(db, 'books', bookId);
        const bookSnap = await getDoc(bookRef);

        if (bookSnap.exists()) {
          const data = bookSnap.data();
          if (data.userId !== user.uid) {
            router.push('/');
            return;
          }
          setBookName(data.name);
        } else {
          router.push('/');
          return;
        }

        const q = query(collection(db, `books/${bookId}/expenses`));
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
            category: data.category || 'General',
            paymentMode: data.paymentMode || 'Online',
          } as Expense;
        });

        setExpenses(expensesData.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()));
      } catch (e) {
        console.error("Error loading data:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [bookId, user, router]);

  const filteredExpenses = useMemo(() => {
    if (timeRange === 'all') return expenses;
    const now = new Date();
    const days = parseInt(timeRange, 10);
    const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    return expenses.filter(e => e.createdAt >= cutoff);
  }, [expenses, timeRange]);

  const stats = useMemo(() => {
    const totalIn = filteredExpenses.reduce((sum, e) => sum + (e.type === 'in' ? e.amount : 0), 0);
    const totalOut = filteredExpenses.reduce((sum, e) => sum + (e.type === 'out' ? e.amount : 0), 0);
    return {
      totalIn,
      totalOut,
      balance: totalIn - totalOut
    };
  }, [filteredExpenses]);

  const dailyData = useMemo(() => {
    const map = new Map<string, { date: string; income: number; expense: number }>();
    
    // Initialize last 30 days if range is 30
    if (timeRange !== 'all') {
      const days = parseInt(timeRange, 10);
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
        map.set(dateStr, { date: dateStr, income: 0, expense: 0 });
      }
    }

    filteredExpenses.forEach(e => {
      const dateStr = e.createdAt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
      const current = map.get(dateStr) || { date: dateStr, income: 0, expense: 0 };
      if (e.type === 'in') current.income += e.amount;
      else current.expense += e.amount;
      map.set(dateStr, current);
    });

    return Array.from(map.values());
  }, [filteredExpenses, timeRange]);

  const categoryData = useMemo(() => {
    const map = new Map<string, number>();
    const totalOut = filteredExpenses.reduce((sum, e) => sum + (e.type === 'out' ? e.amount : 0), 0);

    filteredExpenses.filter(e => e.type === 'out').forEach(e => {
      map.set(e.category, (map.get(e.category) || 0) + e.amount);
    });
    return Array.from(map.entries()).map(([name, value]) => ({ 
      name, 
      value,
      percentage: totalOut > 0 ? (value / totalOut) * 100 : 0
    }))
    .sort((a, b) => b.value - a.value);
  }, [filteredExpenses]);

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Skeleton variant="text" width={200} height={40} sx={{ mb: 3 }} />
        <Grid container spacing={3}>
          {[1, 2, 3].map(i => (
            <Grid size={{ xs: 12, md: 4 }} key={i}>
              <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 2 }} />
            </Grid>
          ))}
          <Grid size={{ xs: 12 }}>
            <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 2 }} />
          </Grid>
        </Grid>
      </Box>
    );
  }

  return (
    <Box sx={{ pb: 6, px: { xs: 2, md: 3 }, maxWidth: 1200, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, mt: 2, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton onClick={() => router.back()} size="small" sx={{ ml: -1 }}>
            <FiChevronLeft />
          </IconButton>
          <Typography variant="h5" fontWeight={700}>
            {bookName} Analytics
          </Typography>
        </Box>
        
        <ToggleButtonGroup
          value={timeRange}
          exclusive
          onChange={(_, val) => val && setTimeRange(val)}
          size="small"
          aria-label="time range"
          sx={{ 
            flexWrap: 'wrap',
            '& .MuiToggleButton-root': {
              px: { xs: 1, sm: 2 },
              py: 0.5,
              fontSize: { xs: '0.75rem', sm: '0.875rem' }
            }
          }}
        >
          <ToggleButton value="1" sx={{ textTransform: 'none' }}>1D</ToggleButton>
          <ToggleButton value="7" sx={{ textTransform: 'none' }}>7D</ToggleButton>
          <ToggleButton value="30" sx={{ textTransform: 'none' }}>30D</ToggleButton>
          <ToggleButton value="90" sx={{ textTransform: 'none' }}>90D</ToggleButton>
          <ToggleButton value="365" sx={{ textTransform: 'none' }}>1Y</ToggleButton>
          <ToggleButton value="all" sx={{ textTransform: 'none' }}>All</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card variant="outlined" sx={{ borderRadius: 3, borderLeft: '4px solid', borderColor: 'success.main', height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, color: 'success.main' }}>
                <FiTrendingUp />
                <Typography variant="subtitle2" fontWeight={600}>Total Income</Typography>
              </Box>
              <Typography variant="h4" fontWeight={700}>{formatCurrency(stats.totalIn)}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card variant="outlined" sx={{ borderRadius: 3, borderLeft: '4px solid', borderColor: 'error.main', height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, color: 'error.main' }}>
                <FiTrendingDown />
                <Typography variant="subtitle2" fontWeight={600}>Total Expense</Typography>
              </Box>
              <Typography variant="h4" fontWeight={700}>{formatCurrency(stats.totalOut)}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card variant="outlined" sx={{ borderRadius: 3, borderLeft: '4px solid', borderColor: 'primary.main', height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, color: 'primary.main' }}>
                <FiActivity />
                <Typography variant="subtitle2" fontWeight={600}>Net Balance</Typography>
              </Box>
              <Typography variant="h4" fontWeight={700} sx={{ color: stats.balance >= 0 ? 'success.main' : 'error.main' }}>
                {formatCurrency(stats.balance)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Charts */}
      {filteredExpenses.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 6, textAlign: 'center', borderRadius: 3 }}>
          <Typography color="text.secondary">No expense data found for the selected time range.</Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {/* Trend Chart */}
          <Grid size={{ xs: 12 }}>
            <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 }, borderRadius: 3 }}>
              <Typography variant="h6" fontWeight={600} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <FiActivity /> Spending & Income Trend
              </Typography>
              <Box sx={{ height: 350, width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailyData}>
                    <defs>
                      <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4caf50" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#4caf50" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f44336" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#f44336" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.palette.divider} />
                    <XAxis 
                      dataKey="date" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 12, fill: theme.palette.text.secondary }}
                      minTickGap={30}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 12, fill: theme.palette.text.secondary }}
                      tickFormatter={(val) => `\u20B9${val >= 1000 ? (val/1000).toFixed(1) + 'k' : val}`}
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: 8, border: 'none', boxShadow: theme.shadows[3] }}
                      formatter={(value: any) => [formatCurrency(Number(value) || 0), '']}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="income" 
                      stroke="#4caf50" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorIncome)" 
                      name="Income"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="expense" 
                      stroke="#f44336" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorExpense)" 
                      name="Expense"
                    />
                    <Legend verticalAlign="top" height={36}/>
                  </AreaChart>
                </ResponsiveContainer>
              </Box>
            </Paper>
          </Grid>

          {/* Category Breakdown */}
          <Grid size={{ xs: 12 }}>
            <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 }, borderRadius: 3 }}>
              <Typography variant="h6" fontWeight={600} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <FiTag /> Expenses by Category
              </Typography>
              
              <Grid container spacing={4} alignItems="center">
                <Grid size={{ xs: 12, md: 5 }}>
                  <Box sx={{ height: 300, position: 'relative' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryData}
                          cx="50%"
                          cy="50%"
                          innerRadius={70}
                          outerRadius={90}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {categoryData.map((_entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                          <Label 
                            value={formatCurrency(stats.totalOut)} 
                            position="center" 
                            style={{ 
                              fontSize: '18px', 
                              fontWeight: 'bold', 
                              fill: theme.palette.text.primary,
                              fontFamily: 'inherit'
                            }} 
                          />
                          <Label 
                            value="Total Spent" 
                            position="center" 
                            dy={20}
                            style={{ 
                              fontSize: '12px', 
                              fill: theme.palette.text.secondary,
                              fontFamily: 'inherit'
                            }} 
                          />
                        </Pie>
                        <Tooltip 
                          formatter={(value: any, name: string) => [
                            formatCurrency(Number(value) || 0), 
                            name
                          ]} 
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </Box>
                </Grid>

                <Grid size={{ xs: 12, md: 7 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {categoryData.length > 0 ? (
                      categoryData.map((item, index) => (
                        <Box key={item.name} sx={{ width: '100%' }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                              <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: COLORS[index % COLORS.length] }} />
                              <Typography variant="body2" fontWeight={500}>{item.name}</Typography>
                            </Box>
                            <Box sx={{ textAlign: 'right' }}>
                              <Typography variant="body2" fontWeight={600}>{formatCurrency(item.value)}</Typography>
                              <Typography variant="caption" color="text.secondary">{item.percentage.toFixed(1)}%</Typography>
                            </Box>
                          </Box>
                          <Box sx={{ width: '100%', height: 6, bgcolor: 'action.hover', borderRadius: 3, overflow: 'hidden' }}>
                            <Box 
                              sx={{ 
                                width: `${item.percentage}%`, 
                                height: '100%', 
                                bgcolor: COLORS[index % COLORS.length],
                                transition: 'width 1s ease-in-out'
                              }} 
                            />
                          </Box>
                        </Box>
                      ))
                    ) : (
                      <Typography color="text.secondary" textAlign="center">No expenses recorded yet.</Typography>
                    )}
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      )}
    </Box>
  );
}

