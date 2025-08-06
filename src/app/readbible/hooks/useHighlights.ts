import { useState, useEffect } from "react";
import { getHighlights, saveHighlight as saveHighlightLS, removeHighlight as removeHighlightLS } from "../utils/localBibleStorage";

export default function useHighlights() {
  const [highlights, setHighlights] = useState<Record<string, string>>({});

  useEffect(() => {
    setHighlights(getHighlights());
    const onStorage = () => setHighlights(getHighlights());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const setHighlight = (verseKey: string, color: string) => {
    saveHighlightLS(verseKey, color);
    setHighlights(getHighlights());
  };

  const removeHighlight = (verseKey: string) => {
    removeHighlightLS(verseKey);
    setHighlights(getHighlights());
  };

  return [highlights, setHighlight, removeHighlight] as const;
} 