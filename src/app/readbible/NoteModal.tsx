import React, { useState, useEffect } from "react";

export default function NoteModal({ open, onClose, onSave, onDelete, initialValue = "", verseLabel }) {
  const [note, setNote] = useState(initialValue);

  useEffect(() => {
    if (open) setNote(initialValue);
  }, [open, initialValue]);

  if (!open) return null;

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "rgba(90,70,50,0.18)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 2000,
    }}>
      <div style={{
        background: "#fff9f3",
        borderRadius: 24,
        boxShadow: "0 4px 24px 0 rgba(90,70,50,0.10)",
        width: "90%",
        maxWidth: 380,
        padding: 28,
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
      }}>
        <div style={{ fontSize: 22, fontFamily: 'Playfair Display, Georgia, serif', color: '#6b5c4a', marginBottom: 8, textAlign: 'center' }}>📝 Add Note</div>
        <div style={{ fontSize: 15, fontFamily: 'Playfair Display, Georgia, serif', color: '#A68A64', marginBottom: 12, textAlign: 'center' }}>{verseLabel}</div>
        <textarea
          style={{
            width: "100%",
            minHeight: 90,
            maxHeight: 180,
            padding: 12,
            fontSize: 15,
            borderRadius: 14,
            border: "1.5px solid #e6dccc",
            fontFamily: 'Inter, sans-serif',
            color: '#5B4B36',
            outline: 'none',
            marginBottom: 18,
            resize: 'vertical',
            background: '#fdf7f2',
          }}
          placeholder="Write your thoughts..."
          value={note}
          onChange={e => setNote(e.target.value)}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
          {initialValue && initialValue.trim() && (
            <button
              style={{
                fontSize: 15,
                color: '#fff',
                background: '#e6b0a7',
                border: 'none',
                borderRadius: 10,
                padding: '8px 18px',
                fontFamily: 'Lora, Georgia, serif',
                cursor: 'pointer',
                boxShadow: '0 1px 4px 0 rgba(158,145,136,0.04)',
                transition: 'background 0.15s',
              }}
              onClick={() => { if (onDelete) onDelete(); }}
            >Delete</button>
          )}
          <div style={{ display: 'flex', gap: 12, marginLeft: 'auto' }}>
            <button
              style={{
                fontSize: 15,
                color: '#A68A64',
                background: 'none',
                border: 'none',
                borderRadius: 10,
                padding: '8px 18px',
                fontFamily: 'Lora, Georgia, serif',
                cursor: 'pointer',
                transition: 'background 0.15s',
              }}
              onClick={onClose}
            >Cancel</button>
            <button
              style={{
                fontSize: 15,
                color: '#fff',
                background: '#d6bfae',
                border: 'none',
                borderRadius: 10,
                padding: '8px 18px',
                fontFamily: 'Lora, Georgia, serif',
                cursor: 'pointer',
                boxShadow: '0 1px 4px 0 rgba(158,145,136,0.04)',
                transition: 'background 0.15s',
              }}
              onClick={() => onSave(note)}
            >Save Note</button>
          </div>
        </div>
      </div>
    </div>
  );
} 