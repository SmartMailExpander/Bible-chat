import { useState, useEffect } from "react";
import { getBookmarks, saveBookmark as saveBookmarkLS, removeBookmark as removeBookmarkLS, Bookmark } from "../utils/localBibleStorage";

export default function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);

  useEffect(() => {
    setBookmarks(getBookmarks());
    const onStorage = () => setBookmarks(getBookmarks());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const addBookmark = async (bookmark: Bookmark) => {
    saveBookmarkLS(bookmark);
    setBookmarks(getBookmarks());
    
    // Increment bookmark count in user profile
    try {
      const { auth } = await import('../../../firebaseConfig');
      const { incrementUserStat } = await import('../../../app/profile/profileService');
      if (auth.currentUser) {
        await incrementUserStat(auth.currentUser.uid, 'totalBookmarks');
      }
    } catch (error) {
      console.error('Failed to increment bookmark count:', error);
    }
  };

  const removeBookmark = (bookmark: Bookmark) => {
    removeBookmarkLS(bookmark);
    setBookmarks(getBookmarks());
  };

  return [bookmarks, addBookmark, removeBookmark] as const;
} 