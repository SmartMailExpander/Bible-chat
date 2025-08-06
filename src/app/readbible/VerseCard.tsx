import React from "react";
import styles from "./ReadBiblePage.module.css";

export default function VerseCard({
  verseNum,
  text,
  selected,
  onSelect,
  id,
  highlightColor,
  bookmarked,
  noteExists,
  fontSize
}: {
  verseNum: number;
  text: string;
  selected: boolean;
  onSelect: () => void;
  id?: string;
  highlightColor?: string;
  bookmarked?: boolean;
  noteExists?: boolean;
  fontSize?: number;
}) {
  return (
    <div
      id={id}
      className={
        styles.verseCard +
        (selected ? " " + styles.verseCardSelected : "")
      }
      onClick={onSelect}
      tabIndex={0}
      role="button"
      aria-label={`Verse ${verseNum}`}
      style={highlightColor ? { background: highlightColor, transition: "background 0.3s" } : {}}
    >
      {bookmarked && (
        <span style={{
          position: "absolute",
          top: 6,
          right: 10,
          fontSize: 18,
          color: "#A68A64",
          pointerEvents: "none"
        }} title="Bookmarked" aria-label="Bookmarked">🔖</span>
      )}
      {noteExists && (
        <span style={{
          position: "absolute",
          top: 6,
          left: 10,
          fontSize: 18,
          color: "#A68A64",
          pointerEvents: "none"
        }} title="Note" aria-label="Note">📝</span>
      )}
      <span className={styles.verseNum}>{verseNum}</span>
      <span className={styles.verseText} style={fontSize ? { fontSize } : {}}>{text}</span>
    </div>
  );
} 