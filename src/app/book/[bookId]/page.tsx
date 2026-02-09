'use client';

import React, { useState, useEffect } from 'react';
import { FiPlus, FiChevronLeft } from 'react-icons/fi';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, collection, getDocs, addDoc } from "firebase/firestore";
import { db } from '../../../app/firebase';
import AddExpenseModal from '../../components/AddExpenseModal';
import Loading from '../../components/Loading';
import Card from '../../components/Card';
import { useCurrency } from '../../context/CurrencyContext';

interface Expense {
  id: string;
  description: string;
  amount: number;
}

const BookDetailPage = () => {
  const router = useRouter();
  const { bookId } = useParams();
  const [bookName, setBookName] = useState('');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { formatCurrency } = useCurrency();

  useEffect(() => {
    const fetchBookDetails = async () => {
      if (!bookId) return;

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
        const expensesData = expensesQuery.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Expense));
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

  const handleAddExpense = async (expense: { description: string; amount: number }) => {
    if (!bookId) return;

    try {
      const docRef = await addDoc(collection(db, `books/${bookId}/expenses`), expense);
      setExpenses([...expenses, { id: docRef.id, ...expense }]);
      setIsModalOpen(false);
    } catch (e) {
      console.error("Error adding document: ", e);
    }
  };

  const totalExpense = expenses.reduce((sum, item) => sum + item.amount, 0);

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="space-y-6">
      <header className="surface-card flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between md:p-8">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="icon-button">
            <FiChevronLeft />
          </button>
          <div>
            <h1 className="page-title">{bookName}</h1>
            <p className="page-subtitle">
              {expenses.length} expense{expenses.length !== 1 ? 's' : ''} recorded
            </p>
          </div>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn-primary w-full md:w-auto">
          <FiPlus /> Add New Expense
        </button>
      </header>

      {error && (
        <div className="status-error">{error}</div>
      )}

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <p className="text-sm text-slate-500">Total Spent</p>
          <p className="metric-value mt-2 text-red-700">{formatCurrency(totalExpense)}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Entries</p>
          <p className="metric-value mt-2">{expenses.length}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Average Expense</p>
          <p className="metric-value mt-2">
            {formatCurrency(expenses.length ? totalExpense / expenses.length : 0)}
          </p>
        </Card>
      </section>

      <div className="surface-card overflow-hidden">
        <div className="border-b border-slate-200/70 px-6 py-4">
          <h2 className="section-title">Expenses</h2>
        </div>
        <div className="p-4 md:p-6">
          {expenses.length > 0 ? (
            <div className="space-y-3">
              {expenses.map((expense) => (
                <div key={expense.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white/75 px-4 py-3">
                  <span className="font-medium text-slate-800">{expense.description}</span>
                  <span className="text-lg font-semibold text-red-700">{formatCurrency(-expense.amount)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-10 text-center text-slate-600">No expenses yet. Add your first one.</div>
          )}
        </div>
      </div>

      <AddExpenseModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onAddExpense={handleAddExpense} />
    </div>
  );
};

export default BookDetailPage;
