"use client";
import React, { useState, useEffect } from "react";
import styles from "./ReadBiblePage.module.css";
import ReadBibleHeader from "./ReadBibleHeader";
import BookChapterModal from "./BookChapterModal";
import VerseOfTheDayCard from "./VerseOfTheDayCard";
import VerseCard from "./VerseCard";
import VerseActionsBar from "./VerseActionsBar";
import HighlightModal from "./HighlightModal";
import useHighlights from "./hooks/useHighlights";
import useBookmarks from "./hooks/useBookmarks";
import { Bookmark as BookmarkType } from "./utils/localBibleStorage";
import { useRouter } from "next/navigation";
import NoteModal from "./NoteModal";
import useNotes from "./hooks/useNotes";
import { auth, db } from '../../firebaseConfig';
import { doc, getDoc, setDoc } from 'firebase/firestore';
// (No MUI import needed)

const sampleBooks = ["Genesis", "Exodus", "Matthew"];
const sampleChapters = ["1", "2", "3"];
const sampleVerses = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];
const VERSION_FILES: Record<string, string> = {
  KJV: "kjv.json",
  ESV: "esv.json",
  NIV: "niv.json",
  NLT: "nlt.json",
  MSG: "msg.json",
};

const DEFAULT_POSITION = { book: 'Genesis', chapter: '1', verse: 1, version: 'KJV' };

export default function ReadBiblePage() {
  const [book, setBook] = useState("Genesis");
  const [chapter, setChapter] = useState("1");
  const [verse, setVerse] = useState("");
  const [selectedVerseId, setSelectedVerseId] = useState<number | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("haven-bible-version") || "KJV";
    }
    return "KJV";
  });
  const [bibleData, setBibleData] = useState<any>(null);
  const [fade, setFade] = useState(true);
  const [highlightModalOpen, setHighlightModalOpen] = useState(false);
  const [highlights, setHighlight, removeHighlight] = useHighlights();
  const [bookmarks, addBookmark, removeBookmark] = useBookmarks();
  const [toast, setToast] = useState<string | null>(null);
  const router = useRouter();
  const [selectedVerseObj, setSelectedVerseObj] = useState<any>(null);
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [selectedVerseKey, setSelectedVerseKey] = useState("");
  const [notes, setNote, removeNote] = useNotes();
  const [user, setUser] = useState<any>(null);
  const [pendingRestore, setPendingRestore] = useState<any>(null);
  const [lastReadPosition, setLastReadPosition] = useState(DEFAULT_POSITION);
  
  // New state for modal
  const [bookChapterModalOpen, setBookChapterModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [fontSize, setFontSize] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("haven-bible-font-size");
      return saved ? Number(saved) : 18;
    }
    return 18;
  });

  // Restore last position (fetch from Firestore/localStorage, but apply after bibleData loads)
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      setUser(firebaseUser);
      let lastPos = null;
      if (firebaseUser) {
        const posRef = doc(db, 'users', firebaseUser.uid, 'bibleLastPosition', 'last');
        const snap = await getDoc(posRef);
        if (snap.exists()) lastPos = snap.data();
      }
      if (!lastPos && typeof window !== 'undefined') {
        const saved = localStorage.getItem('haven-bible-last-position');
        if (saved) lastPos = JSON.parse(saved);
      }
      if (lastPos) {
        setPendingRestore(lastPos);
      }
    });
    return () => unsubscribe();
  }, []);

  // After bibleData loads, apply pending restore
  useEffect(() => {
    if (!pendingRestore) return;
    const { book: b, chapter: c, verse: v, version } = pendingRestore;
    // If version is not loaded yet, set it and wait for next effect
    if (version && version !== selectedVersion) {
      setSelectedVersion(version);
      return; // Wait for bibleData to reload for the correct version
    }
    if (!bibleData) return;
    if (b && bibleData[b]) setBook(b);
    if (c && bibleData[b] && bibleData[b][c]) setChapter(c);
    if (v) {
      setVerse(String(v));
      setSelectedVerseId(Number(v));
      setTimeout(() => {
        const el = document.getElementById(`verse-${v}`);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 300);
    }
    setPendingRestore(null);
    // eslint-disable-next-line
  }, [pendingRestore, bibleData, selectedVersion]);

  // Load Bible data
  useEffect(() => {
    setFade(false);
    const file = VERSION_FILES[selectedVersion];
    import(`../../data/bibles/${file}`).then((mod) => {
      setBibleData(mod.default || mod);
      setTimeout(() => setFade(true), 200);
    });
  }, [selectedVersion]);

  // Save last position every 3 seconds (interval-based, like previous version)
  useEffect(() => {
    const interval = setInterval(() => {
      const savePosition = () => {
        const positionToSave = {
          book,
          chapter,
          verse: selectedVerseId || 1,
          version: selectedVersion,
          timestamp: new Date().toISOString()
        };
        if (user) {
          const posRef = doc(db, 'users', user.uid, 'bibleLastPosition', 'last');
          setDoc(posRef, positionToSave);
        } else if (typeof window !== 'undefined') {
          localStorage.setItem('haven-bible-last-position', JSON.stringify(positionToSave));
        }
      };
      savePosition();
    }, 3000);
    return () => clearInterval(interval);
  }, [book, chapter, selectedVerseId, selectedVersion, user, db]);

  // Save version preference
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('haven-bible-version', selectedVersion);
    }
  }, [selectedVersion]);

  // Save font size to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("haven-bible-font-size", String(fontSize));
    }
  }, [fontSize]);

  // Handle page unload
  useEffect(() => {
    const handleUnload = () => {
      if (typeof window !== 'undefined') {
        const positionToSave = {
          book,
          chapter,
          verse: selectedVerseId || 1,
          version: selectedVersion,
          timestamp: new Date().toISOString()
        };
        localStorage.setItem('haven-bible-last-position', JSON.stringify(positionToSave));
      }
    };

    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [book, chapter, selectedVerseId, selectedVersion]);

  function handleBack() {
    router.push('/');
  }

  function handleVerseAction(action: string) {
    if (!selectedVerseObj) return;

    switch (action) {
      case 'bookmark':
        const bookmarkKey = `${selectedVerseObj.book}-${selectedVerseObj.chapter}-${selectedVerseObj.verse}`;
        const isBookmarked = bookmarks.some(b =>
          b.book === selectedVerseObj.book && 
          b.chapter === selectedVerseObj.chapter && 
          b.verse === selectedVerseObj.verse && 
          b.version === selectedVerseObj.version
        );
        
        if (isBookmarked) {
          const existingBookmark = bookmarks.find(b =>
            b.book === selectedVerseObj.book && 
            b.chapter === selectedVerseObj.chapter && 
            b.verse === selectedVerseObj.verse && 
            b.version === selectedVerseObj.version
          );
          if (existingBookmark) {
            removeBookmark(existingBookmark);
          }
          setToast("Bookmark removed!");
        } else {
          addBookmark({
            book: selectedVerseObj.book,
            chapter: selectedVerseObj.chapter,
            verse: selectedVerseObj.verse,
            text: selectedVerseObj.text,
            version: selectedVerseObj.version,
            savedAt: new Date().toISOString()
          });
          setToast("Bookmark added!");
        }
        setTimeout(() => setToast(null), 1800);
        break;
        
      case 'highlight':
        setHighlightModalOpen(true);
        break;
        
      case 'note':
        setSelectedVerseKey(`${selectedVerseObj.book}-${selectedVerseObj.chapter}-${selectedVerseObj.verse}`);
        setNoteModalOpen(true);
        break;
        
      case 'share':
        const text = `${selectedVerseObj.book} ${selectedVerseObj.chapter}:${selectedVerseObj.verse} (${selectedVerseObj.version})\n\n"${selectedVerseObj.text}"`;
        if (navigator.share) {
          navigator.share({
            title: 'Bible Verse',
            text: text
          });
        } else {
          navigator.clipboard.writeText(text);
          setToast("Verse copied to clipboard!");
          setTimeout(() => setToast(null), 1800);
        }
        break;
        
      case 'explain':
        // Navigate to chat page with pre-filled verse explanation request
        const explainText = `Please explain this Bible verse: ${selectedVerseObj.book} ${selectedVerseObj.chapter}:${selectedVerseObj.verse} - "${selectedVerseObj.text}"`;
        const encodedExplain = encodeURIComponent(explainText);
        router.push(`/chat?explain=${encodedExplain}&from=readbible`);
        break;
    }
  }

  function handleVersionChange(v: string) {
    setSelectedVersion(v);
  }

  function handleHighlightColor(color: string | null) {
    if (!selectedVerseObj) return;
    
    const verseKey = `${selectedVerseObj.book}-${selectedVerseObj.chapter}-${selectedVerseObj.verse}`;
    
    if (color) {
      setHighlight(verseKey, color);
      setToast("Verse highlighted!");
    } else {
      removeHighlight(verseKey);
      setToast("Highlight removed!");
    }
    
    setHighlightModalOpen(false);
    setTimeout(() => setToast(null), 1800);
  }

  // Get available options based on loaded data
  const bookOptions = bibleData ? Object.keys(bibleData) : sampleBooks;
  const chapterOptions = bibleData && bibleData[book] ? Object.keys(bibleData[book]) : sampleChapters;
  
  // Get verses for current book/chapter
  const verses =
    bibleData &&
    bibleData[book] &&
    bibleData[book][chapter]
      ? Object.entries(bibleData[book][chapter]).map(([num, text]) => ({
          num: Number(num),
          text: text as string,
        }))
      : [];

  // When verse dropdown changes, select and scroll to that verse
  function handleVerseChange(v: string) {
    setVerse(v);
    setSelectedVerseId(Number(v));
    // Optionally, scroll to the verse in the list
    setTimeout(() => {
      const el = document.getElementById(`verse-${v}`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
  }

  // New handlers for modal
  function handleBookClick() {
    setBookChapterModalOpen(true);
  }

  function handleSettingsClick() {
    setSettingsModalOpen(true);
  }

  function handleBookSelect(selectedBook: string) {
    setBook(selectedBook);
    // Reset to first chapter when book changes
    if (bibleData && bibleData[selectedBook]) {
      const firstChapter = Object.keys(bibleData[selectedBook])[0];
      setChapter(firstChapter);
    }
  }

  function handleChapterSelect(selectedChapter: string) {
    setChapter(selectedChapter);
    setBookChapterModalOpen(false);
  }

  return (
    <div className={styles.readBiblePage + ' ' + styles.bibleThemeVars}>
      {/* DEBUG: If you see this message, you are on the latest build! */}
      <div className={styles.stickyTopSection}>
        <ReadBibleHeader 
          onBack={handleBack} 
          version={selectedVersion} 
          onVersionChange={handleVersionChange}
          currentBook={book}
          currentChapter={chapter}
          onBookClick={handleBookClick}
          onSettingsClick={handleSettingsClick}
        />
      </div>
      <div className={styles.bibleContentWrapper}>
        <VerseOfTheDayCard />
        <div className={styles.chapterHeading}>{book} {chapter} <span style={{fontSize:12, color:"#A68A64"}}>({selectedVersion})</span></div>
        <div className={styles.versesList} style={{ opacity: fade ? 1 : 0, transition: "opacity 0.4s" }}>
          {verses.map(v => {
            const isBookmarked = bookmarks.some(b =>
              b.book === book && b.chapter === chapter && b.verse === v.num && b.version === selectedVersion
            );
            const verseKey = `${book}-${chapter}-${v.num}`;
            const highlightColor = highlights[verseKey];
            const noteExists = !!notes[verseKey];
            return (
              <VerseCard
                key={v.num}
                verseNum={v.num}
                text={v.text}
                selected={selectedVerseId === v.num}
                onSelect={() => {
                  setSelectedVerseId(v.num);
                  setVerse(String(v.num));
                  setSelectedVerseObj({
                    book,
                    chapter,
                    verse: v.num,
                    text: v.text,
                    version: selectedVersion,
                  });
                }}
                id={`verse-${v.num}`}
                highlightColor={highlightColor}
                bookmarked={isBookmarked}
                noteExists={noteExists}
                fontSize={fontSize}
              />
            );
          })}
        </div>
        <VerseActionsBar
          visible={selectedVerseId !== null}
          onAction={handleVerseAction}
          selectedVerse={selectedVerseObj}
        />
        <HighlightModal
          open={highlightModalOpen}
          onClose={() => setHighlightModalOpen(false)}
          onSelectColor={handleHighlightColor}
        />
        <NoteModal
          open={noteModalOpen}
          onClose={() => setNoteModalOpen(false)}
          onSave={noteText => {
            setNote(selectedVerseKey, noteText);
            setNoteModalOpen(false);
            setToast("Note saved!");
            setTimeout(() => setToast(null), 1800);
          }}
          onDelete={() => {
            removeNote(selectedVerseKey);
            setNoteModalOpen(false);
            setToast("Note deleted.");
            setTimeout(() => setToast(null), 1800);
          }}
          verseLabel={selectedVerseObj ? `${selectedVerseObj.book} ${selectedVerseObj.chapter}:${selectedVerseObj.verse} (${selectedVerseObj.version})` : selectedVerseKey}
          initialValue={notes[selectedVerseKey] || ""}
        />
        
        {/* Book/Chapter Selection Modal */}
        <BookChapterModal
          isOpen={bookChapterModalOpen}
          onClose={() => setBookChapterModalOpen(false)}
          currentBook={book}
          currentChapter={chapter}
          onBookSelect={handleBookSelect}
          onChapterSelect={handleChapterSelect}
          bookOptions={bookOptions}
          chapterOptions={chapterOptions}
        />
        
        {/* Font Size Modal */}
        {settingsModalOpen && (
          <div className={styles.modalOverlay} onClick={e => { if (e.target === e.currentTarget) setSettingsModalOpen(false); }}>
            <div className={styles.bottomSheet}>
              <div className={styles.grabHandle} />
              <div style={{padding: 24, textAlign: 'center'}}>
                <div style={{fontWeight: 'bold', fontSize: 18, marginBottom: 16}}>Adjust the font size</div>
                <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16}}>
                  <span style={{fontSize: 16}}>T</span>
                  <input
                    type="range"
                    min={14}
                    max={32}
                    value={fontSize}
                    onChange={e => setFontSize(Number(e.target.value))}
                    style={{flex: 1, accentColor: '#6b5c4a'}}
                  />
                  <span style={{fontSize: 24}}>T</span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {toast && (
          <div style={{
            position: "fixed",
            bottom: 90,
            left: 0,
            right: 0,
            margin: "0 auto",
            maxWidth: 340,
            background: "#FFF9C4",
            color: "#6b5c4a",
            borderRadius: 16,
            boxShadow: "0 2px 8px 0 rgba(158,145,136,0.10)",
            padding: "12px 24px",
            textAlign: "center",
            fontFamily: 'Lora, Georgia, serif',
            fontSize: 16,
            zIndex: 2000,
            transition: "opacity 0.3s",
          }}>{toast}</div>
        )}
      </div>
    </div>
  );
} 