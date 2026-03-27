'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  TextField,
  InputAdornment,
  Typography,
  Box,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Chip,
  Divider,
  IconButton,
  useMediaQuery,
  useTheme,
  CircularProgress,
} from '@mui/material';
import {
  FiSearch,
  FiX,
  FiBookOpen,
  FiActivity,
  FiCreditCard,
  FiClock,
} from 'react-icons/fi';
import { useGlobalSearch, SearchResults } from '@/app/hooks/useGlobalSearch';
import { useCurrencyStore } from '@/app/stores';

interface SearchModalProps {
  open: boolean;
  onClose: () => void;
}

function ResultSection({
  title,
  icon,
  items,
  onItemClick,
}: {
  title: string;
  icon: React.ReactNode;
  items: SearchResults[keyof SearchResults];
  onItemClick: () => void;
}) {
  if (items.length === 0) return null;

  return (
    <Box sx={{ mb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, px: 1 }}>
        {icon}
        <Typography variant="subtitle2" fontWeight={600} color="text.secondary">
          {title}
        </Typography>
      </Box>
      <List dense disablePadding>
        {items.map((item, index) => (
          <ListItemButton
            key={`${item.type}-${item.id}-${index}`}
            onClick={onItemClick}
            sx={{
              borderRadius: 1,
              py: 1.5,
              '&:hover': { bgcolor: 'action.hover' },
            }}
          >
            <ListItemText
              primary={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {'name' in item && (
                    <Typography variant="body2" fontWeight={500}>
                      {(item as { name: string }).name}
                    </Typography>
                  )}
                  {'description' in item && (
                    <Typography variant="body2" fontWeight={500}>
                      {(item as { description: string }).description}
                    </Typography>
                  )}
                  {'lender' in item && (
                    <Chip
                      label={(item as { lender: string }).lender}
                      size="small"
                      sx={{ height: 18, fontSize: '0.65rem' }}
                    />
                  )}
                </Box>
              }
              secondary={
                <Typography variant="caption" color="text.secondary">
                  {'bookName' in item && `Book: ${(item as { bookName: string }).bookName}`}
                  {'category' in item && (item as { category: string }).category}
                  {'billingCycle' in item && `${(item as { billingCycle: string }).billingCycle} • ${(item as { status: string }).status}`}
                </Typography>
              }
            />
          </ListItemButton>
        ))}
      </List>
    </Box>
  );
}

export default function SearchModal({ open, onClose }: SearchModalProps) {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { formatCurrency } = useCurrencyStore();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const { results, loading } = useGlobalSearch(query);

  useEffect(() => {
    if (open) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  // Keyboard shortcut to open search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleNavigate = useCallback((type: string, id: string) => {
    switch (type) {
      case 'book':
        router.push(`/book/${id}`);
        break;
      case 'transaction':
        const tx = results.transactions.find((t) => t.id === id);
        if (tx) router.push(`/book/${tx.bookId}`);
        break;
      case 'loan':
        router.push('/loans');
        break;
      case 'subscription':
        router.push('/subscriptions');
        break;
    }
    onClose();
  }, [router, results, onClose]);

  const hasResults = 
    results.books.length > 0 ||
    results.transactions.length > 0 ||
    results.loans.length > 0 ||
    results.subscriptions.length > 0;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={isMobile}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : 3,
          maxHeight: '70vh',
          mt: isMobile ? 0 : '10vh',
        },
      }}
      slotProps={{
        backdrop: { sx: { bgcolor: 'rgba(0,0,0,0.5)' } },
      }}
    >
      <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <TextField
          inputRef={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search books, transactions, loans, subscriptions..."
          fullWidth
          autoFocus
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <FiSearch size={20} color="inherit" style={{ opacity: 0.5 }} />
                </InputAdornment>
              ),
              endAdornment: query && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setQuery('')}>
                    <FiX size={16} />
                  </IconButton>
                </InputAdornment>
              ),
              sx: {
                fontSize: '1rem',
                '& input::placeholder': { opacity: 0.6 },
              },
            },
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              bgcolor: 'background.default',
              borderRadius: 2,
              '& fieldset': { border: 'none' },
            },
          }}
        />
      </Box>

      <DialogContent sx={{ p: 0, overflow: 'auto' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={24} />
          </Box>
        ) : !query.trim() ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">
              Start typing to search...
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Search across books, transactions, loans, and subscriptions
            </Typography>
          </Box>
        ) : !hasResults ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">No results found</Typography>
          </Box>
        ) : (
          <Box sx={{ px: 2, py: 1 }}>
            <ResultSection
              title="Books"
              icon={<FiBookOpen size={16} color="text.secondary" />}
              items={results.books}
              onItemClick={() => handleNavigate('book', results.books[0].id)}
            />

            {results.books.length > 0 && results.transactions.length > 0 && (
              <Divider sx={{ my: 1 }} />
            )}

            <ResultSection
              title="Transactions"
              icon={<FiActivity size={16} color="text.secondary" />}
              items={results.transactions}
              onItemClick={() => handleNavigate('transaction', results.transactions[0].id)}
            />

            {(results.transactions.length > 0) && (results.loans.length > 0 || results.subscriptions.length > 0) && (
              <Divider sx={{ my: 1 }} />
            )}

            <ResultSection
              title="Loans"
              icon={<FiCreditCard size={16} color="text.secondary" />}
              items={results.loans}
              onItemClick={() => handleNavigate('loan', results.loans[0].id)}
            />

            {results.loans.length > 0 && results.subscriptions.length > 0 && (
              <Divider sx={{ my: 1 }} />
            )}

            <ResultSection
              title="Subscriptions"
              icon={<FiClock size={16} color="text.secondary" />}
              items={results.subscriptions}
              onItemClick={() => handleNavigate('subscription', results.subscriptions[0].id)}
            />
          </Box>
        )}
      </DialogContent>

      <Box sx={{ p: 1.5, borderTop: '1px solid', borderColor: 'divider', bgcolor: 'background.default' }}>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box
            component="kbd"
            sx={{
              px: 0.75,
              py: 0.25,
              borderRadius: 1,
              bgcolor: 'action.hover',
              fontSize: '0.7rem',
              fontFamily: 'monospace',
            }}
          >
            ⌘K
          </Box>
          to open search
        </Typography>
      </Box>
    </Dialog>
  );
}