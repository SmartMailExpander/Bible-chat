import React from "react";
import styles from "./ReadBiblePage.module.css";

interface BibleVersionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentVersion: string;
  versions: string[];
  onVersionSelect: (version: string) => void;
}

export default function BibleVersionModal({
  isOpen,
  onClose,
  currentVersion,
  versions,
  onVersionSelect,
}: BibleVersionModalProps) {
  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={handleOverlayClick}>
      <div className={styles.bottomSheet} style={{ marginBottom: 32 }}>
        <div className={styles.grabHandle} />
        <div className={styles.bottomSheetContent}>
          <div style={{ fontWeight: 'bold', fontSize: 18, margin: '16px 0 12px 0', textAlign: 'center' }}>
            Select Bible Version
          </div>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 0,
            maxHeight: 320,
            minHeight: 220,
            overflowY: 'auto',
            marginBottom: 8,
            borderRadius: 12,
            background: '#f8f6f3',
          }}>
            {versions.map((version) => (
              <button
                key={version}
                className={styles.bookButton}
                style={{
                  background: version === currentVersion ? '#F6F1EB' : 'none',
                  color: version === currentVersion ? '#A68A64' : undefined,
                  fontWeight: version === currentVersion ? 700 : 500,
                  borderBottom: '1px solid #E8E0D8',
                  padding: '18px 0',
                  fontSize: 16,
                  textAlign: 'left',
                  cursor: 'pointer',
                }}
                onClick={() => onVersionSelect(version)}
                aria-label={version}
              >
                {version}
                {version === currentVersion && (
                  <span style={{ float: 'right', color: '#A68A64', fontWeight: 700 }}>✓</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}