import React, { useState } from "react";
import styles from "./ReadBiblePage.module.css";
import BibleVersionModal from "./BibleVersionModal";

const VERSIONS = ["KJV", "ESV", "NIV", "NLT", "MSG"];

export default function BibleVersionSelector({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [modalOpen, setModalOpen] = useState(false);

  const handleToggle = () => {
    setModalOpen((v) => !v);
  };

  const handleVersionSelect = (version: string) => {
    onChange(version);
    setModalOpen(false);
  };

  return (
    <>
      <div className={styles.versionSelectorWrap}>
        <button
          className={styles.pillButtonSecondary}
          onClick={handleToggle}
          aria-label="Select Bible Version"
          type="button"
        >
          <span>{value}</span>
          <span style={{ marginLeft: 4, fontSize: 12 }}>▼</span>
        </button>
      </div>
      <BibleVersionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        currentVersion={value}
        versions={VERSIONS}
        onVersionSelect={handleVersionSelect}
      />
    </>
  );
} 