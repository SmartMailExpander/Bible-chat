"use client";
import { useState, useEffect, useRef } from "react";
import ChatLayout from "../ChatLayout";
import { listenToMessages, addMessage, listenToConversations, createConversation } from '../../../firebaseChatService';

export default function TestChatLayout() {
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversations, setConversations] = useState<any[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Listen to conversations and auto-select the latest if none selected
  useEffect(() => {
    const unsub = listenToConversations((convs) => {
      setConversations(convs);
      if (!activeConversationId && convs.length > 0) {
        setActiveConversationId(convs[convs.length - 1].id);
      }
    });
    return () => unsub && unsub();
  }, [activeConversationId]);

  // Listen to messages for the active conversation
  useEffect(() => {
    if (!activeConversationId) return;
    const unsub = listenToMessages(activeConversationId, (msgs) => {
      setHistory(msgs.map(msg => ({
        id: msg.id,
        sender: msg.role === 'user' ? 'user' : 'ai',
        text: msg.content,
        time: msg.timestamp || '',
      })));
    });
    return () => unsub && unsub();
  }, [activeConversationId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history]);

  async function handleSend(e: any) {
    e.preventDefault();
    if (!input.trim() || !activeConversationId) return;
    setLoading(true);
    await addMessage(activeConversationId, { role: "user", content: input.trim() });
    setInput("");
    // Add typing indicator
    setHistory((h: any) => [...h, { id: Date.now() + 2, sender: "ai", text: "", loading: true, time: "" }]);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ history: history.filter(m => m.sender !== 'ai' || !m.loading).map(msg => ({ role: msg.sender === 'user' ? 'user' : 'assistant', content: msg.text })) }),
      });
      const data = await res.json();
      await addMessage(activeConversationId, { role: 'assistant', content: data.reply });
    } catch (err) {
      await addMessage(activeConversationId, { role: 'assistant', content: 'Error contacting AI service.' });
    }
    setLoading(false);
  }

  return (
    <ChatLayout activeConversationId={activeConversationId} setActiveConversationId={setActiveConversationId}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', maxWidth: 480, margin: '0 auto', padding: 16 }}>
        <div style={{ flex: 1, overflowY: 'auto', marginBottom: 16 }}>
          {history.map((msg, idx) => (
            <div key={msg.id} style={{ textAlign: msg.sender === 'user' ? 'right' : 'left', margin: '8px 0' }}>
              <div style={{ display: 'inline-block', background: msg.sender === 'user' ? '#fff' : '#e5dcd3', color: '#5C4033', borderRadius: 12, padding: '8px 14px', fontSize: 16, maxWidth: '80%' }}>
                {msg.text || (msg.loading ? <span>...</span> : null)}
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>
        <form onSubmit={handleSend} style={{ display: 'flex', gap: 8 }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            style={{ flex: 1, borderRadius: 8, border: '1px solid #ded0c4', padding: '10px 14px', fontSize: 16 }}
            placeholder="Type a message..."
            disabled={loading || !activeConversationId}
          />
          <button type="submit" disabled={loading || !input.trim() || !activeConversationId} style={{ borderRadius: 8, background: '#ded0c4', border: 'none', padding: '0 18px', fontWeight: 600, fontSize: 16, cursor: loading ? 'not-allowed' : 'pointer' }}>
            Send
          </button>
        </form>
      </div>
    </ChatLayout>
  );
} 