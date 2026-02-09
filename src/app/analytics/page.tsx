'use client';

import React, { useState, useEffect } from 'react';
import { FiTrendingUp, FiTrendingDown, FiDollarSign, FiBook } from 'react-icons/fi';
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
      color: 'bg-red-100 text-red-700'
    },
    {
      title: 'Total Books',
      value: totalBooks,
      icon: FiBook,
      color: 'bg-cyan-100 text-cyan-700'
    },
    {
      title: 'Average Expense',
      value: formatCurrency(averageExpense),
      icon: FiTrendingUp,
      color: 'bg-emerald-100 text-emerald-700'
    },
    {
      title: 'Highest Expense',
      value: formatCurrency(highestExpense),
      icon: FiTrendingDown,
      color: 'bg-amber-100 text-amber-700'
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

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={index}>
            <div className="mb-4 flex items-center justify-between">
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${stat.color}`}>
                <stat.icon className="text-xl" />
              </div>
            </div>
            <p className="text-sm text-slate-500">{stat.title}</p>
            <p className="metric-value mt-2">{stat.value}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card className="p-7">
          <h2 className="section-title mb-6">Expense Overview</h2>
          <div className="space-y-5">
            <div>
              <div className="mb-2 flex justify-between text-sm">
                <span className="text-slate-600">Spending Activity</span>
                <span className="font-semibold text-slate-800">{totalExpenses > 0 ? 'Active' : 'No Activity'}</span>
              </div>
              <div className="h-3 w-full rounded-full bg-slate-200">
                <div
                  className="h-3 rounded-full bg-gradient-to-r from-teal-600 to-emerald-500 transition-all duration-500"
                  style={{ width: totalExpenses > 0 ? '65%' : '0%' }}
                />
              </div>
            </div>

            <div>
              <div className="mb-2 flex justify-between text-sm">
                <span className="text-slate-600">Book Organization</span>
                <span className="font-semibold text-slate-800">{totalBooks > 0 ? `${totalBooks} Books` : 'No Books'}</span>
              </div>
              <div className="h-3 w-full rounded-full bg-slate-200">
                <div
                  className="h-3 rounded-full bg-gradient-to-r from-cyan-500 to-sky-600 transition-all duration-500"
                  style={{ width: totalBooks > 0 ? Math.min(totalBooks * 20, 100) + '%' : '0%' }}
                />
              </div>
            </div>

            <div>
              <div className="mb-2 flex justify-between text-sm">
                <span className="text-slate-600">Budget Health</span>
                <span className="font-semibold text-slate-800">{totalExpenses > 0 ? 'Good' : 'N/A'}</span>
              </div>
              <div className="h-3 w-full rounded-full bg-slate-200">
                <div
                  className="h-3 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 transition-all duration-500"
                  style={{ width: '80%' }}
                />
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-7">
          <h2 className="section-title mb-6">Quick Insights</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-4 rounded-xl border border-slate-200 bg-white/70 p-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-teal-100 text-teal-700">
                <FiTrendingUp />
              </div>
              <div>
                <h3 className="mb-1 font-semibold text-slate-800">Spending Trend</h3>
                <p className="text-sm text-slate-600">
                  {totalExpenses > 0
                    ? `You've recorded ${formatCurrency(totalExpenses)} in total expenses across ${totalBooks} book${totalBooks !== 1 ? 's' : ''}.`
                    : 'Start adding expenses to see your spending trends.'
                  }
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 rounded-xl border border-slate-200 bg-white/70 p-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                <FiDollarSign />
              </div>
              <div>
                <h3 className="mb-1 font-semibold text-slate-800">Average Transaction</h3>
                <p className="text-sm text-slate-600">
                  {averageExpense > 0
                    ? `Your average expense is ${formatCurrency(averageExpense)} per transaction.`
                    : 'Add expenses to calculate your average transaction amount.'
                  }
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 rounded-xl border border-slate-200 bg-white/70 p-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                <FiTrendingDown />
              </div>
              <div>
                <h3 className="mb-1 font-semibold text-slate-800">Top Expense</h3>
                <p className="text-sm text-slate-600">
                  {highestExpense > 0
                    ? `Your highest single expense was ${formatCurrency(highestExpense)}.`
                    : 'No expenses recorded yet.'
                  }
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AnalyticsPage;
