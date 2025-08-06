import React from "react";
import styles from "./ReadBiblePage.module.css";
import { Highlighter, Bookmark, MessageCircle, Notebook } from "lucide-react";

export default function VerseActionsBar({ visible, onAction, selectedVerse } : { visible: boolean; onAction: (action: string) => void; selectedVerse?: any }) {
  if (!visible) return null;
  return (
    <div className={styles.verseActionsBar}>
      <button className={styles.verseActionBtn} onClick={() => onAction("highlight")}> <Highlighter size={22} /> <div>Highlight</div> </button>
      <button className={styles.verseActionBtn} onClick={() => onAction("bookmark")}> <Bookmark size={22} /> <div>Bookmark</div> </button>
      <button className={styles.verseActionBtn} onClick={() => onAction("explain")} disabled={!selectedVerse}> <MessageCircle size={22} /> <div>Explain</div> </button>
      <button className={styles.verseActionBtn} onClick={() => onAction("note")}> <Notebook size={22} /> <div>Add Note</div> </button>
    </div>
  );
} 