import { useCallback, useEffect, useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { collection, getDocs, query, limit, orderBy, where } from 'firebase/firestore';
import { auth, db } from '@/app/firebase';

export interface RecentTransaction {
  id: string;
  bookId: string;
  bookName: string;
  description: string;
  amount: number;
  type: 'in' | 'out';
  createdAt: Date;
  category: string;
}

interface UseRecentTransactionsReturn {
  transactions: RecentTransaction[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useRecentTransactions(maxPerBook: number = 5): UseRecentTransactionsReturn {
  const [user] = useAuthState(auth);
  const [transactions, setTransactions] = useState<RecentTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const booksQuery = query(
        collection(db, 'books'),
        where('userId', '==', user.uid)
      );
      const booksSnap = await getDocs(booksQuery);

      const allTransactions: RecentTransaction[] = [];

      await Promise.all(
        booksSnap.docs.map(async (bookDoc) => {
          const bookData = bookDoc.data();
          const bookName = bookData.name;
          
          const expensesQuery = query(
            collection(db, `books/${bookDoc.id}/expenses`),
            orderBy('createdAt', 'desc'),
            limit(maxPerBook)
          );
          
          const expensesSnap = await getDocs(expensesQuery);
          
          expensesSnap.docs.forEach((expDoc) => {
            const data = expDoc.data();
            const createdAt = data.createdAt?.toDate?.() ?? new Date();
            
            allTransactions.push({
              id: expDoc.id,
              bookId: bookDoc.id,
              bookName,
              description: data.description || '--',
              amount: data.amount || 0,
              type: data.type || 'out',
              createdAt,
              category: data.category || 'General',
            });
          });
        })
      );

      allTransactions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      setTransactions(allTransactions.slice(0, 20));
    } catch (err) {
      console.error('Error fetching recent transactions:', err);
      setError('Failed to load recent transactions.');
    } finally {
      setLoading(false);
    }
  }, [user, maxPerBook]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'expenses-updated') {
        fetchTransactions();
      }
    };

    const handleCustomEvent = () => {
      fetchTransactions();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('expenses-updated', handleCustomEvent);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('expenses-updated', handleCustomEvent);
    };
  }, [fetchTransactions]);

  return {
    transactions,
    loading,
    error,
    refetch: fetchTransactions,
  };
}