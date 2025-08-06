"use client";
import React, { useEffect, useState } from "react";
import styles from "./JournalPage.module.css";
import { Plus, Edit, Trash2, ArrowLeft, User } from "lucide-react";
import { auth } from "../../firebaseConfig";
import {
  getUserJournals,
  addJournalEntry,
  updateJournalEntry,
  deleteJournalEntry,
  JournalEntry,
} from "./journalService";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";

function formatDate(dateString: string) {
  const d = new Date(dateString);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

function EntryModal({ open, onClose, onSave, entry }: any) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [verse, setVerse] = useState("");
  const isEdit = !!entry;
  React.useEffect(() => {
    if (isEdit && entry) {
      setTitle(entry.title || "");
      setBody(entry.body || "");
      setVerse(entry.verse || "");
    } else {
      setTitle("");
      setBody("");
      setVerse("");
    }
  }, [open, entry, isEdit]);
  if (!open) return null;
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        <div style={{ fontWeight: 700, marginBottom: 18 }}>{isEdit ? "Edit Entry" : "New Journal Entry"}</div>
        <form
          onSubmit={e => {
            e.preventDefault();
            onSave({ title, body, verse });
          }}
        >
          <div className={styles.formField}>
            <input
              className={styles.input}
              type="text"
              placeholder="Title (e.g. My Reflection)"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
            />
          </div>
          <div className={styles.formField}>
            <textarea
              className={styles.textarea}
              placeholder="Write your reflection... (e.g. Today I felt...)"
              value={body}
              onChange={e => setBody(e.target.value)}
              required
            />
          </div>
          <div className={styles.formField}>
            <input
              className={styles.input}
              type="text"
              placeholder="Associated Verse (optional, e.g. John 3:16)"
              value={verse}
              onChange={e => setVerse(e.target.value)}
            />
          </div>
          <button className={styles.saveButton} type="submit">
            {isEdit ? "Save Changes" : "Save Entry"}
          </button>
          <button className={styles.cancelButton} type="button" onClick={onClose}>
            Cancel
          </button>
        </form>
      </div>
    </div>
  );
}

function EntryDetailModal({ open, onClose, entry }: any) {
  if (!open) return null;
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        <div className={styles.entryTitle} style={{ marginBottom: 8 }}>{entry.title}</div>
        <div className={styles.entryBodyPreview} style={{ marginBottom: 12 }}>{entry.body}</div>
        {entry.verse && <div className={styles.entryDate} style={{ marginBottom: 12 }}>Verse: {entry.verse}</div>}
        <div className={styles.entryDate}>{formatDate(entry.date)}</div>
        <button className={styles.cancelButton} style={{ marginTop: 18 }} onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

export default function JournalPage() {
  const [user, setUser] = useState(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editEntry, setEditEntry] = useState<JournalEntry | null>(null);
  const [detailEntry, setDetailEntry] = useState<JournalEntry | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setUserId(firebaseUser ? firebaseUser.uid : null);
      setCheckingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  async function fetchEntries() {
    if (!userId) return;
    setLoading(true);
    setError("");
    try {
      const data = await getUserJournals(userId);
      setEntries(data);
    } catch (err) {
      setError("Failed to load journal entries.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (userId) {
      fetchEntries();
    } else {
      setEntries([]);
    }
  }, [userId]);

  // Check for pre-filled journal data from devotionals page
  useEffect(() => {
    const prefillData = localStorage.getItem('haven-journal-prefill');
    if (prefillData && !modalOpen) {
      try {
        const data = JSON.parse(prefillData);
        setEditEntry({
          id: '',
          title: data.title,
          body: data.body,
          verse: data.verse,
          date: new Date().toISOString(),
          userId: userId || '',
        });
        setModalOpen(true);
        // Clear the prefill data after using it
        localStorage.removeItem('haven-journal-prefill');
      } catch (err) {
        console.error('Error parsing prefill data:', err);
        localStorage.removeItem('haven-journal-prefill');
      }
    }
  }, [userId, modalOpen]);

  async function handleSave(newEntry: { title: string; body: string; verse?: string }) {
    if (!userId) return;
    setLoading(true);
    setError("");
    try {
      if (editEntry) {
        await updateJournalEntry(editEntry.id, { ...newEntry });
      } else {
        await addJournalEntry({
          title: newEntry.title,
          body: newEntry.body,
          verse: newEntry.verse,
          date: new Date().toISOString(),
          userId,
        });
        
        // Increment journal entry count in user profile
        try {
          const { incrementUserStat } = await import('../profile/profileService');
          await incrementUserStat(userId, 'totalJournalEntries');
        } catch (error) {
          console.error('Failed to increment journal count:', error);
        }
      }
      await fetchEntries();
      setEditEntry(null);
      setModalOpen(false);
    } catch (err) {
      setError("Failed to save entry.");
    } finally {
      setLoading(false);
  }
  }

  async function handleDelete(id: string) {
    if (!userId) return;
    setLoading(true);
    setError("");
    try {
      await deleteJournalEntry(id);
      await fetchEntries();
    } catch (err) {
      setError("Failed to delete entry.");
    } finally {
      setLoading(false);
    }
  }

  if (checkingAuth) {
    return <div className={styles.container}><div className={styles.title}>Journal</div><div>Checking authentication...</div></div>;
  }

  if (!userId) {
    return <div className={styles.container}><div className={styles.title}>Journal</div><div>Please sign in to view your journal.</div></div>;
  }

  return (
    <div className={styles.container} style={{ padding: '0 1rem', minHeight: '100vh' }}>
      {/* Back Button (fixed, Chat style, exact SVG) */}
      <button
        onClick={() => router.back()}
        style={{
          position: 'fixed',
          top: 24,
          left: 16,
          zIndex: 30,
          background: '#ded0c4',
          border: 'none',
          borderRadius: '50%',
          width: 44,
          height: 44,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 1px 4px 0 rgba(158,145,136,0.04)',
          cursor: 'pointer',
        }}
        aria-label="Back to Home"
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#5C4033" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>
      {/* Centered Journal Title */}
      <div style={{ width: '100%', maxWidth: 390, margin: '56px auto 0 auto', textAlign: 'center' }}>
        <div className={styles.title} style={{ margin: 0 }}>Journal</div>
      </div>
      {/* New Entry Button */}
      <button className={styles.newEntryButton} onClick={() => { setEditEntry(null); setModalOpen(true); }} disabled={loading}>
        New Entry
      </button>
      {/* Previous Entries label */}
      <div className={styles.subtitle} style={{ margin: '0 0 18px 0', textAlign: 'left', maxWidth: 390, marginLeft: 'auto', marginRight: 'auto' }}>Previous Entries</div>
      {/* Entries Section */}
      {loading ? (
        <div>Loading...</div>
      ) : entries.length === 0 ? (
        <div style={{ color: '#b0a597', fontFamily: 'Lora, Georgia, serif', fontSize: 18, marginTop: 32, textAlign: 'center' }}>
          No journal entries yet.<br />Start your spiritual journey by adding your first entry!
        </div>
      ) : (
      <div className={styles.entryList}>
        {entries.map((entry: any) => (
          <div
            className={styles.entryCard}
            key={entry.id}
            tabIndex={0}
            role="button"
            aria-label={entry.title}
            onClick={() => setDetailEntry(entry)}
              style={{ padding: '20px 16px 16px 16px', margin: '0 0 12px 0' }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div className={styles.entryTitle} style={{ textAlign: 'left', marginBottom: 0 }}>{entry.title}</div>
                <div className={styles.entryIcons} style={{ position: 'static', gap: 6, marginLeft: 8 }} onClick={e => e.stopPropagation()}>
                  <button className={styles.iconButton} onClick={() => { setEditEntry(entry); setModalOpen(true); }} aria-label="Edit Entry" disabled={loading}>
                <Edit size={18} />
              </button>
                  <button className={styles.iconButton} onClick={() => handleDelete(entry.id)} aria-label="Delete Entry" disabled={loading}>
                <Trash2 size={18} />
              </button>
            </div>
              </div>
              <div className={styles.entryBodyPreview} style={{ textAlign: 'left', margin: '8px 0 6px 0' }}>{entry.body.slice(0, 80)}{entry.body.length > 80 ? "..." : ""}</div>
              <div className={styles.entryDate} style={{ textAlign: 'left', fontSize: 14, color: '#b0a597', marginTop: 0 }}>{formatDate(entry.date)}</div>
          </div>
        ))}
      </div>
      )}
      <button className={styles.fab} onClick={() => { setEditEntry(null); setModalOpen(true); }} aria-label="Add Journal Entry" disabled={loading}>
        <Plus size={32} />
      </button>
      <EntryModal open={modalOpen} onClose={() => { setModalOpen(false); setEditEntry(null); }} onSave={handleSave} entry={editEntry} />
      <EntryDetailModal open={!!detailEntry} onClose={() => setDetailEntry(null)} entry={detailEntry} />
    </div>
  );
} 