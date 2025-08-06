import { useEffect, useState } from 'react';
import { listenToConversations, createConversation } from '../../firebaseChatService';
import { auth } from '../../firebaseConfig';
import { deleteConversation } from '../../firebaseChatService';

export default function ChatSidebar({ onSelect, activeId }) {
  const [convs, setConvs] = useState([]);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged(user => {
      setUser(user);
      if (user) {
        const unsub = listenToConversations(setConvs);
        return () => unsub && unsub();
      } else {
        setConvs([]);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  return (
    <div style={{ width: 220, background: '#f6f1eb', padding: 12, borderRight: '1px solid #ded0c4', height: '100vh' }}>
      <button
        style={{ width: '100%', marginBottom: 16, padding: 8, borderRadius: 8, background: '#ded0c4', border: 'none', fontWeight: 600, opacity: user ? 1 : 0.5, cursor: user ? 'pointer' : 'not-allowed' }}
        onClick={async () => {
          if (!user) return;
          const id = await createConversation('New Chat');
          onSelect(id);
        }}
        disabled={!user}
      >+ New Chat</button>
      {convs.map(conv => (
        <div
          key={conv.id}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: 10,
            borderRadius: 8,
            background: activeId === conv.id ? '#e5dcd3' : 'transparent',
            marginBottom: 6,
            cursor: 'pointer',
            fontWeight: 500
          }}
        >
          <span onClick={() => onSelect(conv.id)} style={{ flex: 1 }}>
            {conv.title || 'Untitled Chat'}
          </span>
          <button
            className="delete-chat-btn"
            onClick={async (e) => {
              e.stopPropagation();
              await deleteConversation(conv.id);
            }}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              marginLeft: 8,
              display: 'flex',
              alignItems: 'center',
              padding: 12
            }}
            aria-label="Delete Chat"
            title="Delete Chat"
          >
            {/* Soft-Themed Bin / Trash Icon */}
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#A1887F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18" />
              <path d="M8 6V4h8v2" />
              <path d="M19 6l-1 14H6L5 6" />
              <path d="M10 11v6" />
              <path d="M14 11v6" />
            </svg>
          </button>
        </div>
      ))}
      <style>{`
        .delete-chat-btn svg {
          stroke: #A1887F;
          width: 18px;
          height: 18px;
          transition: stroke 0.3s ease;
        }
        .delete-chat-btn:hover svg {
          stroke: #8D6E63;
        }
      `}</style>
    </div>
  );
} 