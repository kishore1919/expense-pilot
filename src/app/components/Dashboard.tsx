'use client';

import React, { useState, useEffect } from 'react';
import { FiArrowRight, FiBookOpen, FiClock, FiPlus, FiSearch } from 'react-icons/fi';
import { FaBook } from 'react-icons/fa';
import { Button, TextField, InputAdornment, Box, Typography, Alert } from '@mui/material';
import Card from './Card';
import AddBookModal from './AddBookModal';
import Loading from './Loading';
import { collection, addDoc, getDocs, query, orderBy } from "firebase/firestore";
import { useCurrency } from '../context/CurrencyContext';
import { db } from '../firebase';
import { useRouter } from 'next/navigation';

interface Book {
  id: string;
  name: string;
  createdAt?: string;
  // Preserve the raw createdAt date for accurate metrics (month/year checks)
  createdAtRaw?: Date | null;
  net?: number;
}

const EmptyState = ({ setIsModalOpen }: { setIsModalOpen: (isOpen: boolean) => void }) => (
  <div className="empty-state">
    <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-primary-container text-on-primary-container">
      <FaBook className="text-3xl" />
    </div>
    <h2 className="section-title">No expense books yet</h2>
    <p className="mt-2 max-w-sm text-on-surface-variant">
      Create your first book to organize expenses by goal, trip, or monthly budget.
    </p>
    <Button 
      variant="contained" 
      onClick={() => setIsModalOpen(true)} 
      startIcon={<FiPlus />}
      sx={{ mt: 4, borderRadius: '100px' }}
    >
      Create Your First Book
    </Button>
  </div>
);

const Dashboard = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [books, setBooks] = useState<Book[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { formatCurrency } = useCurrency();

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'books'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);

      const booksData = await Promise.all(querySnapshot.docs.map(async (doc) => {
        const raw = doc.data().createdAt;
        const createdAtDate = raw?.toDate?.() ?? null;

        // Fetch expenses for this book to compute net balance
        const expensesSnap = await getDocs(collection(db, `books/${doc.id}/expenses`));
        let cashIn = 0;
        let cashOut = 0;

        expensesSnap.docs.forEach((ed) => {
          const data = ed.data() as any;
          if (data.type === 'in') cashIn += data.amount ?? 0;
          else cashOut += data.amount ?? 0;
        });

        return {
          id: doc.id,
          name: doc.data().name,
          createdAt: createdAtDate ? createdAtDate.toLocaleDateString() : 'Recently',
          createdAtRaw: createdAtDate,
          net: cashIn - cashOut,
        } as any;
      }));

      setBooks(booksData as Book[]);
      setError(null);
    } catch (e) {
      console.error("Error fetching books:", e);
      setError("Failed to load books. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddBook = async (bookName: string) => {
    try {
      const docRef = await addDoc(collection(db, 'books'), {
        name: bookName,
        createdAt: new Date(),
        userId: 'anonymous',
      });
      
      setBooks([{ id: docRef.id, name: bookName, createdAt: 'Just now' }, ...books]);
      setIsModalOpen(false);
      setError(null);
    } catch (e) {
      console.error("Error adding document: ", e);
      setError("Failed to create book. Please try again.");
    }
  };

  const handleBookClick = (bookId: string) => {
    router.push(`/book/${bookId}`);
  };

  const filteredBooks = books.filter((book) =>
    book.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="space-y-8">
      <header className="surface-card p-6 md:p-8">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
          {/* <div>
            <h1 className="page-title">Dashboard</h1>
            <p className="page-subtitle">Your books, activity, and quick actions in one place.</p>
          </div> */}
          <Button 
            variant="contained" 
            onClick={() => setIsModalOpen(true)} 
            startIcon={<FiPlus />}
            sx={{ borderRadius: '100px' }}
          >
            New Expense Book
          </Button>
        </div>
      </header>

      {error && (
        <Alert severity="error" sx={{ borderRadius: '16px' }}>
          {error}
        </Alert>
      )}

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <p className="text-sm font-medium text-on-surface-variant">Total Books</p>
          <p className="metric-value mt-2">{books.length}</p>
        </Card>
        <Card>
          <p className="text-sm font-medium text-on-surface-variant">Books This Month</p>
          <p className="metric-value mt-2">
            {(() => {
              const now = new Date();
              return books.filter((book) =>
                book.createdAtRaw instanceof Date &&
                book.createdAtRaw.getMonth() === now.getMonth() &&
                book.createdAtRaw.getFullYear() === now.getFullYear()
              ).length;
            })()}
          </p>
        </Card>
        <Card>
          <p className="text-sm font-medium text-on-surface-variant">Latest Update</p>
          <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-on-surface">
            <FiClock className="text-primary" />
            {books[0]?.createdAt ?? 'No activity yet'}
          </p>
        </Card>
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <section className="xl:col-span-2">
          <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="section-title">Your Expense Books</h2>
            {books.length > 0 && (
              <TextField
                placeholder="Search books..."
                variant="outlined"
                size="small"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                sx={{ 
                  maxWidth: '320px', 
                  width: '100%',
                  '& .MuiOutlinedInput-root': { borderRadius: '100px' } 
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <FiSearch />
                    </InputAdornment>
                  ),
                }}
              />
            )}
          </div>

          {books.length > 0 ? (
            filteredBooks.length > 0 ? (
              <div className="space-y-3">
                {filteredBooks.map((book) => (
                  <button
                    key={book.id}
                    onClick={() => handleBookClick(book.id)}
                    className="surface-card group flex w-full items-center justify-between p-4 text-left hover:bg-surface-container"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-primary-container text-xl text-on-primary-container">
                        <FaBook />
                      </div>
                      <div>
                        <p className="font-semibold text-on-surface">{book.name}</p>
                        <p className="text-sm text-on-surface-variant">Created {book.createdAt}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className={`font-semibold ${book.net && book.net >= 0 ? 'text-primary' : 'text-red-700'}`}>{book.net !== undefined ? formatCurrency(book.net) : ''}</div>
                      <FiArrowRight className="text-on-surface-variant transition group-hover:translate-x-1 group-hover:text-primary" />
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <Card className="text-center">
                <p className="text-on-surface-variant">No books match your search.</p>
                <Button 
                  onClick={() => setSearchQuery('')} 
                  variant="outlined"
                  sx={{ mt: 2, borderRadius: '100px' }}
                >
                  Clear search
                </Button>
              </Card>
            )
          ) : (
            <EmptyState setIsModalOpen={setIsModalOpen} />
          )}
        </section>

        <aside className="space-y-6">
          {/* <Card>
            <h3 className="section-title mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Button
                fullWidth
                variant="outlined"
                disabled
                startIcon={<FiPlus />}
                sx={{ justifyContent: 'flex-start', borderRadius: '16px' }}
              >
                Add New Transaction
              </Button>
              <Button 
                fullWidth
                variant="outlined"
                onClick={() => setIsModalOpen(true)} 
                startIcon={<FiBookOpen />}
                sx={{ justifyContent: 'flex-start', borderRadius: '16px' }}
              >
                Create New Expense Book
              </Button>
            </div>
          </Card> */}
          {/* <Card>
            <h3 className="section-title mb-1">Recent Activity <span className="ml-2 inline-block rounded-full bg-surface-container-highest px-2 py-0.5 text-xs font-medium text-on-surface-variant">Example</span></h3>
            <div className="text-xs text-on-surface-variant/70 mb-3">This section shows example entries. Replace with real activity data when available.</div>
            <div className="space-y-4 text-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-tertiary-container font-semibold text-on-tertiary-container">T</div>
                <div>
                  <p className="font-semibold text-on-surface">Added groceries expense</p>
                  <p className="text-on-surface-variant">2 hours ago</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary-container font-semibold text-on-secondary-container">B</div>
                <div>
                  <p className="font-semibold text-on-surface">Created a new expense book</p>
                  <p className="text-on-surface-variant">Yesterday</p>
                </div>
              </div>
            </div>
          </Card> */}
        </aside>
      </div>

      <AddBookModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onAddBook={handleAddBook} />
    </div>
  );
};

export default Dashboard;
