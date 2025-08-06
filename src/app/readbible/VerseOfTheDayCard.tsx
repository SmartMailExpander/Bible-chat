import React, { useEffect, useState } from "react";
import styles from "./ReadBiblePage.module.css";

export default function VerseOfTheDayCard() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    setTimeout(() => setVisible(true), 100);
  }, []);
  return (
    <div className={styles.verseOfDayCard + (visible ? " " + styles.fadeIn : "") }>
      <div className={styles.verseOfDayHeader}><em>Verse of the Day</em></div>
      <div className={styles.verseOfDayText}>
        “For I know the plans I have for you,” declares the Lord, “plans to prosper you and not to harm you, plans to give you hope and a future.”
      </div>
      <div className={styles.verseOfDayRef}>Jeremiah 29:11</div>
    </div>
  );
} 