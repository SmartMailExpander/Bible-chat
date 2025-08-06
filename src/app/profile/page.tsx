'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '../../firebaseConfig';
import { onAuthStateChanged, signOut, updateProfile } from 'firebase/auth';
import styles from './ProfilePage.module.css';
import { getUserProfile, createUserProfile, updateUserProfile, UserProfile } from './profileService';

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    displayName: '',
    favoriteBibleVersion: '',
    readingGoal: 1,
    notificationsEnabled: true,
    theme: 'auto' as 'light' | 'dark' | 'auto'
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        await loadUserProfile(user.uid);
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Refresh profile stats periodically
  useEffect(() => {
    if (!user) return;
    
    const refreshStats = async () => {
      await loadUserProfile(user.uid);
    };
    
    // Refresh stats every 30 seconds
    const interval = setInterval(refreshStats, 30000);
    
    return () => clearInterval(interval);
  }, [user]);

  const loadUserProfile = async (userId: string) => {
    try {
      // Get the current user from auth to ensure we have the latest data
      const currentUser = auth.currentUser;
      console.log('🔍 Current user:', currentUser?.displayName, currentUser?.email);
      
      // Try to get profile from localStorage first as fallback
      const localProfile = localStorage.getItem(`haven-profile-${userId}`);
      let profileData = null;
      
      if (localProfile) {
        try {
          profileData = JSON.parse(localProfile);
          console.log('🔍 Found local profile:', profileData);
        } catch (e) {
          console.log('🔍 Invalid local profile, will fetch from Firebase');
        }
      }
      
      // If no local profile, try Firebase
      if (!profileData) {
        profileData = await getUserProfile(userId);
      }
      if (profileData) {
        // Use Firebase user's display name if available, otherwise use stored profile name
        const displayName = currentUser?.displayName || profileData.displayName || 'User';
        console.log('🔍 Setting display name to:', displayName);
        const updatedProfile = { ...profileData, displayName };
        setProfile(updatedProfile);
        setEditForm({
          displayName: displayName,
          favoriteBibleVersion: profileData.favoriteBibleVersion,
          readingGoal: profileData.readingGoal,
          notificationsEnabled: profileData.notificationsEnabled,
          theme: profileData.theme
        });
      } else {
        // Create default profile with Firebase user's display name
        const displayName = currentUser?.displayName || 'User';
        console.log('🔍 Creating profile with display name:', displayName);
        const defaultProfile: UserProfile = {
          displayName: displayName,
          email: currentUser?.email || '',
          photoURL: currentUser?.photoURL || null,
          joinDate: new Date().toISOString(),
          totalDevotionalsCompleted: 0,
          totalJournalEntries: 0,
          totalBookmarks: 0,
          favoriteBibleVersion: 'KJV',
          readingGoal: 1,
          notificationsEnabled: true,
          theme: 'auto'
        };
        
                 try {
           await createUserProfile(userId, defaultProfile);
           // Save to localStorage as backup
           localStorage.setItem(`haven-profile-${userId}`, JSON.stringify(defaultProfile));
           setProfile(defaultProfile);
           setEditForm({
             displayName: defaultProfile.displayName,
             favoriteBibleVersion: defaultProfile.favoriteBibleVersion,
             readingGoal: defaultProfile.readingGoal,
             notificationsEnabled: defaultProfile.notificationsEnabled,
             theme: defaultProfile.theme
           });
         } catch (createError) {
           console.error('Error creating profile:', createError);
           // If creation fails, save to localStorage and show locally
           localStorage.setItem(`haven-profile-${userId}`, JSON.stringify(defaultProfile));
           setProfile(defaultProfile);
           setEditForm({
             displayName: defaultProfile.displayName,
             favoriteBibleVersion: defaultProfile.favoriteBibleVersion,
             readingGoal: defaultProfile.readingGoal,
             notificationsEnabled: defaultProfile.notificationsEnabled,
             theme: defaultProfile.theme
           });
         }
      }
           } catch (error) {
         console.error('Error loading profile:', error);
         // Show a fallback profile even if loading fails
         const currentUser = auth.currentUser;
         const fallbackProfile: UserProfile = {
           displayName: currentUser?.displayName || 'User',
           email: currentUser?.email || '',
           photoURL: null,
           joinDate: new Date().toISOString(),
           totalDevotionalsCompleted: 0,
           totalJournalEntries: 0,
           totalBookmarks: 0,
           favoriteBibleVersion: 'KJV',
           readingGoal: 1,
           notificationsEnabled: true,
           theme: 'auto'
         };
      setProfile(fallbackProfile);
      setEditForm({
        displayName: fallbackProfile.displayName,
        favoriteBibleVersion: fallbackProfile.favoriteBibleVersion,
        readingGoal: fallbackProfile.readingGoal,
        notificationsEnabled: fallbackProfile.notificationsEnabled,
        theme: fallbackProfile.theme
      });
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    try {
      // Update Firebase Auth profile
      await updateProfile(user, {
        displayName: editForm.displayName
      });

      // Update Firestore profile
      await updateUserProfile(user.uid, {
        displayName: editForm.displayName,
        favoriteBibleVersion: editForm.favoriteBibleVersion,
        readingGoal: editForm.readingGoal,
        notificationsEnabled: editForm.notificationsEnabled,
        theme: editForm.theme
      });

      // Update local state
      const updatedProfile = profile ? {
        ...profile,
        displayName: editForm.displayName,
        favoriteBibleVersion: editForm.favoriteBibleVersion,
        readingGoal: editForm.readingGoal,
        notificationsEnabled: editForm.notificationsEnabled,
        theme: editForm.theme
      } : null;

      setProfile(updatedProfile);

      // Save to localStorage as backup
      if (updatedProfile) {
        localStorage.setItem(`haven-profile-${user.uid}`, JSON.stringify(updatedProfile));
      }

      setEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      // Even if Firebase fails, save to localStorage
      const updatedProfile = profile ? {
        ...profile,
        displayName: editForm.displayName,
        favoriteBibleVersion: editForm.favoriteBibleVersion,
        readingGoal: editForm.readingGoal,
        notificationsEnabled: editForm.notificationsEnabled,
        theme: editForm.theme
      } : null;

      setProfile(updatedProfile);
      if (updatedProfile) {
        localStorage.setItem(`haven-profile-${user.uid}`, JSON.stringify(updatedProfile));
      }
      setEditing(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading your profile...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={styles.container}>
        <div className={styles.authPrompt}>
          <h2>Sign in to view your profile</h2>
          <p>Connect with your spiritual journey</p>
          <button 
            className={styles.signInButton}
            onClick={() => router.push('/auth')}
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <button 
          className={styles.backButton}
          onClick={() => router.push('/')}
          aria-label="Back"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#5C4033" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h1>Your Profile</h1>
        <div className={styles.headerActions}>
          {editing ? (
            <>
              <button 
                className={styles.cancelButton}
                onClick={() => setEditing(false)}
              >
                Cancel
              </button>
              <button 
                className={styles.saveButton}
                onClick={handleSaveProfile}
              >
                Save
              </button>
            </>
          ) : (
            <button 
              className={styles.editButton}
              onClick={() => setEditing(true)}
            >
              Edit
            </button>
          )}
        </div>
      </div>

      {/* Profile Section */}
      <div className={styles.profileSection}>
        <div className={styles.avatarSection}>
          <div className={styles.avatar}>
            {profile?.photoURL ? (
              <img src={profile.photoURL} alt="Profile" />
            ) : (
              <div className={styles.avatarPlaceholder}>
                {profile?.displayName?.charAt(0).toUpperCase() || 'U'}
              </div>
            )}
          </div>
          <div className={styles.userInfo}>
            {editing ? (
              <input
                type="text"
                value={editForm.displayName}
                onChange={(e) => setEditForm(prev => ({ ...prev, displayName: e.target.value }))}
                className={styles.nameInput}
                placeholder="Enter your name"
              />
            ) : (
              <h2>{profile?.displayName}</h2>
            )}
            <p className={styles.userEmail}>{profile?.email}</p>
            <p className={styles.preferredVersion}>
              Preferred Bible Version: <strong>{profile?.favoriteBibleVersion}</strong>
            </p>
            {editing ? (
              <select
                value={editForm.favoriteBibleVersion}
                onChange={(e) => setEditForm(prev => ({ ...prev, favoriteBibleVersion: e.target.value }))}
                className={styles.versionSelect}
              >
                <option value="KJV">KJV</option>
                <option value="ESV">ESV</option>
                <option value="NIV">NIV</option>
                <option value="NLT">NLT</option>
                <option value="MSG">MSG</option>
              </select>
            ) : null}
            <p className={styles.joinDate}>
              Member since {formatDate(profile?.joinDate || new Date().toISOString())}
            </p>
          </div>
        </div>

        {/* Stats Section */}
        <div className={styles.statsSection}>
          <div className={styles.statCard}>
            <div className={styles.statNumber}>{profile?.totalDevotionalsCompleted || 0}</div>
            <div className={styles.statLabel}>Devotionals</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statNumber}>{profile?.totalJournalEntries || 0}</div>
            <div className={styles.statLabel}>Journal Entries</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statNumber}>{profile?.totalBookmarks || 0}</div>
            <div className={styles.statLabel}>Bookmarks</div>
          </div>
        </div>
      </div>



      {/* Action Menu */}
      <div className={styles.actionMenu}>
        <div className={styles.actionSection}>
          <h3 className={styles.sectionTitle}>Your Content</h3>
          <button className={styles.actionButton} onClick={() => router.push('/readbible')}>
            <div className={styles.actionIcon}>📒</div>
            <div className={styles.actionContent}>
              <span className={styles.actionTitle}>View Highlights</span>
              <span className={styles.actionSubtitle}>Your highlighted verses</span>
            </div>
            <div className={styles.actionArrow}>→</div>
          </button>
          <button className={styles.actionButton} onClick={() => router.push('/readbible/bookmarks')}>
            <div className={styles.actionIcon}>🔖</div>
            <div className={styles.actionContent}>
              <span className={styles.actionTitle}>View Bookmarks</span>
              <span className={styles.actionSubtitle}>Your saved verses</span>
            </div>
            <div className={styles.actionArrow}>→</div>
          </button>
          <button className={styles.actionButton} onClick={() => router.push('/journal')}>
            <div className={styles.actionIcon}>📝</div>
            <div className={styles.actionContent}>
              <span className={styles.actionTitle}>View Notes</span>
              <span className={styles.actionSubtitle}>Your journal entries</span>
            </div>
            <div className={styles.actionArrow}>→</div>
          </button>
        </div>

        <div className={styles.actionSection}>
          <h3 className={styles.sectionTitle}>Settings</h3>
          <button className={styles.actionButton} onClick={() => alert('Dark mode coming soon!')}>
            <div className={styles.actionIcon}>🌙</div>
            <div className={styles.actionContent}>
              <span className={styles.actionTitle}>Toggle Dark Mode</span>
              <span className={styles.actionSubtitle}>Change app appearance</span>
            </div>
            <div className={styles.actionArrow}>→</div>
          </button>
          <button className={styles.actionButton} onClick={() => router.push('/pricing')}>
            <div className={styles.actionIcon}>⭐</div>
            <div className={styles.actionContent}>
              <span className={styles.actionTitle}>Upgrade to Premium</span>
              <span className={styles.actionSubtitle}>Unlock unlimited features</span>
            </div>
            <div className={styles.actionArrow}>→</div>
          </button>
        </div>

        <div className={styles.actionSection}>
          <button className={`${styles.actionButton} ${styles.logoutButton}`} onClick={handleSignOut}>
            <div className={styles.actionIcon}>🚪</div>
            <div className={styles.actionContent}>
              <span className={styles.actionTitle}>Log Out</span>
              <span className={styles.actionSubtitle}>Sign out of your account</span>
            </div>
            <div className={styles.actionArrow}>→</div>
          </button>
        </div>
      </div>


    </div>
  );
} 