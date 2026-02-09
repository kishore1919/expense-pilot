'use client';

import React, { useState, useEffect } from 'react';
import { FiArrowRight, FiPlus, FiSearch, FiTrash2 } from 'react-icons/fi';
import { FaBook } from 'react-icons/fa';
import { collection, getDocs, addDoc, deleteDoc, doc, query, orderBy } from "firebase/firestore";
import { db } from '../firebase';
import { useRouter } from 'next/navigation';
import AddBookModal from '../components/AddBookModal';
import Loading from '../components/Loading';
import Card from '../components/Card';

interface Book {
  id: string;
  name: string;
  createdAt?: string;
}

const EmptyState = ({ onCreate }: { onCreate: () => void }) => (
  <div className="empty-state">
    <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-teal-100 text-teal-700">
      <FaBook className="text-3xl" />
    </div>
    <h2 className="section-title">No books yet</h2>
    <p className="mt-2 max-w-sm text-slate-600">Create your first expense book to start tracking spending with structure.</p>
    <button onClick={onCreate} className="btn-primary mt-7">
      <FiPlus /> Create Your First Book
    </button>
  </div>
);

const BooksPage = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
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
    } catch (error) {
      console.error("Error fetching books:", error);
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
      setError("Failed to create book. Please check your connection and try again.");
    }
  };

  const handleDeleteBook = async (bookId: string) => {
    if (!confirm('Are you sure you want to delete this book?')) return;
    
    try {
      await deleteDoc(doc(db, 'books', bookId));
      setBooks(books.filter(book => book.id !== bookId));
    } catch (error) {
      console.error("Error deleting book:", error);
      setError("Failed to delete book. Please try again.");
    }
  };

  const handleBookClick = (bookId: string) => {
    router.push(`/book/${bookId}`);
  };

  const filteredBooks = books.filter(book => 
    book.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="space-y-8">
      <header className="surface-card p-6 md:p-8">
        <h1 className="page-title">My Books</h1>
        <p className="page-subtitle">Manage and organize all your expense books.</p>
      </header>

      {error && (
        <div className="status-error">
          {error}
        </div>
      )}

      {books.length > 0 && (
        <div className="surface-card flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:w-96">
            <input
              type="text"
              placeholder="Search books..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-field pl-11"
            />
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>
          <button onClick={() => setIsModalOpen(true)} className="btn-primary w-full whitespace-nowrap sm:w-auto">
            <FiPlus /> Create New Book
          </button>
        </div>
      )}

      {filteredBooks.length > 0 ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredBooks.map((book) => (
            <Card key={book.id} className="group relative p-5 transition hover:-translate-y-0.5 hover:bg-white/90">
              <div
                onClick={() => handleBookClick(book.id)}
                className="cursor-pointer"
              >
                <div className="mb-4 flex items-center">
                  <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-xl bg-teal-100 text-xl text-teal-700">
                    <FaBook />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="truncate text-lg font-semibold text-slate-900">{book.name}</h3>
                    <p className="text-sm text-slate-500">Created {book.createdAt}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm font-medium text-slate-600">
                  <span>Open details</span>
                  <FiArrowRight className="transition group-hover:translate-x-1 group-hover:text-teal-700" />
                </div>
              </div>

              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteBook(book.id);
                  }}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-700 transition hover:bg-red-100"
                  title="Delete book"
                >
                  <FiTrash2 />
                </button>
              </div>
            </Card>
          ))}
        </div>
      ) : books.length > 0 ? (
        <Card className="py-14 text-center">
          <p className="text-lg text-slate-600">No books match your search.</p>
          <button onClick={() => setSearchQuery('')} className="btn-secondary mt-4">
            Clear search
          </button>
        </Card>
      ) : (
        <EmptyState onCreate={() => setIsModalOpen(true)} />
      )}

      <AddBookModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onAddBook={handleAddBook} 
      />
    </div>
  );
};

export default BooksPage;
