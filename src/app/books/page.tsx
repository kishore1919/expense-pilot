'use client';

import React, { useState, useEffect } from 'react';
import { FiArrowRight, FiPlus, FiSearch, FiTrash2 } from 'react-icons/fi';
import { FaBook } from 'react-icons/fa';
import { Button, TextField, InputAdornment, Box, Typography, Alert, IconButton } from '@mui/material';
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
    <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-primary-container text-on-primary-container">
      <FaBook className="text-3xl" />
    </div>
    <h2 className="section-title">No books yet</h2>
    <p className="mt-2 max-w-sm text-on-surface-variant">Create your first expense book to start tracking spending with structure.</p>
    <Button 
      variant="contained" 
      onClick={onCreate} 
      startIcon={<FiPlus />}
      sx={{ mt: 4, borderRadius: '100px' }}
    >
      Create Your First Book
    </Button>
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
        <Alert severity="error" sx={{ borderRadius: '16px' }}>{error}</Alert>
      )}

      {books.length > 0 && (
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: 'center', justifyContent: 'space-between' }}>
          <TextField
            placeholder="Search books..."
            variant="outlined"
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ 
              maxWidth: { xs: '100%', sm: '384px' }, 
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
          <Button 
            variant="contained" 
            fullWidth={false}
            onClick={() => setIsModalOpen(true)} 
            startIcon={<FiPlus />}
            sx={{ borderRadius: '100px', width: { xs: '100%', sm: 'auto' }, whiteSpace: 'nowrap' }}
          >
            Create New Book
          </Button>
        </Box>
      )}

      {filteredBooks.length > 0 ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredBooks.map((book) => (
            <Card key={book.id} className="group relative p-5 transition hover:-translate-y-0.5 hover:bg-surface-container">
              <div
                onClick={() => handleBookClick(book.id)}
                className="cursor-pointer"
              >
                <div className="mb-4 flex items-center">
                  <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-[18px] bg-primary-container text-xl text-on-primary-container">
                    <FaBook />
                  </div>
                  <div className="flex-1 min-w-0">
                    <Typography variant="h6" fontWeight="600" noWrap>{book.name}</Typography>
                    <Typography variant="body2" color="text.secondary">Created {book.createdAt}</Typography>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm font-medium text-primary">
                  <span>Open details</span>
                  <FiArrowRight className="transition group-hover:translate-x-1 group-hover:text-primary" />
                </div>
              </div>

              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity flex gap-2">
                <IconButton
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteBook(book.id);
                  }}
                  size="small"
                  sx={{ 
                    backgroundColor: 'error.container', 
                    color: 'on-error-container',
                    '&:hover': { backgroundColor: 'error.container', filter: 'brightness(0.95)' },
                    borderRadius: '8px'
                  }}
                  title="Delete book"
                  aria-label={`Delete ${book.name}`}
                >
                  <FiTrash2 size={18} />
                </IconButton>
              </div>
            </Card>
          ))}
        </div>
      ) : books.length > 0 ? (
        <Card className="py-14 text-center">
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>No books match your search.</Typography>
          <Button 
            variant="outlined" 
            onClick={() => setSearchQuery('')}
            sx={{ borderRadius: '100px' }}
          >
            Clear search
          </Button>
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
