import { doc, getDoc, setDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../../firebaseConfig';

export interface UserProfile {
  displayName: string;
  email: string;
  photoURL?: string | null;
  joinDate: string;
  totalDevotionalsCompleted: number;
  totalJournalEntries: number;
  totalBookmarks: number;
  favoriteBibleVersion: string;
  readingGoal: number;
  notificationsEnabled: boolean;
  theme: 'light' | 'dark' | 'auto';
  updatedAt?: any;
}

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      return userDoc.data() as UserProfile;
    }
    return null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    // Return null for permission errors, but don't throw
    if (error.code === 'permission-denied') {
      console.log('Permission denied for user profile, using local fallback');
      return null;
    }
    return null;
  }
};

export const createUserProfile = async (userId: string, profileData: Partial<UserProfile>): Promise<void> => {
  try {
    const defaultProfile: UserProfile = {
      displayName: profileData.displayName || 'User',
      email: profileData.email || '',
      photoURL: profileData.photoURL || null,
      joinDate: new Date().toISOString(),
      totalDevotionalsCompleted: 0,
      totalJournalEntries: 0,
      totalBookmarks: 0,
      favoriteBibleVersion: 'KJV',
      readingGoal: 1,
      notificationsEnabled: true,
      theme: 'auto',
      updatedAt: new Date()
    };

    await setDoc(doc(db, 'users', userId), defaultProfile);
  } catch (error) {
    console.error('Error creating user profile:', error);
    // Don't throw for permission errors, just log them
    if (error.code === 'permission-denied') {
      console.log('Permission denied for creating user profile, using local storage');
      return;
    }
    throw error;
  }
};

export const updateUserProfile = async (userId: string, updates: Partial<UserProfile>): Promise<void> => {
  try {
    await updateDoc(doc(db, 'users', userId), {
      ...updates,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

export const incrementUserStat = async (userId: string, stat: 'totalDevotionalsCompleted' | 'totalJournalEntries' | 'totalBookmarks'): Promise<void> => {
  try {
    await updateDoc(doc(db, 'users', userId), {
      [stat]: increment(1),
      updatedAt: new Date()
    });
  } catch (error) {
    console.error(`Error incrementing ${stat}:`, error);
    
    // Fallback to localStorage if Firebase fails
    if (error.code === 'permission-denied' || error.code === 'unavailable') {
      console.log(`Using localStorage fallback for ${stat}`);
      const profileKey = `haven-profile-${userId}`;
      const profileData = localStorage.getItem(profileKey);
      
      if (profileData) {
        try {
          const profile = JSON.parse(profileData);
          profile[stat] = (profile[stat] || 0) + 1;
          profile.updatedAt = new Date().toISOString();
          localStorage.setItem(profileKey, JSON.stringify(profile));
        } catch (parseError) {
          console.error('Error parsing profile data:', parseError);
        }
      }
      return;
    }
    
    throw error;
  }
};

export const decrementUserStat = async (userId: string, stat: 'totalDevotionalsCompleted' | 'totalJournalEntries' | 'totalBookmarks'): Promise<void> => {
  try {
    await updateDoc(doc(db, 'users', userId), {
      [stat]: increment(-1),
      updatedAt: new Date()
    });
  } catch (error) {
    console.error(`Error decrementing ${stat}:`, error);
    throw error;
  }
}; 