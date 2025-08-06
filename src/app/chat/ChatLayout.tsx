"use client";
import { useState } from 'react';
import ChatSidebar from './ChatSidebar';
import { useRouter } from 'next/navigation';
import styles from './ChatLayout.module.css';

const HEADER_HEIGHT = 56;

export default function ChatLayout({ children, activeConversationId, setActiveConversationId }: { children: React.ReactNode, activeConversationId: string | null, setActiveConversationId: (id: string) => void }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();

  return (
    <div className={styles.chatContainer}>
      {/* Fixed Header Bar */}
      <div className={styles.chatHeader}>
        {/* Back Button (left) */}
        <button
          onClick={() => router.back()}
          className={styles.chatHeaderButton}
          aria-label="Back"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        {/* Center Logo */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%)',
        }}>
          <img 
            src="/haven-icon.svg" 
            alt="Haven Bible Icon" 
            style={{
              width: '32px',
              height: '32px',
              filter: 'brightness(0.8) sepia(0.3) hue-rotate(10deg)',
            }}
          />
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0px',
          }}>
            <div style={{
              fontSize: '16px',
              fontWeight: '600',
              fontFamily: 'Playfair Display, Georgia, serif',
              color: '#3c2f2f',
              lineHeight: '1.2',
              margin: 0,
            }}>
              Haven
            </div>
            <div style={{
              fontSize: '10px',
              fontWeight: '400',
              fontFamily: 'Inter, Segoe UI, sans-serif',
              color: '#a98f80',
              lineHeight: '1.2',
              margin: 0,
            }}>
              Your Bible Companion
            </div>
          </div>
        </div>

        {/* Hamburger for mobile (right) */}
        <button
          onClick={() => setSidebarOpen(true)}
          className={styles.chatHeaderButton}
          aria-label="Open sidebar"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
      </div>

      {/* Sidebar: always visible on desktop, drawer on mobile (right) */}
      <div
        style={{
          width: 220,
          background: '#f6f1eb',
          borderLeft: '1px solid #ded0c4',
          position: 'fixed',
          top: 0,
          right: sidebarOpen ? 0 : -240,
          left: 'auto',
          height: '100vh',
          zIndex: 99,
          transition: 'right 0.3s ease',
          boxShadow: sidebarOpen ? '-2px 0 8px rgba(90,70,50,0.08)' : 'none',
          display: 'block',
          paddingTop: HEADER_HEIGHT,
        }}
        className="sidebar-drawer"
      >
        <ChatSidebar onSelect={setActiveConversationId} activeId={activeConversationId} />
      </div>

      {/* Overlay for mobile drawer */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0,0,0,0.08)',
            zIndex: 98,
          }}
        />
      )}

      {/* Main Chat Area */}
      <div className={styles.chatMessages}>
        {children}
      </div>

      {/* Responsive styles */}
      <style>{`
        @media (min-width: 768px) {
          .sidebar-drawer {
            position: relative !important;
            right: 0 !important;
            left: auto !important;
            box-shadow: none !important;
            border-left: 1px solid #ded0c4 !important;
            padding-top: ${HEADER_HEIGHT}px !important;
          }
          .main-chat-area {
            margin-right: 220px !important;
          }
          .mobile-hamburger {
            display: none !important;
          }
        }
        
        /* Improved mobile sidebar animation */
        @media (max-width: 767px) {
          .sidebar-drawer {
            transition: right 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
          }
        }
      `}</style>
    </div>
  );
} 