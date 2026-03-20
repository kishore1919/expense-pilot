'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthState } from 'react-firebase-hooks/auth';
import { collection, query, where, getDocs, addDoc, updateDoc, doc, serverTimestamp, limit } from 'firebase/firestore';
import { auth, db } from '@/app/firebase';
import Loading from '@/app/components/Loading';
import { Box, Typography, Alert } from '@mui/material';

/**
 * PersonalTrackerRedirect - A smart redirect page that ensures the user 
 * always has a dedicated "Personal Tracker" book.
 * It prioritizes a book marked with 'isDefaultPersonal: true'.
 */
export default function PersonalTrackerRedirect() {
  const [user, authLoading] = useAuthState(auth);
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }

    const findOrCreatePersonalBook = async () => {
      try {
        // 1. Try to find the explicit default personal book
        const defaultQuery = query(
          collection(db, 'books'),
          where('userId', '==', user.uid),
          where('isDefaultPersonal', '==', true),
          limit(1)
        );
        
        const defaultSnap = await getDocs(defaultQuery);

        if (!defaultSnap.empty) {
          router.replace(`/book/${defaultSnap.docs[0].id}`);
          return;
        }

        // 2. If no explicit default, look for ANY 'personal' type book
        const anyPersonalQuery = query(
          collection(db, 'books'),
          where('userId', '==', user.uid),
          where('type', '==', 'personal'),
          limit(1)
        );
        
        const anySnap = await getDocs(anyPersonalQuery);

        if (!anySnap.empty) {
          // Found a personal book, upgrade it to be the default
          const personalBook = anySnap.docs[0];
          await updateDoc(doc(db, 'books', personalBook.id), {
            isDefaultPersonal: true,
            name: personalBook.data().name || 'Personal Tracker'
          });
          router.replace(`/book/${personalBook.id}`);
          return;
        }

        // 3. If absolutely nothing found, create a new default personal book
        const docRef = await addDoc(collection(db, 'books'), {
          name: 'Personal Tracker',
          type: 'personal',
          userId: user.uid,
          createdAt: serverTimestamp(),
          archived: false,
          isDefaultPersonal: true,
        });
        
        router.replace(`/book/${docRef.id}`);
      } catch (err) {
        console.error('Error in PersonalTrackerRedirect:', err);
        setError('Failed to load your personal tracker. Please try again.');
      }
    };

    findOrCreatePersonalBook();
  }, [user, authLoading, router]);

  if (authLoading) return <Loading />;

  return (
    <Box 
      sx={{ 
        height: '100vh', 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center',
        gap: 2
      }}
    >
      {error ? (
        <Alert severity="error">{error}</Alert>
      ) : (
        <>
          <Loading />
          <Typography variant="body1" color="text.secondary">
            Preparing your personal tracker...
          </Typography>
        </>
      )}
    </Box>
  );
}
