'use client';

import React, { useState, useEffect } from 'react';
import {
  FiPlus,
  FiSearch,
  FiTrash2,
  FiArrowRight,
  FiEdit2,
  FiCopy,
  FiUserPlus,
  FiChevronDown
} from 'react-icons/fi';
import { FaBook } from 'react-icons/fa';
import {
  Button,
  TextField,
  InputAdornment,
  Box,
  Typography,
  Alert,
  IconButton,
  Skeleton,
  Paper,
  Container,
  Chip,
  MenuItem,
  Select,
  FormControl,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import { collection, getDocs, addDoc, deleteDoc, doc, query, orderBy, writeBatch } from "firebase/firestore";
import { db } from '../firebase';
import { useRouter } from 'next/navigation';
import AddBookModal from '../components/AddBookModal';
import { useCurrency } from '../context/CurrencyContext';

interface Book {
  id: string;
  name: string;
  createdAt?: any;
  updatedAtString?: string; // Mapped for UI display
  netBalance?: number; // Calculated net balance from expenses
}

// Skeleton loader for list rows
const ListSkeleton = () => (
  <Paper elevation={0} sx={{ p: 2, mb: 2, border: (theme) => `1px solid ${theme.palette.mode === 'dark' ? '#334155' : '#f0f0f0'}`, display: 'flex', alignItems: 'center', gap: 2 }}>
    <Skeleton variant="circular" width={40} height={40} />
    <Box sx={{ flex: 1 }}>
      <Skeleton variant="text" width="40%" height={24} />
      <Skeleton variant="text" width="20%" height={16} />
    </Box>
    <Skeleton variant="text" width="10%" height={24} />
    <Skeleton variant="rectangular" width={100} height={30} />
  </Paper>
);

const SUGGESTIONS = ['February Expenses', 'Home Expense', 'Project Book', 'Account Book'];

export default function BooksPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'last-updated' | 'name'>('last-updated');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
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
      
      // Fetch books with their net balances
      const booksData = await Promise.all(
        querySnapshot.docs.map(async (bookDoc) => {
          const bookData = bookDoc.data();
          
          // Fetch expenses for this book to calculate net balance
          const expensesSnapshot = await getDocs(collection(db, `books/${bookDoc.id}/expenses`));
          let netBalance = 0;
          
          expensesSnapshot.docs.forEach((expenseDoc) => {
            const expenseData = expenseDoc.data();
            const amount = expenseData.amount || 0;
            if (expenseData.type === 'in') {
              netBalance += amount;
            } else {
              netBalance -= amount;
            }
          });
          
          return {
            id: bookDoc.id,
            name: bookData.name,
            createdAt: bookData.createdAt,
            updatedAtString: 'Updated recently',
            netBalance
          };
        })
      );
      
      setBooks(booksData);
      setError(null);
    } catch (error) {
      console.error("Error fetching books:", error);
      setError("Failed to load books.");
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
      
      setBooks([{ id: docRef.id, name: bookName, updatedAtString: 'Just now', netBalance: 0 }, ...books]);
      setIsModalOpen(false);
    } catch (e) {
      console.error("Error adding document: ", e);
      setError("Failed to create book.");
    }
  };

  const handleDeleteBook = (bookId: string) => {
    // Open confirm dialog instead of using window.confirm()
    setDeleteTarget(bookId);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    const id = deleteTarget;
    try {
      // Delete expenses in the book in chunks to avoid Firestore batch limits
      const expensesSnap = await getDocs(collection(db, `books/${id}/expenses`));
      const expenseDocs = expensesSnap.docs;
      const chunkSize = 499; // keep below 500 per batch

      for (let i = 0; i < expenseDocs.length; i += chunkSize) {
        const batch = writeBatch(db);
        const chunk = expenseDocs.slice(i, i + chunkSize);
        chunk.forEach(d => batch.delete(doc(db, `books/${id}/expenses`, d.id)));
        await batch.commit();
      }

      // Delete the book document itself (in its own operation)
      await deleteDoc(doc(db, 'books', id));

      setBooks(prev => prev.filter(b => b.id !== id));
      setError(null);
    } catch (e) {
      console.error('Error deleting book:', e);
      const msg = e instanceof Error ? e.message : String(e);
      setError(`Failed to delete book: ${msg}`);
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  const handleBookClick = (bookId: string) => {
    router.push(`/book/${bookId}`);
  };

  const filteredAndSortedBooks = React.useMemo(() => {
    let result = books.filter(book =>
      book.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    if (sortBy === 'name') {
      result = [...result].sort((a, b) => a.name.localeCompare(b.name));
    }
    // 'last-updated' is already handled by the orderBy query in fetchBooks
    
    return result;
  }, [books, searchQuery, sortBy]);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      
      {/* --- Top Controls Section --- */}
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', md: 'row' }, 
        gap: 2, 
        mb: 4, 
        alignItems: 'center' 
      }}>
        
        {/* Search Bar */}
        <TextField
          placeholder="Search by book name..."
          size="small"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ 
            flex: 1, 
            width: '100%',
            '& .MuiOutlinedInput-root': { bgcolor: (theme) => theme.palette.mode === 'dark' ? '#0F172A' : 'white' } 
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <FiSearch color="#888" />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <Box sx={{ 
                  border: (theme) => `1px solid ${theme.palette.mode === 'dark' ? '#475569' : '#ddd'}`, 
                  borderRadius: 1, 
                  px: 1, 
                  color: (theme) => theme.palette.mode === 'dark' ? '#94A3B8' : '#888', 
                  fontSize: '0.75rem',
                  bgcolor: (theme) => theme.palette.mode === 'dark' ? '#0B1220' : '#f9f9f9'
                }}>
                  /
                </Box>
              </InputAdornment>
            ),
          }}
        />

        {/* Sort Dropdown */}
        <FormControl size="small" sx={{ minWidth: 200, display: { xs: 'none', sm: 'block' } }}>
          <Select
            value={sortBy}
            displayEmpty
            sx={{ bgcolor: (theme) => theme.palette.mode === 'dark' ? '#0F172A' : 'white' }}
            onChange={(e) => setSortBy(e.target.value as 'last-updated' | 'name')}
            renderValue={(selected) => {
              if (selected === 'last-updated') return 'Sort By: Last Updated';
              if (selected === 'name') return 'Sort By: Name';
              return selected;
            }}
          >
            <MenuItem value="last-updated">Sort By: Last Updated</MenuItem>
            <MenuItem value="name">Sort By: Name</MenuItem>
          </Select>
        </FormControl>

        {/* Add Button */}
        <Button
          variant="contained"
          onClick={() => setIsModalOpen(true)}
          startIcon={<FiPlus />}
          sx={{ 
            height: 40, 
            px: 3, 
            bgcolor: '#4361EE', // Matches the specific blue in screenshot
            textTransform: 'none',
            fontWeight: 600,
            whiteSpace: 'nowrap',
            '&:hover': { bgcolor: '#3651d4' }
          }}
        >
          Add New Book
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {/* --- Books List --- */}
      <Box sx={{ minHeight: 300 }}>
        {loading ? (
          [1, 2, 3].map((i) => <ListSkeleton key={i} />)
        ) : filteredAndSortedBooks.length > 0 ? (
          filteredAndSortedBooks.map((book) => (
            <Paper
              key={book.id}
              elevation={0}
              sx={{
                p: 2,
                mb: 2,
                borderRadius: 2,
                border: (theme) => `1px solid ${theme.palette.mode === 'dark' ? 'transparent' : 'transparent'}`,
                display: 'flex',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 2,
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': (theme) => ({
                  bgcolor: theme.palette.mode === 'dark' ? '#0B1220' : '#f8f9fc',
                  borderColor: theme.palette.mode === 'dark' ? '#334155' : '#e0e0e0',
                })
              }}
              onClick={() => handleBookClick(book.id)}
            >
              {/* Icon */}
              <Box sx={{ 
                width: 48, 
                height: 48, 
                borderRadius: '50%', 
                bgcolor: (theme) => theme.palette.mode === 'dark' ? '#0F172A' : '#eef2ff', 
                color: '#4361EE',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center' 
              }}>
                <FaBook size={20} />
              </Box>

              {/* Title & Date */}
              <Box sx={{ flex: 1, minWidth: 150 }}>
                <Typography variant="subtitle1" fontWeight={600} color="text.primary">
                  {book.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {book.updatedAtString}
                </Typography>
              </Box>

              {/* Net Balance */}
              <Box sx={{ textAlign: 'right', mr: 2, display: { xs: 'none', sm: 'block' } }}>
                <Typography
                  variant="h6"
                  fontWeight={600}
                  color={(book.netBalance ?? 0) >= 0 ? '#00a86b' : '#d32f2f'}
                >
                  {formatCurrency(Math.abs(book.netBalance ?? 0))}
                </Typography>
              </Box>

              {/* Actions */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }} onClick={(e) => e.stopPropagation()}>
                <IconButton 
                  onClick={(e) => {
                     e.stopPropagation();
                     setDeleteTarget(book.id);
                  }}
                  size="small" 
                  color="error"
                >
                  <FiTrash2 size={18} />
                </IconButton>
                <IconButton 
                  onClick={() => handleBookClick(book.id)}
                  size="small" 
                  sx={{ color: '#d32f2f' }} // Red arrow from screenshot (or keep standard)
                >
                  <FiArrowRight size={18} />
                </IconButton>
              </Box>
            </Paper>
          ))
        ) : (
          <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
            <Typography variant="h6">No books found</Typography>
            <Typography variant="body2">Try searching for something else</Typography>
          </Box>
        )}
      </Box>

      {/* --- Quick Add / Suggestions Section --- */}
      <Paper elevation={0} sx={{ 
        p: 3, 
        mt: 4, 
        border: (theme) => `1px solid ${theme.palette.mode === 'dark' ? '#334155' : '#f0f0f0'}` ,
        borderRadius: 2,
        display: 'flex',
        alignItems: { xs: 'flex-start', md: 'center' },
        gap: 3,
        flexDirection: { xs: 'column', md: 'row' },
        backgroundColor: (theme) => theme.palette.mode === 'dark' ? '#0F172A' : undefined
      }}>

        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
           <Box sx={{ 
             width: 48, 
             height: 48, 
             borderRadius: '50%', 
             bgcolor: (theme) => theme.palette.mode === 'dark' ? '#072018' : '#e8f5e9', 
             color: (theme) => theme.palette.mode === 'dark' ? '#6EE7B7' : '#2e7d32',
             display: 'flex', 
             alignItems: 'center', 
             justifyContent: 'center',
             flexShrink: 0
           }}>
             <img 
               src="https://cdn-icons-png.flaticon.com/512/2921/2921222.png" 
               alt="Add" 
               style={{ width: 24, height: 24, opacity: 0.8 }} 
             /> 
             {/* Alternatively use <FiPlus size={24} /> if no image asset */}
           </Box>
           <Box>
             <Typography variant="subtitle1" fontWeight={700}>Add New Book</Typography>
             <Typography variant="body2" color="text.secondary">Click to quickly add books for</Typography>
           </Box>
        </Box>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {SUGGESTIONS.map((suggestion) => (
            <Chip 
              key={suggestion} 
              label={suggestion} 
              onClick={() => handleAddBook(suggestion)}
              sx={{ 
                bgcolor: (theme) => theme.palette.mode === 'dark' ? '#0E1B2A' : '#eff2ff', 
                color: (theme) => theme.palette.mode === 'dark' ? '#7FB3FF' : '#4361EE', 
                fontWeight: 500,
                cursor: 'pointer',
                '&:hover': { bgcolor: (theme) => theme.palette.mode === 'dark' ? '#0B1522' : '#dde4ff' }
              }} 
            />
          ))}
        </Box>
      </Paper>

      <AddBookModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddBook={handleAddBook}
      />

      <Dialog
        open={deleteTarget !== null}
        onClose={() => !isDeleting && setDeleteTarget(null)}
      >
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this book and all its expenses? This cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)} disabled={isDeleting}>Cancel</Button>
          <Button onClick={handleConfirmDelete} color="error" autoFocus disabled={isDeleting}>
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}