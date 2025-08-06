import React from "react";
import useBookmarks from "./hooks/useBookmarks";
import { Bookmark } from "./utils/localBibleStorage";
import { ArrowLeft } from "lucide-react";

export default function BookmarksPage({ onGoToVerse }: { onGoToVerse?: (b: Bookmark) => void }) {
  const [bookmarks, , removeBookmark] = useBookmarks();

  return (
    <div style={{ background: "#FAF7F3", minHeight: "100vh", padding: 0 }}>
      {/* Header */}
      <div style={{
        position: "relative",
        maxWidth: 420,
        margin: "0 auto",
        padding: 0,
        background: "#FAF4EB",
        boxShadow: "0 2px 12px 0 rgba(90,70,50,0.08)",
        borderBottomLeftRadius: 18,
        borderBottomRightRadius: 18,
        minHeight: 70,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        {/* Back Arrow Button (copied from chat page) */}
        <button
          onClick={() => window.location.href = "/"}
          style={{
            position: "fixed",
            top: 24,
            left: 16,
            zIndex: 30,
            background: "#ded0c4",
            border: "none",
            borderRadius: "50%",
            width: 44,
            height: 44,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 1px 4px 0 rgba(158,145,136,0.04)",
            cursor: "pointer",
          }}
          aria-label="Back to Home"
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#5C4033" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        {/* Centered Title with Icon */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          fontFamily: 'Playfair Display, Georgia, serif',
          fontSize: 24,
          color: '#6b5c4a',
          fontWeight: 700,
          margin: "0 auto"
        }}>
          <span role="img" aria-label="Bookmarks" style={{ fontSize: 22, marginRight: 2 }}>🔖</span>
          My Bookmarks
        </div>
      </div>
      {/* Bookmarks List */}
      <div style={{ position: "relative", maxWidth: 420, margin: "0 auto", padding: "0 0 32px 0" }}>
        {bookmarks.length === 0 ? (
          <div style={{ color: '#b0a597', fontFamily: 'Lora, Georgia, serif', fontSize: 18, marginTop: 32, textAlign: 'center' }}>
            No bookmarks yet.<br />Tap the bookmark icon on any verse to save it here!
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 18, marginTop: 18 }}>
            {bookmarks.map((b, i) => (
              <div key={i} style={{
                background: "#FFFDF9",
                borderRadius: 18,
                boxShadow: "0 2px 8px 0 rgba(158,145,136,0.08)",
                padding: "18px 18px 14px 18px",
                position: "relative",
                cursor: "pointer"
              }}
                onClick={() => onGoToVerse ? onGoToVerse(b) : console.log("Go to", b)}
                tabIndex={0}
                role="button"
                aria-label={`Go to ${b.book} ${b.chapter}:${b.verse}`}
              >
                <div style={{ fontFamily: 'Lora, Georgia, serif', fontSize: 17, color: '#A68A64', marginBottom: 4 }}>
                  {b.book} {b.chapter}:{b.verse} <span style={{ fontSize: 13, color: '#b0a597' }}>({b.version})</span>
                </div>
                <div style={{ fontFamily: 'Georgia, serif', fontSize: 16, color: '#5B4B36', marginBottom: 6 }}>
                  {b.text}
                </div>
                <button
                  onClick={e => { e.stopPropagation(); removeBookmark(b); }}
                  style={{
                    position: "absolute",
                    top: 10,
                    right: 10,
                    background: "#F6F1EB",
                    color: "#A68A64",
                    border: "none",
                    borderRadius: 10,
                    padding: "4px 10px",
                    fontSize: 14,
                    cursor: "pointer",
                    fontFamily: 'Lora, Georgia, serif',
                    boxShadow: "0 1px 4px 0 rgba(158,145,136,0.04)",
                  }}
                  aria-label="Remove Bookmark"
                >Remove</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 