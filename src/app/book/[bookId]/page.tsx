'use client';

import React, { useState, useEffect } from 'react';
import { FiPlus, FiChevronLeft, FiTrash2 } from 'react-icons/fi';
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
      // Store createdAt as Date object - Firestore will convert it to a timestamp
      const docRef = await addDoc(collection(db, `books/${bookId}/expenses`), expense);
      setExpenses([...expenses, { id: docRef.id, ...expense }]);
      setIsModalOpen(false);
    } catch (e) {
      console.error("Error adding document: ", e);
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    if (!bookId || typeof bookId !== 'string' || Array.isArray(bookId)) return;
    if (!window.confirm('Are you sure you want to delete this expense?')) return;

    try {
      await deleteDoc(doc(db, `books/${bookId}/expenses`, expenseId));
      setExpenses((prev) => prev.filter((e) => e.id !== expenseId));
    } catch (e) {
      console.error('Error deleting expense:', e);
    }
  };

  const cashIn = expenses.reduce((sum, item) => sum + (item.type === 'in' ? item.amount : 0), 0);
  const cashOut = expenses.reduce((sum, item) => sum + (item.type === 'out' ? item.amount : 0), 0);
  const totalExpense = cashOut;
  const netBalance = cashIn - cashOut;

  // Compute running balances per entry (ascending by date)
  const expensesAsc = [...expenses].sort((a, b) => (a.createdAt?.getTime() ?? 0) - (b.createdAt?.getTime() ?? 0));
  const runningBalances: Record<string, number> = {};
  let acc = 0;
  for (const e of expensesAsc) {
    acc += e.type === 'in' ? e.amount : -e.amount;
    runningBalances[e.id] = acc;
  }

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="space-y-6">
      <header className="surface-card flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between md:p-8">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="icon-button" aria-label="Back">
            <FiChevronLeft />
          </button>
          <div>
            <h1 className="page-title">{bookName}</h1>
            <p className="page-subtitle">
              {expenses.length} expense{expenses.length !== 1 ? 's' : ''} recorded
            </p>
          </div>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button onClick={() => { setModalInitialType('in'); setIsModalOpen(true); }} className="btn-success w-full md:w-auto">
            + Cash In
          </button>
          <button onClick={() => { setModalInitialType('out'); setIsModalOpen(true); }} className="btn-danger w-full md:w-auto">
            - Cash Out
          </button>
        </div>
      </header>

      {error && (
        <div className="status-error">{error}</div>
      )}

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <p className="text-sm text-slate-500">Cash In</p>
          <p className="metric-value mt-2 text-green-700">{formatCurrency(cashIn)}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Cash Out</p>
          <p className="metric-value mt-2 text-red-700">{formatCurrency(cashOut)}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Net Balance</p>
          <p className={`metric-value mt-2 ${netBalance >= 0 ? 'text-green-700' : 'text-red-700'}`}>{formatCurrency(netBalance)}</p>
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
                  <div className="flex items-center gap-4">
                    <span className="font-medium text-slate-800">{expense.description}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`text-lg font-semibold ${expense.type === 'out' ? 'text-red-700' : 'text-green-700'}`}>
                      {expense.type === 'out' ? formatCurrency(-expense.amount) : formatCurrency(expense.amount)}
                    </span>
                    <button
                      onClick={() => handleDeleteExpense(expense.id)}
                      className="icon-button text-red-600 hover:text-red-800"
                      aria-label={`Delete expense ${expense.description}`}
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-10 text-center text-slate-600">No expenses yet. Add your first one.</div>
          )}
        </div>
      </div>

      <AddExpenseModal isOpen={isModalOpen} initialType={modalInitialType} onClose={() => { setIsModalOpen(false); setModalInitialType(undefined); }} onAddExpense={handleAddExpense} />
    </div>
  );
};

export default BookDetailPage;
