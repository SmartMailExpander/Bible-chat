import React from "react";
import styles from "./ReadBiblePage.module.css";

interface DropdownProps {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  disabled?: boolean;
}

function PillDropdown({ label, value, options, onChange, disabled }: DropdownProps) {
  return (
    <div className={styles.pillDropdown}>
      <label className={styles.pillDropdownLabel}>{label}</label>
      <select
        className={styles.pillDropdownSelect}
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
      >
        {options.map(opt => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  );
}

export default function DropdownSelectors({
  book, chapter, verse, onBookChange, onChapterChange, onVerseChange,
  bookOptions, chapterOptions, verseOptions
}: {
  book: string;
  chapter: string;
  verse: string;
  onBookChange: (v: string) => void;
  onChapterChange: (v: string) => void;
  onVerseChange: (v: string) => void;
  bookOptions: string[];
  chapterOptions: string[];
  verseOptions: string[];
}) {
  return (
    <div className={styles.dropdownRow}>
      <PillDropdown label="Book" value={book} options={bookOptions} onChange={onBookChange} />
      <PillDropdown label="Chapter" value={chapter} options={chapterOptions} onChange={onChapterChange} />
      <PillDropdown label="Verse" value={verse} options={verseOptions} onChange={onVerseChange} />
    </div>
  );
} 