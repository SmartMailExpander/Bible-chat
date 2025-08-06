"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "./DevotionalsPage.module.css";
import devotionalsData from "./devotionals-sample.json";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { auth, db } from "../../firebaseConfig";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

function ExplainModal({ open, onClose, verse }: { open: boolean; onClose: () => void; verse: string }) {
  if (!open) return null;
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        <div style={{ fontWeight: 700, marginBottom: 12 }}>AI Explanation</div>
        <div style={{ marginBottom: 18 }}>
          {/* Dummy AI response for now */}
          This verse reminds us that God’s plans are always for our good, even when we don’t understand them. Trust in His wisdom and timing.
        </div>
        <button className={styles.button} onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

export default function DevotionalsPage() {
  const [currentDay, setCurrentDay] = useState(1);
  const [completed, setCompleted] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [showExplain, setShowExplain] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [lastCompletedAt, setLastCompletedAt] = useState<string | null>(null);
  const router = useRouter();
  const totalDays = 30;
  const devotional = devotionalsData.find(d => d.day === currentDay) || devotionalsData[0];
  const progress = Math.round((currentDay / totalDays) * 100);

  // Helper to get today's date string (YYYY-MM-DD)
  const getToday = () => new Date().toISOString().slice(0, 10);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const progressRef = doc(db, "users", firebaseUser.uid, "devotionalProgress", "progress");
        const snap = await getDoc(progressRef);
        if (snap.exists()) {
          const data = snap.data();
          if (typeof data.currentDay === "number") {
            setCurrentDay(data.currentDay);
            localStorage.setItem('haven-devotional-day', String(data.currentDay));
          }
          if (typeof data.lastCompletedAt === "string") {
            setLastCompletedAt(data.lastCompletedAt);
            localStorage.setItem('haven-devotional-lastCompletedAt', data.lastCompletedAt);
          }
        } else {
          // Migrate from localStorage if present
          const saved = parseInt(localStorage.getItem('haven-devotional-day') || '1', 10);
          const toSet = isNaN(saved) ? 1 : saved;
          const last = localStorage.getItem('haven-devotional-lastCompletedAt') || null;
          await setDoc(progressRef, { currentDay: toSet, lastCompletedAt: last });
          setCurrentDay(toSet);
          setLastCompletedAt(last);
        }
      } else {
        // Not logged in: use localStorage
        const savedDay = parseInt(localStorage.getItem('haven-devotional-day') || '1', 10);
        setCurrentDay(isNaN(savedDay) ? 1 : savedDay);
        setLastCompletedAt(localStorage.getItem('haven-devotional-lastCompletedAt'));
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // On mount or when lastCompletedAt changes, check if today is after lastCompletedAt
    if (!lastCompletedAt) {
      setCompleted(false);
      return;
    }
    const today = getToday();
    setCompleted(lastCompletedAt === today);
  }, [lastCompletedAt]);

  const handleComplete = async () => {
    const today = getToday();
    const nextDay = Math.min(currentDay + 1, totalDays);
    
    setCompleted(true);
    setLastCompletedAt(today);
    setCurrentDay(nextDay);
    
    // Update Firestore if logged in
    if (user) {
      const progressRef = doc(db, "users", user.uid, "devotionalProgress", "progress");
      await setDoc(progressRef, { currentDay: nextDay, lastCompletedAt: today });
      
      // Increment devotional count in user profile
      try {
        const { incrementUserStat } = await import('../profile/profileService');
        await incrementUserStat(user.uid, 'totalDevotionalsCompleted');
      } catch (error) {
        console.error('Failed to increment devotional count:', error);
      }
    }
    // Always update localStorage as fallback
    if (typeof window !== 'undefined') {
      localStorage.setItem('haven-devotional-day', String(nextDay));
      localStorage.setItem('haven-devotional-lastCompletedAt', today);
    }
  };

  // Logic to advance to next day if a new day has started
  useEffect(() => {
    if (!lastCompletedAt) return;
    const today = getToday();
    if (lastCompletedAt < today) {
      // New day, advance
      const nextDay = Math.min(currentDay + 1, totalDays);
      setCurrentDay(nextDay);
      setCompleted(false);
      setLastCompletedAt(null);
      // Update Firestore/localStorage
      if (user) {
        const progressRef = doc(db, "users", user.uid, "devotionalProgress", "progress");
        setDoc(progressRef, { currentDay: nextDay, lastCompletedAt: null });
      }
      if (typeof window !== 'undefined') {
        localStorage.setItem('haven-devotional-day', String(nextDay));
        localStorage.removeItem('haven-devotional-lastCompletedAt');
      }
    }
  }, [lastCompletedAt, currentDay, user]);

  return (
    <div className={styles.container}>
      {/* Back Arrow Button */}
      <button
        onClick={() => router.push("/")}
        style={{
          position: "fixed",
          top: 24,
          left: 16,
          zIndex: 30,
          background: "#e5dcd3",
          border: "none",
          borderRadius: "50%",
          width: 44,
          height: 44,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 1px 4px 0 rgba(158,145,136,0.04)",
          cursor: "pointer",
        }}
        aria-label="Back to Home"
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#5C4033" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>
      <div className={styles.title}>Devotionals</div>
      <div className={styles.subtitle}>Day {currentDay} of {totalDays}</div>
      <div className={styles.progressBarBg}>
        <div className={styles.progressBar} style={{ width: `${progress}%` }} />
      </div>
      <div className={styles.card}>
        {completed && <div className={styles.completedBadge}>Completed ✅</div>}
        <button
          className={bookmarked ? styles.bookmark + " " + styles.bookmarkActive : styles.bookmark}
          onClick={() => setBookmarked(b => !b)}
          aria-label={bookmarked ? "Remove bookmark" : "Bookmark devotional"}
        >
          {bookmarked ? <BookmarkCheck size={24} /> : <Bookmark size={24} />}
        </button>
        <div className={styles.verse}>&ldquo;{devotional.verse}&rdquo;</div>
        <div className={styles.reference}>{devotional.reference}</div>
        <div className={styles.reflection}>{devotional.reflection}</div>
        <div className={styles.prompt}>{devotional.prompt}</div>
        {!completed && currentDay < totalDays && (
          <button className={styles.button} onClick={handleComplete}>
            Mark as Complete
          </button>
        )}
        {completed && currentDay < totalDays && (
          <button className={styles.button} disabled>
            Next Devotional...
          </button>
        )}
        {currentDay === totalDays && (
          <button className={styles.button} disabled>
            All devotionals complete!
          </button>
        )}
        <button className={styles.button} onClick={() => setShowExplain(true)}>
          Explain this verse
        </button>
        <button 
          className={styles.button} 
          style={{ marginBottom: 0 }}
          onClick={() => {
            // Navigate to journal with pre-filled devotional response
            const journalData = {
              title: `Devotional Response - Day ${currentDay}`,
              body: `Today's verse: "${devotional.verse}" (${devotional.reference})\n\n${devotional.prompt}\n\nMy response:`,
              verse: devotional.reference,
              isDevotionalResponse: true,
              devotionalDay: currentDay
            };
            // Store in localStorage for journal page to pick up
            localStorage.setItem('haven-journal-prefill', JSON.stringify(journalData));
            router.push('/journal');
          }}
        >
          Respond in Journal
        </button>
      </div>
      <ExplainModal open={showExplain} onClose={() => setShowExplain(false)} verse={devotional.verse} />
    </div>
  );
} 