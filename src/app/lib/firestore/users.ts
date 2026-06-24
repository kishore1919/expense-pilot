import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
  FirestoreError
} from 'firebase/firestore';
import { db } from '@/app/firebase';
import type { UserProfile } from '../../types';

const USERS_COLLECTION = 'users';

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const userDoc = await getDoc(doc(db, USERS_COLLECTION, uid));
    if (!userDoc.exists()) {
      return null;
    }
    const data = userDoc.data();
    return {
      uid: data.uid,
      username: data.username,
      email: data.email,
      displayName: data.displayName,
      photoURL: data.photoURL,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
}

export async function createUserProfile(
  uid: string, 
  username: string, 
  email: string, 
  displayName: string, 
  photoURL: string | null
): Promise<void> {
  try {
    const userRef = doc(db, USERS_COLLECTION, uid);
    const existing = await getDoc(userRef);
    const normalizedUsername = username.toLowerCase().trim();

    if (existing.exists()) {
      // Preserve createdAt; only update mutable fields
      await updateDoc(userRef, {
        username: normalizedUsername,
        email,
        displayName,
        photoURL,
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(userRef, {
        uid,
        username: normalizedUsername,
        email,
        displayName,
        photoURL,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }
}

export async function updateUsername(uid: string, username: string): Promise<void> {
  try {
    const normalizedUsername = username.toLowerCase().trim();
    await updateDoc(doc(db, USERS_COLLECTION, uid), {
      username: normalizedUsername,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating username:', error);
    throw error;
  }
}

export async function isUsernameAvailable(username: string): Promise<boolean> {
  try {
    const normalizedUsername = username.toLowerCase().trim();
    const q = query(
      collection(db, USERS_COLLECTION),
      where('username', '==', normalizedUsername)
    );
    const snapshot = await getDocs(q);
    return snapshot.empty;
  } catch (error) {
    console.error('Error checking username availability:', error);
    throw error;
  }
}

export async function updateUserProfile(
  uid: string, 
  updates: Partial<Pick<UserProfile, 'displayName' | 'photoURL'>>
): Promise<void> {
  try {
    const updateData: Record<string, unknown> = {
      ...updates,
      updatedAt: serverTimestamp(),
    };
    await updateDoc(doc(db, USERS_COLLECTION, uid), updateData);
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
}

export function getDefaultUsernameFromEmail(email: string | null): string {
  if (!email) return 'user';
  const localPart = email.split('@')[0];
  const sanitized = localPart.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  return sanitized || 'user';
}