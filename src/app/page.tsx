"use client";
import styles from "./HomePage.module.css";
import { Bell, Bookmark, MessageCircle, BookOpen, Notebook, User, Calendar, Plus, Share2, CheckCircle, Flame, Feather, Bookmark as BookmarkIcon, Star, StarOff, Trash2 } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { auth } from "../firebaseConfig";
import devotionalsData from "./devotionals/devotionals-sample.json";
import { db } from "../firebaseConfig";
import { doc, getDoc, setDoc, onSnapshot, collection, getDocs } from "firebase/firestore";
import kjvData from '../data/bibles/kjv.json';
import TrialBanner from '../components/TrialBanner';
import { getCurrentUserSubscription, resetChatCount, resetUserData, setUserAsPremium, setUserAsTrial, setUserAsFree } from "../services/localSubscriptionService";
import Link from "next/link";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 18) return "Good Afternoon";
  return "Good Evening";
}

function GreetingCard({ name, greeting }) {
  return (
    <div className={styles.greetingCard}>
      <div className={styles.greetingTitle}>{greeting}, {name}</div>
      <div className={styles.greetingDesc}>Let's start your spiritual journey</div>
      
    </div>
  );
}

function VerseCard({ verse, reference }) {
  return (
    <div className={styles.verseCard}>
      <div className={styles.verseTitle}>Today's Verse</div>
      <div className={styles.verseText}>
        {verse}
      </div>
      <div className={styles.verseRef}>{reference}</div>
      <div className={styles.verseBookmark}>
        <Bookmark color="#b0a597" size={20} aria-label="Bookmark" />
      </div>
    </div>
  );
}

function CalendarVerseCard({ verse, reference, bookmarked, onBookmark }) {
  return (
    <div className={styles.verseCard}>
      <div className={styles.verseTitle}>Today's Verse</div>
      <div className={styles.verseText}>{verse}</div>
      <div className={styles.verseRef}>{reference}</div>
      <button
        className={bookmarked ? 'lucide lucide-star' : 'lucide lucide-star-off'}
        onClick={onBookmark}
        aria-label={bookmarked ? 'Remove Bookmark' : 'Add Bookmark'}
        style={{ cursor: 'pointer', background: 'none', border: 'none', position: 'absolute', top: 16, right: 16, padding: 0 }}
      >
        {bookmarked ? <Star color="#b0a597" fill="#b0a597" size={20} /> : <StarOff color="#b0a597" size={20} />}
      </button>
    </div>
  );
}

function DevotionalProgress({ currentDay, totalDays }) {
  const router = useRouter();
  const progress = Math.round((currentDay / totalDays) * 100);
  return (
    <div
      className={styles.progressCard}
      onClick={() => router.push("/devotionals")}
      style={{ cursor: "pointer", transition: "box-shadow 0.2s, background 0.2s" }}
      tabIndex={0}
      role="button"
      aria-label="Go to Devotionals"
      onKeyDown={e => { if (e.key === "Enter" || e.key === " ") router.push("/devotionals"); }}
    >
      <div className={styles.progressLabel}>
        Devotional Progress <span className={styles.progressDay}>Day {currentDay} of {totalDays}</span>
      </div>
      <div className={styles.progressBarBg}>
        <div className={styles.progressBar} style={{ width: `${progress}%` }}></div>
      </div>
    </div>
  );
}

function QuickAccess() {
  const router = useRouter();
  const iconBox = (icon, label, onClick) => (
    <div className={styles.quickAccessIcon} onClick={onClick} tabIndex={0} role="button" aria-label={label}>
      <div className={styles.quickAccessIconBox}>{icon}</div>
      <div className={styles.quickAccessIconLabel}>{label}</div>
    </div>
  );
  return (
    <div className={styles.quickAccess}>
      <div className={styles.quickAccessLabel}>Quick Access</div>
      <div className={styles.quickAccessRow}>
        {iconBox(<MessageCircle color="#b0a597" size={28} />, "Chat", () => router.push("/chat"))}
        {iconBox(<Notebook color="#b0a597" size={28} />, "Journal", () => router.push("/journal"))}
        {iconBox(<BookOpen color="#b0a597" size={28} />, "Read Bible", () => router.push("/readbible"))}
      </div>
    </div>
  );
}

function SpiritualJourneySection({ currentDay }) {
  const router = useRouter();
  const milestones = [
    {
      icon: "🔥",
      title: `${currentDay}-Day Devotional Streak`,
      sub: "Keep your spiritual momentum going!",
      btn: "Continue Streak",
      background: "#F5EDFB",
      onClick: () => router.push("/devotionals")
    },
    {
      icon: "📖",
      title: "Today's Memory Verse",
      sub: "Psalm 51:10 — Practice this verse today",
      btn: "Practice Verse",
      background: "#FFE8E0",
      onClick: () => router.push("/readbible")
    },
    {
      icon: "🛐",
      title: "Prayer Journal",
      sub: "Write your prayers and reflections",
      btn: "Write Prayer",
      background: "#ECF6EC",
      onClick: () => router.push("/journal")
    }
  ];
  
  return (
    <div className={styles.spiritualJourneySection}>
      <div className={styles.spiritualJourneyLabel}>Your Spiritual Journey</div>
      <div className={styles.spiritualJourneyTimeline}>
        {milestones.map((m, i) => (
          <div className={styles.spiritualJourneyMilestone} key={i} style={{ background: m.background }}>
            <div className={styles.spiritualJourneyMilestoneIcon}>
              {m.icon}
            </div>
            <div className={styles.spiritualJourneyMilestoneContent}>
              <div className={styles.spiritualJourneyMilestoneTitle}>{m.title}</div>
              <div className={styles.spiritualJourneyMilestoneSub}>{m.sub}</div>
              <button className={styles.spiritualJourneyMilestoneBtn} onClick={m.onClick}>{m.btn}</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FloatingActionButton() {
  return (
    <button className={styles.fab} aria-label="Add">
      <Plus size={32} />
    </button>
  );
}

function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const navItems = [
    { icon: <MessageCircle size={22} />, label: "Chat", path: "/chat" },
    { icon: <Bookmark size={22} />, label: "Bookmarks", path: "/readbible/bookmarks" },
    { icon: <Notebook size={22} />, label: "Journal", path: "/journal" },
    { icon: <BookOpen size={22} />, label: "Read Bible", path: "/readbible" },
    { icon: <User size={22} />, label: "Profile", path: "/profile" },
  ];
  return (
    <nav className={styles.bottomNav}>
      {navItems.map((item) => {
        const isActive = pathname === item.path;
        return (
          <div
            key={item.label}
            className={styles.bottomNavItem}
            onClick={() => router.push(item.path)}
            tabIndex={0}
            role="button"
            aria-label={item.label}
          >
            <span style={{ color: isActive ? "#6b5c4a" : "#b0a597" }}>{item.icon}</span>
            <div className={isActive ? styles.bottomNavLabelActive : styles.bottomNavLabel}>{item.label}</div>
          </div>
        );
      })}
    </nav>
  );
}

export default function HomePage() {
  const [user, setUser] = useState<any>(null);
  const [userDevotionalDay, setUserDevotionalDay] = useState(1);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [bookmarks, setBookmarks] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [userType, setUserType] = useState<'free' | 'trial' | 'subscribed'>('free');
  const [dailyChatsUsed, setDailyChatsUsed] = useState(0);
  const [dailyChatLimit, setDailyChatLimit] = useState(5);
  const [subscriptionLoaded, setSubscriptionLoaded] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const unsubscribeAuth = auth.onAuthStateChanged(async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const progressRef = doc(db, "users", firebaseUser.uid, "devotionalProgress", "progress");
        // Listen for real-time updates
        const unsubProgress = onSnapshot(progressRef, (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            if (typeof data.currentDay === "number") {
              setUserDevotionalDay(data.currentDay);
              localStorage.setItem('haven-devotional-day', String(data.currentDay));
            }
          } else {
            // If not in Firestore, set to 1
            setDoc(progressRef, { currentDay: 1 });
            setUserDevotionalDay(1);
            localStorage.setItem('haven-devotional-day', '1');
          }
          setIsLoaded(true);
        });
        return () => unsubProgress();
      } else {
        // Not logged in: use localStorage
        if (typeof window !== 'undefined') {
          const savedDay = parseInt(localStorage.getItem('haven-devotional-day') || '1', 10);
          setUserDevotionalDay(isNaN(savedDay) ? 1 : savedDay);
        }
        setIsLoaded(true);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  // Load subscription data
  useEffect(() => {
    const loadSubscription = async () => {
      try {
        if (user) {
          // Get subscription using local service
          const subscription = await getCurrentUserSubscription();
          console.log('🔍 Loaded subscription:', subscription);
          console.log('🔍 Setting dailyChatLimit to:', subscription.dailyChatLimit);
          setUserType(subscription.userType);
          setDailyChatsUsed(subscription.dailyChatsUsed);
          setDailyChatLimit(subscription.dailyChatLimit);
        } else {
          // Default values for non-authenticated users
          setUserType('free');
          setDailyChatsUsed(0);
          setDailyChatLimit(5);
        }
        setSubscriptionLoaded(true);
      } catch (error) {
        console.error('Error loading subscription:', error);
        setUserType('free');
        setDailyChatsUsed(0);
        setDailyChatLimit(5);
        setSubscriptionLoaded(true);
      }
    };

    loadSubscription();
  }, [user]);

  const greeting = getGreeting();
  const name = user?.displayName || (user?.email ? user.email.split("@")[0] : "");

  // Reset functions
  const handleResetChatCount = async () => {
    try {
      await resetChatCount();
      // Reload subscription data
      const subscription = await getCurrentUserSubscription();
      setUserType(subscription.userType);
      setDailyChatsUsed(subscription.dailyChatsUsed);
      setDailyChatLimit(subscription.dailyChatLimit); // <-- add this line
      alert('Chat count reset to 0!');
    } catch (error) {
      console.error('Error resetting chat count:', error);
      alert('Error resetting chat count');
    }
  };

  const handleResetUserData = async () => {
    try {
      await resetUserData();
      // Reload subscription data
      const subscription = await getCurrentUserSubscription();
      setUserType(subscription.userType);
      setDailyChatsUsed(subscription.dailyChatsUsed);
      setDailyChatLimit(subscription.dailyChatLimit); // <-- add this line
      alert('All user data reset!');
    } catch (error) {
      console.error('Error resetting user data:', error);
      alert('Error resetting user data');
    }
  };

  const handleRefreshSubscription = async () => {
    try {
      const subscription = await getCurrentUserSubscription();
      setUserType(subscription.userType);
      setDailyChatsUsed(subscription.dailyChatsUsed);
      setDailyChatLimit(subscription.dailyChatLimit); // <-- add this line
      console.log('Subscription refreshed:', subscription);
    } catch (error) {
      console.error('Error refreshing subscription:', error);
    }
  };

  const handleSetAsPremium = async () => {
    try {
      await setUserAsPremium();
      const subscription = await getCurrentUserSubscription();
      setUserType(subscription.userType);
      setDailyChatsUsed(subscription.dailyChatsUsed);
      setDailyChatLimit(subscription.dailyChatLimit); // <-- add this line
      alert('User set as premium!');
    } catch (error) {
      console.error('Error setting user as premium:', error);
      alert('Error setting user as premium');
    }
  };

  const handleSetAsTrial = async () => {
    try {
      await setUserAsTrial();
      const subscription = await getCurrentUserSubscription();
      setUserType(subscription.userType);
      setDailyChatsUsed(subscription.dailyChatsUsed);
      setDailyChatLimit(subscription.dailyChatLimit); // <-- add this line
      alert('User set as trial!');
    } catch (error) {
      console.error('Error setting user as trial:', error);
      alert('Error setting user as trial');
    }
  };

  const handleSetAsFree = async () => {
    try {
      await setUserAsFree();
      const subscription = await getCurrentUserSubscription();
      setUserType(subscription.userType);
      setDailyChatsUsed(subscription.dailyChatsUsed);
      setDailyChatLimit(subscription.dailyChatLimit); // <-- add this line
      alert('User set as free!');
    } catch (error) {
      console.error('Error setting user as free:', error);
      alert('Error setting user as free');
    }
  };

  // Use userDevotionalDay for progress
  const currentDay = userDevotionalDay;
  const devotional = devotionalsData.find(d => d.day === currentDay) || devotionalsData[0];
  const totalDays = 30;

  // Flatten all KJV verses
  const allKjvVerses = [];
  Object.entries(kjvData).forEach(([book, chapters]) => {
    Object.entries(chapters).forEach(([chapter, verses]) => {
      Object.entries(verses).forEach(([verse, text]) => {
        allKjvVerses.push({ book, chapter, verse: Number(verse), text });
      });
    });
  });
  // Pick today's verse by day of year
  const today = new Date();
  const start = new Date(today.getFullYear(), 0, 0);
  const diff = today.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);
  const todaysVerseObj = allKjvVerses[dayOfYear % allKjvVerses.length];
  const todaysVerseRef = `${todaysVerseObj.book} ${todaysVerseObj.chapter}:${todaysVerseObj.verse}`;
  // Bookmark state for today's verse
  const [calendarBookmarked, setCalendarBookmarked] = useState(false);
  const bookmarkDocId = `${todaysVerseObj.book}_${todaysVerseObj.chapter}_${todaysVerseObj.verse}_KJV`;
  // Check bookmark state on mount or verse change
  useEffect(() => {
    if (user) {
      const checkBookmark = async () => {
        const docRef = doc(db, "users", user.uid, "bookmarks", bookmarkDocId);
        const snap = await getDoc(docRef);
        setCalendarBookmarked(snap.exists());
      };
      checkBookmark();
    } else {
      const allBookmarks = JSON.parse(localStorage.getItem('bibleBookmarks') || '[]');
      setCalendarBookmarked(allBookmarks.some(b => b.book === todaysVerseObj.book && b.chapter === String(todaysVerseObj.chapter) && b.verse === todaysVerseObj.verse && b.version === 'KJV'));
    }
  }, [user, todaysVerseRef]);
  // Toggle bookmark
  const handleCalendarBookmark = useCallback(async () => {
    const bookmarkObj = {
      book: todaysVerseObj.book,
      chapter: String(todaysVerseObj.chapter),
      verse: todaysVerseObj.verse,
      version: 'KJV',
      text: todaysVerseObj.text,
      savedAt: new Date().toISOString(),
    };
    // Always update localStorage
    let allBookmarks = JSON.parse(localStorage.getItem('bibleBookmarks') || '[]');
    if (calendarBookmarked) {
      allBookmarks = allBookmarks.filter(b => !(b.book === bookmarkObj.book && b.chapter === bookmarkObj.chapter && b.verse === bookmarkObj.verse && b.version === 'KJV'));
      setCalendarBookmarked(false);
    } else {
      allBookmarks.push(bookmarkObj);
      setCalendarBookmarked(true);
    }
    localStorage.setItem('bibleBookmarks', JSON.stringify(allBookmarks));
    // Also update Firestore if logged in
    if (user) {
      const docRef = doc(db, "users", user.uid, "bookmarks", bookmarkDocId);
      if (calendarBookmarked) {
        await setDoc(docRef, {}, { merge: false });
      } else {
        await setDoc(docRef, bookmarkObj);
      }
    }
  }, [user, calendarBookmarked, todaysVerseObj, bookmarkDocId]);

  // Fetch bookmarks on open
  const fetchBookmarks = useCallback(async () => {
    if (user) {
      // Firestore: get all bookmarks
      const colRef = collection(db, "users", user.uid, "bookmarks");
      const snap = await getDocs(colRef);
      setBookmarks(snap.docs.filter(doc => doc.data().verse && doc.data().reference).map(doc => ({ id: doc.id, ...doc.data() })));
    } else {
      // LocalStorage: get all keys
      const keys = Object.keys(localStorage).filter(k => k.startsWith("haven-calendar-verse-bookmark-"));
      setBookmarks(keys.map(k => {
        const ref = k.replace("haven-calendar-verse-bookmark-", "");
        const verseObj = devotionalsData.find(d => d.reference.replace(/\W/g, '_') === ref);
        return verseObj ? { id: ref, verse: verseObj.verse, reference: verseObj.reference } : null;
      }).filter(Boolean));
    }
  }, [user]);

  // Remove bookmark
  const removeBookmark = useCallback(async (id) => {
    if (user) {
      const docRef = doc(db, "users", user.uid, "bookmarks", id);
      await setDoc(docRef, {}, { merge: false });
    } else {
      localStorage.removeItem(`haven-calendar-verse-bookmark-${id}`);
    }
    fetchBookmarks();
  }, [user, fetchBookmarks]);

  return (
    <div className={styles.homeContainer}>
      <div className={styles.mainCard}>
        {/* App Name Header */}
        <div className={styles.appHeader}>
          <div className={styles.appLogo}>
            <img src="/haven-icon.svg" alt="Haven Bible Icon" className={styles.appIcon} />
            <div className={styles.appTitle}>
              <div className={styles.appName}>Haven</div>
              <div className={styles.appSubtitle}>Your Bible Companion</div>
            </div>
          </div>
        </div>
        
        {/* Greeting Card - Only show when data is loaded */}
        {isLoaded ? (
          <div className={styles.greetingCard}>
            <div className={styles.greetingTitle}>{greeting}{name ? `, ${name}` : "!"}</div>
            <div className={styles.greetingDesc}>Let's start your spiritual journey</div>
          </div>
        ) : (
          <div className={styles.greetingCard}>
            <div className={styles.greetingTitle}>Loading...</div>
            <div className={styles.greetingDesc}>Please wait</div>
          </div>
        )}
        
        {/* Trial Banner - Only show when subscription data is loaded */}
        {subscriptionLoaded ? (
          <TrialBanner 
            userType={userType}
            dailyChatsUsed={dailyChatsUsed}
            dailyChatLimit={dailyChatLimit}
            onUpgrade={() => window.location.href = '/pricing'}
          />
        ) : (
          <div className={styles.banner}>
            <div className={styles.content}>
              <div className={styles.text}>
                <div className={styles.title}>Loading...</div>
              </div>
            </div>
          </div>
        )}
        
        {/* Reset Buttons - Only show when user is logged in */}
        {user && subscriptionLoaded && (
          <div style={{ 
            display: 'flex', 
            gap: '10px', 
            margin: '10px 0',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <button 
              onClick={handleRefreshSubscription}
              style={{
                padding: '8px 16px',
                background: '#17a2b8',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 'bold'
              }}
            >
              Refresh Count
            </button>
            <button 
              onClick={handleResetChatCount}
              style={{
                padding: '8px 16px',
                background: '#ffc107',
                color: 'black',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 'bold'
              }}
            >
              Reset Chat Count
            </button>
            <button 
              onClick={handleResetUserData}
              style={{
                padding: '8px 16px',
                background: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 'bold'
              }}
            >
              Reset All Data
            </button>
            <button 
              onClick={handleSetAsPremium}
              style={{
                padding: '8px 16px',
                background: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 'bold'
              }}
            >
              Set as Premium
            </button>
            <button 
              onClick={handleSetAsTrial}
              style={{
                padding: '8px 16px',
                background: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 'bold'
              }}
            >
              Set as Trial
            </button>
            <button 
              onClick={handleSetAsFree}
              style={{
                padding: '8px 16px',
                background: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 'bold'
              }}
            >
              Set as Free
            </button>
          </div>
        )}
        
        {/* Calendar Verse Card - Only show when data is loaded */}
        {isLoaded ? (
          <CalendarVerseCard verse={todaysVerseObj.text} reference={todaysVerseRef} bookmarked={calendarBookmarked} onBookmark={handleCalendarBookmark} />
        ) : (
          <div className={styles.verseCard}>
            <div className={styles.verseTitle}>Loading...</div>
            <div className={styles.verseText}>Please wait</div>
          </div>
        )}
        {/* Devotional Progress - Only show when data is loaded */}
        {isLoaded ? (
          <DevotionalProgress currentDay={currentDay} totalDays={totalDays} />
        ) : (
          <div className={styles.progressCard}>
            <div className={styles.progressLabel}>Loading...</div>
            <div className={styles.progressBarBg}>
              <div className={styles.progressBar} style={{ width: '0%' }}></div>
            </div>
          </div>
        )}
        <QuickAccess />
        
        {/* Premium Upgrade Section - Only show when subscription data is loaded */}
        {isClient && subscriptionLoaded && userType !== 'subscribed' && (
          <div className={styles.upgradeSection}>
            <div className={styles.upgradeContent}>
              <div className={styles.upgradeIcon}>⭐</div>
              <div className={styles.upgradeText}>
                <h3>Unlock Unlimited AI Conversations</h3>
                <p>Get unlimited access to AI-powered Bible study, advanced features, and personalized spiritual guidance.</p>
              </div>
              <Link href="/pricing" className={styles.upgradeButton}>
                Upgrade Now
              </Link>
            </div>
          </div>
        )}
        
        {isLoaded ? (
          <SpiritualJourneySection currentDay={currentDay} />
        ) : (
          <div className={styles.spiritualJourneySection}>
            <div className={styles.sectionTitle}>Loading...</div>
          </div>
        )}
        <BottomNav />
        {showBookmarks && (
          <div className={styles.bookmarksModalOverlay} onClick={() => setShowBookmarks(false)}>
            <div className={styles.bookmarksModal} onClick={e => e.stopPropagation()}>
              <div className={styles.bookmarksTitle}>My Bookmarks</div>
              {bookmarks.length === 0 ? (
                <div style={{ color: '#b0a597', fontFamily: 'Lora, Georgia, serif', fontSize: 18, margin: '32px 0', textAlign: 'center' }}>No bookmarks yet.</div>
              ) : (
                <ul className={styles.bookmarksList}>
                  {bookmarks.map(b => (
                    <li key={b.id} className={styles.bookmarksItem}>
                      <div className={styles.bookmarksVerse}>{b.verse}</div>
                      <div className={styles.bookmarksRef}>{b.reference}</div>
                      <button className={styles.bookmarksRemoveBtn} onClick={() => removeBookmark(b.id)} aria-label="Remove Bookmark"><Trash2 size={18} /></button>
                    </li>
                  ))}
                </ul>
              )}
              <button className={styles.bookmarksCloseBtn} onClick={() => setShowBookmarks(false)}>Close</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 