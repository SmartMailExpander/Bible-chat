import { useState, useEffect } from "react";
import { getNotes, saveNote as saveNoteLS, removeNote as removeNoteLS } from "../utils/localBibleStorage";

export default function useNotes() {
  const [notes, setNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    setNotes(getNotes());
    const onStorage = () => setNotes(getNotes());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const setNote = (verseKey: string, note: string) => {
    saveNoteLS(verseKey, note);
    setNotes(getNotes());
  };

  const removeNote = (verseKey: string) => {
    removeNoteLS(verseKey);
    setNotes(getNotes());
  };

  return [notes, setNote, removeNote] as const;
} 