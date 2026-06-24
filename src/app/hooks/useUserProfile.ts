import { useState, useEffect, useCallback } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/app/firebase';
import { 
  getUserProfile, 
  createUserProfile, 
  updateUsername, 
  updateUserProfile,
  isUsernameAvailable,
  getDefaultUsernameFromEmail 
} from '@/app/lib/firestore/users';
import type { UserProfile } from '@/app/types';

interface UseUserProfileReturn {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  updateUsername: (username: string) => Promise<void>;
  checkUsernameAvailable: (username: string) => Promise<boolean>;
  refetch: () => Promise<void>;
}

export function useUserProfile(): UseUserProfileReturn {
  const [firebaseUser] = useAuthState(auth);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!firebaseUser) {
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const userProfile = await getUserProfile(firebaseUser.uid);
      
      if (!userProfile) {
        const defaultUsername = getDefaultUsernameFromEmail(firebaseUser.email);
        await createUserProfile(
          firebaseUser.uid,
          defaultUsername,
          firebaseUser.email || '',
          firebaseUser.displayName || 'User',
          firebaseUser.photoURL
        );
        const newProfile = await getUserProfile(firebaseUser.uid);
        setProfile(newProfile);
      } else {
        setProfile(userProfile);
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
      setError('Failed to load user profile');
    } finally {
      setLoading(false);
    }
  }, [firebaseUser]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleUpdateUsername = useCallback(async (newUsername: string) => {
    if (!firebaseUser) return;
    
    try {
      setError(null);
      await updateUsername(firebaseUser.uid, newUsername);
      await fetchProfile();
    } catch (err) {
      console.error('Error updating username:', err);
      setError('Failed to update username');
      throw err;
    }
  }, [firebaseUser, fetchProfile]);

  const handleCheckAvailability = useCallback(async (username: string): Promise<boolean> => {
    try {
      return await isUsernameAvailable(username);
    } catch (err) {
      console.error('Error checking username:', err);
      return false;
    }
  }, []);

  return {
    profile,
    loading,
    error,
    updateUsername: handleUpdateUsername,
    checkUsernameAvailable: handleCheckAvailability,
    refetch: fetchProfile,
  };
}