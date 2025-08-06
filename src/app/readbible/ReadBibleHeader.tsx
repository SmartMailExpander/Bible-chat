import React from "react";
import styles from "./ReadBiblePage.module.css";
import { Type } from "lucide-react";
import BibleVersionSelector from "./BibleVersionSelector";

export default function ReadBibleHeader({ 
  onBack, 
  version, 
  onVersionChange, 
  currentBook, 
  currentChapter,
  onBookClick,
  onSettingsClick 
}: { 
  onBack: () => void; 
  version: string; 
  onVersionChange: (v: string) => void;
  currentBook: string;
  currentChapter: string;
  onBookClick: () => void;
  onSettingsClick: () => void;
}) {
  return (
    <header className={styles.headerBar}>
      {/* Back Button - integrated into header */}
      <button
        onClick={onBack}
        className={styles.headerBackButton}
        aria-label="Back to Home"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#5C4033" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>
      
      <div className={styles.headerNavigation}>
        <button 
          className={styles.pillButton} 
          onClick={onBookClick}
          aria-label="Select book and chapter"
        >
          {currentBook} {currentChapter}
        </button>
        <BibleVersionSelector value={version} onChange={onVersionChange} />
      </div>
      
      <button 
        className={styles.settingsButton} 
        onClick={onSettingsClick}
        aria-label="Text settings"
      >
        <Type size={20} />
      </button>
    </header>
  );
} 