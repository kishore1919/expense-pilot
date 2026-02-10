'use client';

import React, { useState, useEffect } from 'react';
import { FiPlus, FiSearch, FiTrash2, FiArrowRight } from 'react-icons/fi';
import { FaBook } from 'react-icons/fa';
import {
  Button,
  TextField,
  InputAdornment,
  Box,
  Typography,
  Alert,
  Grid,
  Card,
  CardContent,
  IconButton,
  Skeleton,
} from '@mui/material';
import { collection, getDocs, addDoc, deleteDoc, doc, query, orderBy } from "firebase/firestore";
import { db } from '../firebase';
import { useRouter } from 'next/navigation';
import AddBookModal from '../components/AddBookModal';

interface Book {
  id: string;
  name: string;
  createdAt?: string;
}

// Skeleton loader for book cards
const BookSkeleton = () => (
  <Card>
    <CardContent sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <Skeleton variant="rounded" width={48} height={48} />
        <Box sx={{ flex: 1 }}>
          <Skeleton variant="text" width="70%" height={24} />
          <Skeleton variant="text" width="50%" height={16} />
        </Box>
      </Box>
      <Skeleton variant="text" width="40%" height={20} />
    </CardContent>
  </Card>
);

const EmptyState = ({ onCreate }: { onCreate: () => void }) => (
  <Card
    sx={{
      textAlign: 'center',
      py: 8,
      px: 3,
      border: '2px dashed',
      borderColor: 'divider',
      bgcolor: 'transparent',
    }}
  >
    <CardContent>
      <Box
        sx={{
          width: 80,
          height: 80,
          borderRadius: 3,
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mx: 'auto',
          mb: 3,
        }}
      >
        <FaBook size={32} />
      </Box>
      <Typography variant="h5" gutterBottom fontWeight={600}>
        No books yet
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 400, mx: 'auto' }}>
        Create your first expense book to start tracking spending with structure.
      </Typography>
      <Button
        variant="contained"
        onClick={onCreate}
        startIcon={<FiPlus />}
        size="large"
      >
        Create Your First Book
      </Button>
    </CardContent>
  </Card>
);

export default function BooksPage() {
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
    if (!confirm('Are you sure you want to delete this book? All expenses will be lost.')) return;
    
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

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={600} gutterBottom>
          My Books
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage and organize all your expense books.
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Search and Actions */}
      {books.length > 0 && (
        <Box sx={{ display: 'flex', gap: 2, mb: 4, flexWrap: 'wrap' }}>
          <TextField
            placeholder="Search books..."
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ flex: 1, minWidth: 200 }}
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
            onClick={() => setIsModalOpen(true)}
            startIcon={<FiPlus />}
          >
            Create New Book
          </Button>
        </Box>
      )}

      {/* Books Grid */}
      {loading ? (
        <Grid container spacing={3}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Grid size={{ xs: 12, md: 6, lg: 4 }} key={i}>
              <BookSkeleton />
            </Grid>
          ))}
        </Grid>
      ) : filteredBooks.length > 0 ? (
        <Grid container spacing={3}>
          {filteredBooks.map((book) => (
            <Grid size={{ xs: 12, md: 6, lg: 4 }} key={book.id}>
              <Card
                sx={{
                  position: 'relative',
                  transition: 'transform 200ms ease, box-shadow 200ms ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: 3,
                  },
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box
                    onClick={() => handleBookClick(book.id)}
                    sx={{ cursor: 'pointer' }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Box
                        sx={{
                          width: 48,
                          height: 48,
                          borderRadius: 2,
                          bgcolor: 'primary.main',
                          color: 'primary.contrastText',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mr: 2,
                        }}
                      >
                        <FaBook size={20} />
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="h6" noWrap fontWeight={600}>
                          {book.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Created {book.createdAt}
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Typography
                        variant="button"
                        color="primary"
                        sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                      >
                        Open <FiArrowRight />
                      </Typography>
                    </Box>
                  </Box>

                  <IconButton
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteBook(book.id);
                    }}
                    size="small"
                    sx={{
                      position: 'absolute',
                      top: 12,
                      right: 12,
                      color: 'text.secondary',
                      bgcolor: 'action.hover',
                      '&:hover': {
                        bgcolor: 'error.main',
                        color: 'error.contrastText',
                      },
                    }}
                    title="Delete book"
                    aria-label={`Delete ${book.name}`}
                  >
                    <FiTrash2 size={16} />
                  </IconButton>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : books.length > 0 ? (
        <Card sx={{ textAlign: 'center', py: 6 }}>
          <CardContent>
            <Typography color="text.secondary" gutterBottom>
              No books match your search.
            </Typography>
            <Button
              variant="outlined"
              onClick={() => setSearchQuery('')}
            >
              Clear search
            </Button>
          </CardContent>
        </Card>
      ) : (
        <EmptyState onCreate={() => setIsModalOpen(true)} />
      )}

      <AddBookModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddBook={handleAddBook}
      />
    </Box>
  );
}
