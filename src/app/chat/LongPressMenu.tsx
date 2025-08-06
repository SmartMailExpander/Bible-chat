import React from 'react';

interface LongPressMenuProps {
  position: { x: number; y: number };
  message: string;
  onClose: () => void;
  onCopy: () => void;
  onShare: () => void;
  onShareAll: () => void;
}

const COLORS = {
  card: '#fefefe',
  border: '#e6e0d9',
  text: '#5C4033',
  accent: '#f5f1ed',
  hover: '#ede4d9'
};

export default function LongPressMenu({ 
  position, 
  message, 
  onClose, 
  onCopy, 
  onShare, 
  onShareAll 
}: LongPressMenuProps) {
  return (
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        position: 'fixed',
        top: position.y,
        left: position.x,
        background: COLORS.card,
        borderRadius: 12,
        boxShadow: '0 4px 16px 0 rgba(90,70,50,0.15)',
        padding: 8,
        zIndex: 1000,
        border: `1px solid ${COLORS.border}`,
        minWidth: 160,
        maxWidth: 200,
      }}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onCopy();
          onClose();
        }}
        style={{
          width: '100%',
          padding: '8px 12px',
          borderRadius: 8,
          background: 'transparent',
          border: 'none',
          color: COLORS.text,
          fontSize: 14,
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          cursor: 'pointer',
          transition: 'background-color 0.15s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = COLORS.hover;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent';
        }}
        aria-label="Copy Message"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
          <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
        </svg>
        Copy
      </button>
      
      <button
        onClick={(e) => {
          e.stopPropagation();
          onShare();
          onClose();
        }}
        style={{
          width: '100%',
          padding: '8px 12px',
          borderRadius: 8,
          background: 'transparent',
          border: 'none',
          color: COLORS.text,
          fontSize: 14,
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          cursor: 'pointer',
          transition: 'background-color 0.15s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = COLORS.hover;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent';
        }}
        aria-label="Share Message"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
          <path d="M16 6l-4-4-4 4" />
          <path d="M12 20V10" />
        </svg>
        Share
      </button>
      
      <button
        onClick={(e) => {
          e.stopPropagation();
          onShareAll();
          onClose();
        }}
        style={{
          width: '100%',
          padding: '8px 12px',
          borderRadius: 8,
          background: 'transparent',
          border: 'none',
          color: COLORS.text,
          fontSize: 14,
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          cursor: 'pointer',
          transition: 'background-color 0.15s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = COLORS.hover;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent';
        }}
        aria-label="Share All Chat"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        Share All
      </button>
    </div>
  );
} 