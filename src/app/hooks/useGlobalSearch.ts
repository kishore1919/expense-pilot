import { useCallback, useEffect, useState, useMemo } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { collection, getDocs, query, where, limit, orderBy } from 'firebase/firestore';
import { auth, db } from '@/app/firebase';

export interface SearchResultBook {
  type: 'book';
  id: string;
  name: string;
  netBalance?: number;
  archived?: boolean;
}

export interface SearchResultTransaction {
  type: 'transaction';
  id: string;
  bookId: string;
  bookName: string;
  description: string;
  amount: number;
  typeTx: 'in' | 'out';
  createdAt: Date;
  category: string;
}

export interface SearchResultLoan {
  type: 'loan';
  id: string;
  name: string;
  lender: string;
  amount: number;
  paidAmount: number;
  isActive: boolean;
}

export interface SearchResultSubscription {
  type: 'subscription';
  id: string;
  name: string;
  amount: number;
  billingCycle: string;
  category: string;
  status: string;
}

export type SearchResult = 
  | SearchResultBook 
  | SearchResultTransaction 
  | SearchResultLoan 
  | SearchResultSubscription;

export interface SearchResults {
  books: SearchResultBook[];
  transactions: SearchResultTransaction[];
  loans: SearchResultLoan[];
  subscriptions: SearchResultSubscription[];
}

interface UseGlobalSearchReturn {
  results: SearchResults;
  loading: boolean;
  error: string | null;
}

const MAX_ITEMS_PER_TYPE = 5;

export function useGlobalSearch(searchQuery: string): UseGlobalSearchReturn {
  const [user] = useAuthState(auth);
  const [books, setBooks] = useState<SearchResultBook[]>([]);
  const [transactions, setTransactions] = useState<SearchResultTransaction[]>([]);
  const [loans, setLoans] = useState<SearchResultLoan[]>([]);
  const [subscriptions, setSubscriptions] = useState<SearchResultSubscription[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!user || !searchQuery.trim()) {
      setBooks([]);
      setTransactions([]);
      setLoans([]);
      setSubscriptions([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch books
      const booksQuery = query(
        collection(db, 'books'),
        where('userId', '==', user.uid),
        limit(50)
      );
      const booksSnap = await getDocs(booksQuery);
      const booksData: SearchResultBook[] = [];
      const bookIds: string[] = [];

      booksSnap.docs.forEach((doc) => {
        const data = doc.data();
        booksData.push({
          type: 'book',
          id: doc.id,
          name: data.name,
          netBalance: data.netBalance,
          archived: data.archived,
        });
        bookIds.push(doc.id);
      });

      // Fetch recent transactions from all books
      const transactionsData: SearchResultTransaction[] = [];
      await Promise.all(
        bookIds.map(async (bookId) => {
          const book = booksData.find(b => b.id === bookId);
          const txQuery = query(
            collection(db, `books/${bookId}/expenses`),
            orderBy('createdAt', 'desc'),
            limit(20)
          );
          const txSnap = await getDocs(txQuery);
          txSnap.docs.forEach((doc) => {
            const data = doc.data();
            transactionsData.push({
              type: 'transaction',
              id: doc.id,
              bookId,
              bookName: book?.name || 'Unknown',
              description: data.description || '',
              amount: data.amount || 0,
              typeTx: data.type || 'out',
              createdAt: data.createdAt?.toDate?.() || new Date(),
              category: data.category || 'General',
            });
          });
        })
      );

      // Fetch loans
      const loansQuery = query(
        collection(db, 'loans'),
        where('userId', '==', user.uid),
        limit(50)
      );
      const loansSnap = await getDocs(loansQuery);
      const loansData: SearchResultLoan[] = loansSnap.docs.map((doc) => {
        const data = doc.data();
        return {
          type: 'loan',
          id: doc.id,
          name: data.name || '',
          lender: data.lender || '',
          amount: data.amount || 0,
          paidAmount: data.paidAmount || 0,
          isActive: data.isActive ?? true,
        };
      });

      // Fetch subscriptions
      const subsQuery = query(
        collection(db, 'subscriptions'),
        where('userId', '==', user.uid),
        limit(50)
      );
      const subsSnap = await getDocs(subsQuery);
      const subsData: SearchResultSubscription[] = subsSnap.docs.map((doc) => {
        const data = doc.data();
        return {
          type: 'subscription',
          id: doc.id,
          name: data.name || '',
          amount: data.amount || 0,
          billingCycle: data.billingCycle || 'monthly',
          category: data.category || 'General',
          status: data.status || 'active',
        };
      });

      setBooks(booksData);
      setTransactions(transactionsData);
      setLoans(loansData);
      setSubscriptions(subsData);
    } catch (err) {
      console.error('Error fetching search data:', err);
      setError('Failed to load search results');
    } finally {
      setLoading(false);
    }
  }, [user, searchQuery]);

  // Debounced data fetch
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchData]);

  // Filter results based on search query
  const filteredResults = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) {
      return { books: [], transactions: [], loans: [], subscriptions: [] };
    }

    const filteredBooks = books
      .filter((book) => book.name.toLowerCase().includes(query))
      .slice(0, MAX_ITEMS_PER_TYPE);

    const filteredTransactions = transactions
      .filter((tx) =>
        tx.description.toLowerCase().includes(query) ||
        tx.category.toLowerCase().includes(query) ||
        tx.amount.toString().includes(query)
      )
      .slice(0, MAX_ITEMS_PER_TYPE);

    const filteredLoans = loans
      .filter((loan) =>
        loan.name.toLowerCase().includes(query) ||
        loan.lender.toLowerCase().includes(query) ||
        loan.amount.toString().includes(query)
      )
      .slice(0, MAX_ITEMS_PER_TYPE);

    const filteredSubscriptions = subscriptions
      .filter((sub) =>
        sub.name.toLowerCase().includes(query) ||
        sub.category.toLowerCase().includes(query) ||
        sub.amount.toString().includes(query)
      )
      .slice(0, MAX_ITEMS_PER_TYPE);

    return {
      books: filteredBooks,
      transactions: filteredTransactions,
      loans: filteredLoans,
      subscriptions: filteredSubscriptions,
    };
  }, [books, transactions, loans, subscriptions, searchQuery]);

  return {
    results: filteredResults,
    loading,
    error,
  };
}