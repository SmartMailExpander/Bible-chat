"use client";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from 'react-markdown';
import ChatLayout from "./ChatLayout";
import LongPressMenu from "./LongPressMenu";
import { listenToConversations, listenToMessages, addMessage, createConversation, deleteConversation, updateConversationTitle } from "../../firebaseChatService";
import { auth } from "../../firebaseConfig";
import { useRouter, useSearchParams } from "next/navigation";
import { canUserChat, getCurrentUserSubscription, incrementDailyChatCount } from "../../services/localSubscriptionService";

const COLORS = {
  background: "#efe9e1",
  backgroundAlt: "#ded0c4",
  card: "#e5dcd3",
  text: "#9e9188",
  textSecondary: "#b0a597",
  accent: "#cfc2b5",
  navActive: "#b0a597",
  border: "#ded0c4",
  userBubble: "#fff",
  aiBubble: "#e5dcd3",
};

const LOCAL_STORAGE_KEY = "haven-chat-history";
const HAVEN_GREETING = "Hi, I'm Haven! How can I help you with your Bible questions today?";

// Remove getInitialHistory and all localStorage logic for history

function TypingIndicator() {
  return (
    <span style={{ display: 'inline-block', letterSpacing: 2 }}>
      <span className="dot" style={{ animation: 'blink 1s infinite' }}>.</span>
      <span className="dot" style={{ animation: 'blink 1s infinite', animationDelay: '0.2s' }}>.</span>
      <span className="dot" style={{ animation: 'blink 1s infinite', animationDelay: '0.4s' }}>.</span>
      <style>{`
        @keyframes blink {
          0%, 80%, 100% { opacity: 0.2; }
          40% { opacity: 1; }
        }
      `}</style>
    </span>
  );
}

export default function ChatPage() {
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showTime, setShowTime] = useState({}); // {id: true}
  const [showMenu, setShowMenu] = useState(false);
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });
  const [selectedMessage, setSelectedMessage] = useState<string>('');
  const inputRef = useRef(null);
  const chatEndRef = useRef(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [explainContext, setExplainContext] = useState<{ reference: string; verse: string } | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [conversations, setConversations] = useState<any[]>([]);
  const [user, setUser] = useState(null);
  const newChatIdRef = useRef<string | null>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [limitReached, setLimitReached] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  // Load subscription data when user changes
  useEffect(() => {
    const loadSubscription = async () => {
      if (user) {
        try {
          const subData = await getCurrentUserSubscription();
          setSubscription(subData);
        } catch (error) {
          console.error('Error loading subscription:', error);
        }
      }
    };

    loadSubscription();
  }, [user]);

  // Auto-focus input on load
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Pre-fill input if explain param is present
  useEffect(() => {
    const explain = searchParams.get("explain");
    const from = searchParams.get("from");
    
    if (explain) {
      const decoded = decodeURIComponent(explain);
      // Try to split into reference and verse text
      const dashIdx = decoded.indexOf(" - ");
      if (dashIdx !== -1) {
        setExplainContext({
          reference: decoded.slice(0, dashIdx),
          verse: decoded.slice(dashIdx + 3),
        });
        if (!input) setInput(""); // input should be empty for user question
      } else {
        setExplainContext(null);
        if (!input) setInput(decoded);
      }
      
      // If coming from readbible, automatically create a new chat and send the request
      if (from === "readbible" && user && !activeConversationId) {
        const createChatAndSend = async () => {
          let messageText = "";
          if (explainContext) {
            messageText = explainContext.reference + " - " + explainContext.verse;
          } else {
            messageText = decoded;
          }
          await handleNewChat(messageText);
        };
        createChatAndSend();
      }
    } else {
      setExplainContext(null);
    }
  }, [searchParams, user, activeConversationId]);

  // Scroll to bottom on new message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history]);

  // Persist history to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(history));
    }
  }, [history]);

  // Listen to conversations
  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged(user => {
      setUser(user);
      if (user) {
        const unsub = listenToConversations((convs) => {
          const sortedConvs = [...convs].sort((a, b) => {
            const aTime = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
            const bTime = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
            return bTime - aTime;
          });
          setConversations(sortedConvs);
        });
        return () => unsub && unsub();
      } else {
        setConversations([]);
        setActiveConversationId(null);
      }
    });
    return () => unsubscribeAuth();
  }, []); // Only run once for auth

  // Handle active conversation selection
  useEffect(() => {
    if (conversations.length === 0) return;
    // If a new chat was just created, select it
    if (newChatIdRef.current && conversations.some(c => c.id === newChatIdRef.current)) {
      setActiveConversationId(newChatIdRef.current);
      newChatIdRef.current = null;
      return;
    }
    if (!activeConversationId) {
      setActiveConversationId(conversations[0].id);
    }
  }, [conversations]);

  // Listen to messages for the active conversation
  useEffect(() => {
    if (!activeConversationId) return;
    const unsub = listenToMessages(activeConversationId, (msgs) => {
      if (!msgs.length) {
        setHistory([
          {
            id: 1,
            sender: "ai",
            text: HAVEN_GREETING,
            time: "",
          },
        ]);
      } else {
        setHistory(msgs.map(msg => ({
          id: msg.id,
          sender: msg.role === 'user' ? 'user' : 'ai',
          text: msg.content,
          time: msg.timestamp || '',
        })));
      }
    });
    return () => unsub && unsub();
  }, [activeConversationId]);

  // Handle long-press/right-click to show timestamp
  function handleBubblePress(id) {
    setShowTime((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  // Handle mouse right-click (desktop)
  const handleContextMenu = (e: React.MouseEvent, message: string) => {
    e.preventDefault();
    setMenuPos({ x: e.clientX, y: e.clientY + 20 }); // +20 for vertical offset below the cursor
    setSelectedMessage(message);
    setShowMenu(true);
  };

  // Handle long-press (mobile/tablet)
  const handleTouchStart = (e: React.TouchEvent, message: string) => {
    const touch = e.touches[0];
    const timeout = setTimeout(() => {
      setMenuPos({ x: touch.clientX, y: touch.clientY + 20 }); // Popup below the finger
      setSelectedMessage(message);
      setShowMenu(true);
    }, 600); // 600ms for "long press"
    
    // Store timeout reference for cleanup
    (e.currentTarget as any).longPressTimeout = timeout;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const timeout = (e.currentTarget as any).longPressTimeout;
    if (timeout) {
      clearTimeout(timeout);
      (e.currentTarget as any).longPressTimeout = null;
    }
  };

  // Chat actions
  const copyToClipboard = (text: string) => {
    // Check if navigator.clipboard is available (modern browsers)
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).catch(err => {
        console.log('Clipboard API failed, using fallback:', err);
        fallbackCopyToClipboard(text);
      });
    } else {
      // Fallback for older browsers or mobile devices
      fallbackCopyToClipboard(text);
    }
  };

  // Fallback copy method for older browsers and mobile
  const fallbackCopyToClipboard = (text: string) => {
    try {
      // Create a temporary textarea element
      const textArea = document.createElement('textarea');
      textArea.value = text;
      
      // Make it invisible
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      textArea.style.opacity = '0';
      
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      // Try to copy
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (successful) {
        console.log('Text copied using fallback method');
      } else {
        console.log('Fallback copy failed');
        // Show user feedback that copy failed
        alert('Copy failed. Please select and copy the text manually.');
      }
    } catch (err) {
      console.log('Fallback copy error:', err);
      alert('Copy failed. Please select and copy the text manually.');
    }
  };

  const shareMessage = (text: string) => {
    console.log('Share attempt - navigator.share available:', !!navigator.share);
    console.log('Current protocol:', window.location.protocol);
    console.log('Current hostname:', window.location.hostname);
    
    if (navigator.share) {
      // Use native Web Share API
      navigator.share({
        title: 'Haven Bible Chat',
        text: text,
        url: window.location.href,
      }).then(() => {
        console.log('Share successful');
      }).catch(err => {
        console.log('Share failed:', err);
        // Check if it's a security error (HTTP vs HTTPS)
        if (window.location.protocol === 'http:' && window.location.hostname !== 'localhost') {
          alert('Native sharing requires HTTPS. Text copied to clipboard instead.');
        }
        // Fallback to copy if share fails
        copyToClipboard(text);
      });
    } else {
      console.log('Web Share API not available, using copy fallback');
      // Check if it's a security error (HTTP vs HTTPS)
      if (window.location.protocol === 'http:' && window.location.hostname !== 'localhost') {
        alert('Native sharing requires HTTPS. Text copied to clipboard instead.');
      }
      // Fallback to copy if Web Share API is not available
      copyToClipboard(text);
    }
  };

  const shareAllChat = () => {
    const fullText = history
      .filter(msg => !msg.loading)
      .map(msg => `${msg.sender === 'user' ? 'You' : 'Haven'}: ${msg.text}`)
      .join('\n\n');
    
    console.log('Share All attempt - navigator.share available:', !!navigator.share);
    console.log('Current protocol:', window.location.protocol);
    console.log('Current hostname:', window.location.hostname);
    
    if (navigator.share) {
      // Use native Web Share API
      navigator.share({
        title: 'Haven Bible Conversation',
        text: fullText,
        url: window.location.href,
      }).then(() => {
        console.log('Share All successful');
      }).catch(err => {
        console.log('Share All failed:', err);
        // Fallback to copy if share fails
        copyToClipboard(fullText);
      });
    } else {
      console.log('Web Share API not available, using copy fallback');
      // Fallback to copy if Web Share API is not available
      copyToClipboard(fullText);
    }
  };

  async function handleNewChat(initialMessage?: string) {
    if (!user) return;
    const id = await createConversation('New Chat');
    newChatIdRef.current = id;
    setActiveConversationId(id);
    // Add Haven greeting as the first message
    await addMessage(id, { role: 'assistant', content: HAVEN_GREETING });
    
    // If there's an initial message, send it automatically
    if (initialMessage) {
      setTimeout(() => {
        setInput(initialMessage);
        // Trigger send after a short delay
        setTimeout(() => {
          const event = new Event('submit', { bubbles: true, cancelable: true });
          const form = document.querySelector('form');
          if (form) form.dispatchEvent(event);
        }, 100);
      }, 300);
    }
  }

  async function handleSend(e) {
    e.preventDefault();
    if (!input.trim() && !explainContext) return;

    // Check if user can chat before making any API calls
    const canChatResult = await canUserChat();
    console.log('🔍 Chat availability check:', canChatResult);
    
    if (!canChatResult.canChat) {
      console.log('❌ Chat limit reached, not making API call');
      setLimitReached(true);
      setLoading(false);
      return;
    }
    
    console.log('✅ User can chat, proceeding with API call');

    setLoading(true);
    setLimitReached(false);
    
    let messageText = input.trim();
    if (explainContext) {
      messageText = explainContext.reference + " - " + explainContext.verse + (input.trim() ? "\n\n" + input.trim() : "");
    }
    
    // Ensure we have an active conversation
    let currentConversationId = activeConversationId;
    if (!currentConversationId) {
      try {
        currentConversationId = await createConversation("New Chat");
        setActiveConversationId(currentConversationId);
        console.log("Created new conversation:", currentConversationId);
      } catch (error) {
        console.error("Failed to create conversation:", error);
        setLoading(false);
        return;
      }
    }
    
    const userMsg = {
      role: "user",
      content: messageText,
    };
    await addMessage(currentConversationId, userMsg);
    setInput("");
    setExplainContext(null);
    
    // Remove any existing loading indicator before adding a new one
    setHistory((h) => h.filter(m => !(m.sender === 'ai' && m.loading)));
    // Add typing indicator message
    setHistory((h) => [...h, { id: Date.now() + 2, sender: "ai", text: "", loading: true, time: "" }]);
    
    try {
      // Always use the full history for AI context
      const realHistory = history.filter(m => m.sender !== 'ai' || !m.loading).map(msg => ({ role: msg.sender === 'user' ? 'user' : 'assistant', content: msg.text }));
      const historyArray = [...realHistory, { role: 'user', content: messageText }];
      
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          history: historyArray,
          userId: user?.uid,
          dailyChatsUsed: subscription?.dailyChatsUsed || 0
        }),
      });
      
      const data = await res.json();
      
      console.log('🔍 Chat API Response:', {
        status: res.status,
        dailyChatsUsed: data.dailyChatsUsed,
        dailyChatLimit: data.dailyChatLimit,
        userType: data.userType
      });
      
      // Remove typing indicator
      setHistory((h) => h.filter(m => !(m.sender === 'ai' && m.loading)));
      
      // Only increment chat count if API call was successful (200 status)
      if (res.status === 200 && !data.error) {
        console.log('✅ API call successful, incrementing chat count');
        
        // Increment chat count locally
        const incrementResult = await incrementDailyChatCount();
        console.log('📊 Chat count incremented:', incrementResult);
        
        // Update subscription state with new count
        const updatedSubscription = await getCurrentUserSubscription();
        setSubscription(updatedSubscription);
        console.log('🔄 Subscription updated:', updatedSubscription);
        
        // Add AI response (deduplicated)
        setHistory((h) => {
          // Remove any existing AI message with the same text
          const filtered = h.filter(
            m => !(m.sender === 'ai' && m.text === data.reply)
          );
          return [
            ...filtered,
            {
              id: Date.now() + 1,
              sender: "ai",
              text: data.reply,
              time: new Date().toLocaleTimeString(),
              provider: "Haven",
              fallbackUsed: false
            }
          ];
        });
        
        // AI-generated chat title logic (exact copy from backup)
        const conv = conversations.find(c => c.id === currentConversationId);
        if (conv && conv.title === 'New Chat' && history.filter(m => m.sender === 'user').length === 0) {
          // Only after first user message
          const titleRes = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              history: [
                { role: 'user', content: messageText },
                { role: 'system', content: 'Summarize the above message in 3-5 words for a chat title.' }
              ]
            }),
          });
          const titleData = await titleRes.json();
          if (titleData.reply) {
            await updateConversationTitle(currentConversationId, titleData.reply);
          }
        }
        
      } else {
        // Handle error or limit reached
        console.log('❌ API call failed or limit reached');
        
        // Update subscription state with current usage from API response
        if (data.dailyChatsUsed !== undefined && data.dailyChatLimit !== undefined) {
          setSubscription(prev => prev ? {
            ...prev,
            dailyChatsUsed: data.dailyChatsUsed,
            dailyChatLimit: data.dailyChatLimit,
            userType: data.userType || prev.userType
          } : {
            userType: data.userType || 'free',
            dailyChatsUsed: data.dailyChatsUsed,
            dailyChatLimit: data.dailyChatLimit,
            features: []
          });
        }
        
        await addMessage(currentConversationId, { 
          role: 'assistant', 
          content: data.reply || 'Daily chat limit reached. Please upgrade to continue.'
        });
        
        setHistory((h) => [...h, { 
          id: Date.now() + 1, 
          sender: "ai", 
          text: data.reply || 'Daily chat limit reached. Please upgrade to continue.', 
          time: new Date().toLocaleTimeString()
        }]);
      }
      
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Remove typing indicator
      setHistory((h) => h.filter(m => !(m.sender === 'ai' && m.loading)));
      
      // Add error message
      const errorMessage = { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error. Please try again.'
      };
      await addMessage(currentConversationId, errorMessage);
      
      setHistory((h) => [...h, { 
        id: Date.now() + 1, 
        sender: "ai", 
        text: 'Sorry, I encountered an error. Please try again.', 
        time: new Date().toLocaleTimeString()
      }]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    console.log("Active Conversation ID changed:", activeConversationId);
  }, [activeConversationId]);

  useEffect(() => {
    // Close menu when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (showMenu) {
        setShowMenu(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showMenu]);

  if (!hydrated) return null;

  // Sidebar UI (only this part is changed)
  function Sidebar() {
    console.log("Sidebar rendered, activeConversationId:", activeConversationId);
    return (
      <div style={{ width: 220, background: '#f6f1eb', padding: 12, borderRight: '1px solid #ded0c4', height: '100vh' }}>
        <button
          className="new-chat-btn"
          style={{ width: '100%', marginBottom: 16, padding: 8, borderRadius: 8, background: '#ded0c4', border: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, opacity: user ? 1 : 0.5, cursor: user ? 'pointer' : 'not-allowed' }}
          onClick={() => handleNewChat()}
          disabled={!user}
        >
          {/* Feather style cross icon */}
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="#6B4F3B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <path d="M12 5v14M5 12h14" />
          </svg>
          New Chat
        </button>
        {conversations.map(conv => {
          // Debug: log before rendering button
          console.log('Rendering delete button for', conv.id);
          return (
            <div
              key={conv.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 10,
                borderRadius: 8,
                background: activeConversationId === conv.id ? '#e5dcd3' : 'transparent',
                marginBottom: 6,
                cursor: 'pointer',
                fontWeight: 500
              }}
            >
              <span onClick={() => setActiveConversationId(conv.id)} style={{ flex: 1 }}>
                {conv.title || 'Untitled Chat'}
              </span>
              <button
                className="delete-chat-btn"
                onClick={async (e) => { e.stopPropagation(); await deleteConversation(conv.id); }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  marginLeft: 8,
                  display: 'flex',
                  alignItems: 'center',
                  padding: 2
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
          );
        })}
        <style>{`
          .new-chat-btn svg,
          .delete-chat-btn svg {
            transition: stroke 0.3s ease;
          }
          .new-chat-btn:hover svg {
            stroke: #4E342E;
          }
          .delete-chat-btn:hover svg {
            stroke: #8D6E63;
          }
        `}</style>
      </div>
    );
  }

  return (
    <ChatLayout activeConversationId={activeConversationId} setActiveConversationId={setActiveConversationId}>
      {/* Subscription Limit Banner */}
      {limitReached && (
        <div style={{
          position: "fixed",
          top: 70,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 25,
          background: "linear-gradient(135deg, #ff7675 0%, #e17055 100%)",
          color: "white",
          padding: "12px 20px",
          borderRadius: "12px",
          boxShadow: "0 4px 12px rgba(214, 48, 49, 0.3)",
          border: "2px solid #d63031",
          maxWidth: "90%",
          textAlign: "center",
          fontFamily: "Playfair Display, Georgia, serif",
          fontSize: "14px",
          fontWeight: "600",
        }}>
          <div style={{ marginBottom: "8px" }}>
            🚫 Daily chat limit reached
          </div>
          <div style={{ fontSize: "12px", opacity: 0.9, marginBottom: "8px" }}>
            You've used all {subscription?.dailyChatLimit || 5} free chats today
          </div>
          <button
            onClick={() => window.location.href = '/pricing'}
            style={{
              background: "rgba(255, 255, 255, 0.2)",
              border: "1px solid rgba(255, 255, 255, 0.3)",
              borderRadius: "8px",
              padding: "6px 12px",
              color: "white",
              fontSize: "12px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.3)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.2)";
            }}
          >
            Upgrade to Premium
          </button>
        </div>
      )}
      
      {/* Back Arrow Button */}
      {/*
      <button
        onClick={() => {
          const from = searchParams.get("from");
          if (from === "readbible") {
            router.push("/readbible");
          } else {
            router.push("/");
          }
        }}
        style={{
          position: "fixed",
          top: 24,
          left: 16,
          zIndex: 30,
          background: COLORS.backgroundAlt,
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
      */}
     
      <div
        style={{
          width: "100%",
          maxWidth: 480,
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          padding: "0 0 90px 0", // add more bottom padding to ensure no message is under input
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "24px 0 0 0",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          {history.map((msg, idx) => (
            <div
              key={msg.id}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: msg.sender === "user" ? "flex-end" : "flex-start",
                padding: "0 16px",
                userSelect: "text",
                position: "relative",
              }}
            >
              {msg.sender === "ai" && (
                <div style={{ fontSize: 13, color: COLORS.textSecondary, fontWeight: 600, marginBottom: 2, marginLeft: 4 }}>
                  Haven {msg.provider && `(${msg.provider}${msg.fallbackUsed ? ' - fallback' : ''})`}
                </div>
              )}
              <div
                style={{
                  background: msg.sender === "user" ? COLORS.userBubble : COLORS.aiBubble,
                  color: COLORS.text,
                  borderRadius: msg.sender === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                  padding: "12px 16px",
                  fontSize: 16,
                  fontWeight: 500,
                  boxShadow: "0 1px 4px 0 rgba(158,145,136,0.04)",
                  marginBottom: 2,
                  maxWidth: "80%",
                  wordBreak: "break-word",
                  cursor: "pointer",
                  border: `1px solid ${COLORS.border}`,
                }}
                title={showTime[msg.id] ? new Date(msg.time).toLocaleString() : undefined}
                onDoubleClick={() => handleBubblePress(msg.id)}
                onContextMenu={(e) => handleContextMenu(e, msg.text)}
                onTouchStart={(e) => handleTouchStart(e, msg.text)}
                onTouchEnd={handleTouchEnd}
              >
                {msg.sender === "ai" && msg.loading ? (
                  <>
                    <div style={{ fontSize: 13, color: COLORS.textSecondary, fontWeight: 600, marginBottom: 2, marginLeft: 4 }}>Thinking...</div>
                    <TypingIndicator />
                  </>
                ) : msg.sender === "ai" ? (
                  <ReactMarkdown>{msg.text}</ReactMarkdown>
                ) : (
                  msg.text
                )}
              </div>
              {showTime[msg.id] && (
                <div style={{ fontSize: 11, color: COLORS.textSecondary, marginTop: 2, marginLeft: 4 }}>
                  {msg.time ? new Date(msg.time).toLocaleString() : 'No timestamp'}
                </div>
              )}
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>
      </div>

      {/* Long Press Menu */}
      {showMenu && (
        <LongPressMenu
          position={menuPos}
          message={selectedMessage}
          onClose={() => setShowMenu(false)}
          onCopy={() => copyToClipboard(selectedMessage)}
          onShare={() => shareMessage(selectedMessage)}
          onShareAll={shareAllChat}
        />
      )}

      {/* Input Bar */}
      {explainContext && (
        <div style={{
          position: "fixed",
          bottom: 80,
          left: 0,
          width: "100%",
          display: "flex",
          justifyContent: "center",
          pointerEvents: "none",
          zIndex: 21,
        }}>
          <div style={{
            width: "100%",
            maxWidth: 390,
            margin: "0 auto",
            background: COLORS.backgroundAlt,
            borderRadius: 18,
            boxShadow: "0 4px 16px 0 rgba(90,70,50,0.10)",
            padding: "16px 18px 12px 18px",
            color: COLORS.text,
            fontFamily: 'Georgia, serif',
            fontSize: 16,
            fontWeight: 500,
            display: "flex",
            flexDirection: "column",
            gap: 4,
            border: "1px solid #e5dcd3",
            pointerEvents: "auto",
            boxSizing: "border-box",
          }}>
            <div style={{ fontSize: 15, color: COLORS.textSecondary, fontWeight: 700, marginBottom: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span role="img" aria-label="Verse">📖</span> {explainContext.reference}
            </div>
            <div style={{ fontSize: 16, color: COLORS.text, fontWeight: 500 }}>{explainContext.verse}</div>
          </div>
        </div>
      )}
      <form
        onSubmit={handleSend}
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          width: "100%",
          maxWidth: 480,
          background: "transparent",
          borderTop: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "18px 12px 14px 12px",
          boxSizing: "border-box",
          zIndex: 20,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            width: "100%",
            maxWidth: 390,
            background: COLORS.backgroundAlt,
            borderRadius: 14,
            padding: "0 8px 0 0",
            boxShadow: "0 1px 4px 0 rgba(158,145,136,0.04)",
            boxSizing: "border-box",
          }}
        >
          <textarea
            ref={inputRef}
            style={{
              flex: 1,
              border: "none",
              outline: "none",
              background: "transparent",
              color: COLORS.text,
              fontFamily: 'Georgia, serif',
              fontSize: 18,
              padding: "14px 0 14px 24px",
              borderRadius: 12,
              fontWeight: 400,
              resize: "none",
              minHeight: 40,
              maxHeight: 120,
              overflowY: "auto",
              lineHeight: 1.4,
              width: "100%",
              boxSizing: "border-box",
            }}
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={explainContext ? "Ask a question about this verse..." : "Ask me anything..."}
            required={!explainContext}
            disabled={loading}
            rows={1}
            onInput={e => {
              // auto-grow textarea
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = target.scrollHeight + 'px';
            }}
          />
          <button
            type="submit"
            style={{
              background: "transparent",
              border: "none",
              borderRadius: "50%",
              width: 48,
              height: 48,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: loading || (!input.trim() && !explainContext) ? "not-allowed" : "pointer",
              marginLeft: 0,
              marginRight: 8,
            }}
            disabled={loading || (!input.trim() && !explainContext)}
            aria-label="Send"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="#5C4033" style={{ width: 32, height: 32 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
            </svg>
          </button>
        </div>
      </form>
    </ChatLayout>
  );
} 