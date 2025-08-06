// Utility for Bible app local storage

export const getHighlights = () =>
  JSON.parse(localStorage.getItem("bibleHighlights") || "{}") as Record<string, string>;

export const saveHighlight = (verseKey: string, color: string) => {
  const highlights = getHighlights();
  highlights[verseKey] = color;
  localStorage.setItem("bibleHighlights", JSON.stringify(highlights));
};

export const removeHighlight = (verseKey: string) => {
  const highlights = getHighlights();
  delete highlights[verseKey];
  localStorage.setItem("bibleHighlights", JSON.stringify(highlights));
};

export interface Bookmark {
  book: string;
  chapter: string;
  verse: number;
  version: string;
  text: string;
  savedAt: string;
}

export const getBookmarks = (): Bookmark[] =>
  JSON.parse(localStorage.getItem("bibleBookmarks") || "[]");

export const saveBookmark = (bookmark: Bookmark) => {
  const bookmarks = getBookmarks();
  // Prevent duplicate (same book/chapter/verse/version)
  if (!bookmarks.some(b => b.book === bookmark.book && b.chapter === bookmark.chapter && b.verse === bookmark.verse && b.version === bookmark.version)) {
    bookmarks.push(bookmark);
    localStorage.setItem("bibleBookmarks", JSON.stringify(bookmarks));
  }
};

export const removeBookmark = (bookmark: Bookmark) => {
  const bookmarks = getBookmarks().filter(b =>
    !(b.book === bookmark.book && b.chapter === bookmark.chapter && b.verse === bookmark.verse && b.version === bookmark.version)
  );
  localStorage.setItem("bibleBookmarks", JSON.stringify(bookmarks));
};

export const getNotes = () =>
  JSON.parse(localStorage.getItem("bibleNotes") || "{}") as Record<string, string>;

export const saveNote = (verseKey: string, note: string) => {
  const notes = getNotes();
  notes[verseKey] = note;
  localStorage.setItem("bibleNotes", JSON.stringify(notes));
};

export const removeNote = (verseKey: string) => {
  const notes = getNotes();
  delete notes[verseKey];
  localStorage.setItem("bibleNotes", JSON.stringify(notes));
}; 