import React, { useState } from "react";
import styles from "./ReadBiblePage.module.css";

interface BookChapterModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBook: string;
  currentChapter: string;
  onBookSelect: (book: string) => void;
  onChapterSelect: (chapter: string) => void;
  bookOptions: string[];
  chapterOptions: string[];
}

export default function BookChapterModal({
  isOpen,
  onClose,
  currentBook,
  currentChapter,
  onBookSelect,
  onChapterSelect,
  bookOptions,
  chapterOptions
}: BookChapterModalProps) {
  const [selectedBook, setSelectedBook] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleBookClick = (book: string) => {
    if (selectedBook === book) {
      setSelectedBook(null);
    } else {
      setSelectedBook(book);
    }
  };

  const handleChapterClick = (chapter: string) => {
    if (selectedBook) {
      onBookSelect(selectedBook);
    }
    onChapterSelect(chapter);
    onClose();
    setSelectedBook(null);
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
      setSelectedBook(null);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={handleOverlayClick}>
      <div className={styles.bottomSheet}>
        {/* Grab Handle */}
        <div className={styles.grabHandle} />
        
        {/* Content */}
        <div className={styles.bottomSheetContent}>
          {!selectedBook ? (
            // Book Selection
            <div className={styles.bookList}>
              {bookOptions.map((book) => (
                <div key={book} className={styles.bookItem}>
                  <button
                    className={styles.bookButton}
                    onClick={() => handleBookClick(book)}
                  >
                    {book}
                  </button>
                  <button
                    className={styles.expandButton}
                    onClick={() => handleBookClick(book)}
                  >
                    +
                  </button>
                </div>
              ))}
            </div>
          ) : (
            // Chapter Selection
            <div className={styles.chapterSelection}>
              <div className={styles.chapterHeader}>
                <button
                  className={styles.backButton}
                  onClick={() => setSelectedBook(null)}
                >
                  ← {selectedBook}
                </button>
                <button
                  className={styles.closeButton}
                  onClick={() => setSelectedBook(null)}
                >
                  ×
                </button>
              </div>
              <div className={styles.chapterGrid}>
                {chapterOptions.map((chapter) => (
                  <button
                    key={chapter}
                    className={`${styles.chapterButton} ${
                      chapter === currentChapter ? styles.chapterButtonActive : ''
                    }`}
                    onClick={() => handleChapterClick(chapter)}
                  >
                    {chapter}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 