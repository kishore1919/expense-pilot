'use client';

import React, { useState, useEffect } from 'react';
import { FiArrowRight, FiBookOpen, FiClock, FiPlus, FiSearch } from 'react-icons/fi';
import { FaBook } from 'react-icons/fa';
import Card from './Card';
import AddBookModal from './AddBookModal';
import Loading from './Loading';
import { collection, addDoc, getDocs, query, orderBy } from "firebase/firestore";
import { db } from '../firebase';
import { useRouter } from 'next/navigation';

interface Book {
  id: string;
  name: string;
  createdAt?: string;
}

const EmptyState = ({ setIsModalOpen }: { setIsModalOpen: (isOpen: boolean) => void }) => (
  <div className="empty-state">
    <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-teal-100 text-teal-700">
      <FaBook className="text-3xl" />
    </div>
    <h2 className="section-title">No expense books yet</h2>
    <p className="mt-2 max-w-sm text-slate-600">
      Create your first book to organize expenses by goal, trip, or monthly budget.
    </p>
    <button onClick={() => setIsModalOpen(true)} className="btn-primary mt-7">
      <FiPlus className="text-base" /> Create Your First Book
    </button>
  </div>
);

const Dashboard = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [books, setBooks] = useState<Book[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'books'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const booksData = querySnapshot.docs.map(doc => ({ 
        id: doc.id, 
        name: doc.data().name,
        createdAt: doc.data().createdAt?.toDate?.().toLocaleDateString() || 'Recently'
      }));
      setBooks(booksData);
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
          <div>
            <h1 className="page-title">Dashboard</h1>
            <p className="page-subtitle">Your books, activity, and quick actions in one place.</p>
          </div>
          <button onClick={() => setIsModalOpen(true)} className="btn-primary w-full sm:w-auto">
            <FiPlus className="text-base" /> New Expense Book
          </button>
        </div>
      </header>

      {error && (
        <div className="status-error">
          {error}
        </div>
      )}

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <p className="text-sm text-slate-500">Total Books</p>
          <p className="metric-value mt-2">{books.length}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Books This Month</p>
          <p className="metric-value mt-2">
            {books.filter((book) => book.createdAt && book.createdAt !== 'Recently').length}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Latest Update</p>
          <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
            <FiClock className="text-teal-700" />
            {books[0]?.createdAt ?? 'No activity yet'}
          </p>
        </Card>
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <section className="xl:col-span-2">
          <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="section-title">Your Expense Books</h2>
            {books.length > 0 && (
              <div className="relative w-full sm:max-w-sm">
                <input
                  type="text"
                  placeholder="Search books..."
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="text-field pl-11"
                />
                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
            )}
          </div>

          {books.length > 0 ? (
            filteredBooks.length > 0 ? (
              <div className="space-y-3">
                {filteredBooks.map((book) => (
                  <button
                    key={book.id}
                    onClick={() => handleBookClick(book.id)}
                    className="surface-card group flex w-full items-center justify-between p-4 text-left transition hover:-translate-y-0.5 hover:bg-white/95"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-100 text-xl text-teal-700">
                        <FaBook />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{book.name}</p>
                        <p className="text-sm text-slate-500">Created {book.createdAt}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="hidden text-sm font-semibold text-slate-500 sm:inline">Open book</span>
                      <FiArrowRight className="text-slate-400 transition group-hover:translate-x-1 group-hover:text-teal-700" />
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <Card className="text-center">
                <p className="text-slate-600">No books match your search.</p>
                <button onClick={() => setSearchQuery('')} className="btn-secondary mt-4">
                  Clear search
                </button>
              </Card>
            )
          ) : (
            <EmptyState setIsModalOpen={setIsModalOpen} />
          )}
        </section>

        <aside className="space-y-6">
          <Card>
            <h3 className="section-title mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button className="btn-secondary w-full justify-start">
                <FiPlus /> Add New Transaction
              </button>
              <button onClick={() => setIsModalOpen(true)} className="btn-secondary w-full justify-start">
                <FiBookOpen /> Create New Expense Book
              </button>
            </div>
          </Card>
          <Card>
            <h3 className="section-title mb-4">Recent Activity</h3>
            <div className="space-y-4 text-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 font-semibold text-emerald-700">T</div>
                <div>
                  <p className="font-semibold text-slate-800">Added groceries expense</p>
                  <p className="text-slate-500">2 hours ago</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 font-semibold text-amber-700">B</div>
                <div>
                  <p className="font-semibold text-slate-800">Created a new expense book</p>
                  <p className="text-slate-500">Yesterday</p>
                </div>
              </div>
            </div>
          </Card>
        </aside>
      </div>

      <AddBookModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onAddBook={handleAddBook} />
    </div>
  );
};

export default Dashboard;
