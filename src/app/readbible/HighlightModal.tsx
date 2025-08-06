import React from "react";

const COLORS = [
  { name: "Buttercream Yellow", value: "#FFF9C4" },
  { name: "Mint Green", value: "#D0F0C0" },
  { name: "Rose Quartz Pink", value: "#FADADD" },
  { name: "Sky Blue", value: "#CDEFFF" },
];

export default function HighlightModal({ open, onClose, onSelectColor }: {
  open: boolean;
  onClose: () => void;
  onSelectColor: (color: string | null) => void;
}) {
  if (!open) return null;
  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      width: "100vw",
      height: "100vh",
      background: "rgba(90,70,50,0.18)",
      zIndex: 1000,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        style={{
          background: "#FAF4EB",
          borderRadius: 24,
          boxShadow: "0 4px 24px 0 rgba(90,70,50,0.10)",
          padding: 28,
          minWidth: 260,
          maxWidth: 320,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: 20, color: '#6b5c4a', marginBottom: 18 }}>Highlight Verse</div>
        <div style={{ display: "flex", gap: 18, marginBottom: 18 }}>
          {COLORS.map(c => (
            <button
              key={c.value}
              onClick={() => onSelectColor(c.value)}
              style={{
                width: 38,
                height: 38,
                borderRadius: "50%",
                border: "2px solid #e5dcd3",
                background: c.value,
                boxShadow: "0 1px 4px 0 rgba(158,145,136,0.08)",
                cursor: "pointer",
                outline: "none",
                transition: "box-shadow 0.2s",
              }}
              aria-label={c.name}
            />
          ))}
        </div>
        <button
          onClick={() => onSelectColor(null)}
          style={{
            background: "#F6F1EB",
            color: "#A68A64",
            border: "none",
            borderRadius: 12,
            padding: "8px 18px",
            fontSize: 15,
            marginBottom: 10,
            cursor: "pointer",
            fontFamily: 'Lora, Georgia, serif',
            boxShadow: "0 1px 4px 0 rgba(158,145,136,0.04)",
          }}
        >Remove Highlight</button>
        <button
          onClick={onClose}
          style={{
            background: "#FFFDF9",
            color: "#b0a597",
            border: "none",
            borderRadius: 12,
            padding: "8px 18px",
            fontSize: 15,
            cursor: "pointer",
            fontFamily: 'Lora, Georgia, serif',
            boxShadow: "0 1px 4px 0 rgba(158,145,136,0.04)",
          }}
        >Cancel</button>
      </div>
    </div>
  );
} 