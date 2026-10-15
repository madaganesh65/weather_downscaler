import React, { useState, useEffect } from 'react';

const PADDY_IMG = "https://i.pinimg.com/736x/24/1f/dc/241fdc8cef3406285abb7de79012d47e.jpg";

export default function ChatBox({ currentUser }) {
  const [contacts, setContacts] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');

  useEffect(() => {
    fetch(`http://127.0.0.1:8000/api/chat/contacts/${currentUser.id}`)
      .then((res) => res.json())
      .then((data) => {
        setContacts(data);
        if (data.length > 0) setSelectedUser(data[0]);
      })
      .catch(console.error);
  }, [currentUser.id]);

  const loadMessages = () => {
    if (!selectedUser) return;
    fetch(`http://127.0.0.1:8000/api/chat/messages?user_a=${currentUser.id}&user_b=${selectedUser.id}`)
      .then((res) => res.json())
      .then((data) => setMessages(data))
      .catch(console.error);
  };

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 3000);
    return () => clearInterval(interval);
  }, [selectedUser]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedUser) return;

    try {
      const res = await fetch('http://127.0.0.1:8000/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender_id: currentUser.id,
          receiver_id: selectedUser.id,
          message: inputText
        })
      });
      if (res.ok) {
        setInputText('');
        loadMessages();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="card" style={{ padding: 0 }}>
      <div className="chat-container">
        <div className="chat-sidebar">
          <div style={{ padding: '0.85rem', fontWeight: 700, borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            {currentUser.role === 'farmer' ? (
              <span>🧪 Authorized Dealers</span>
            ) : (
              <>
                <img 
                  src={PADDY_IMG} 
                  alt="Farmer" 
                  style={{ width: '18px', height: '18px', objectFit: 'cover', borderRadius: '3px' }} 
                />
                <span>Registered Farmers</span>
              </>
            )}
          </div>
          {contacts.map((c) => (
            <div
              key={c.id}
              onClick={() => setSelectedUser(c)}
              className={`chat-contact ${selectedUser?.id === c.id ? 'active' : ''}`}
            >
              <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{c.full_name}</div>
              <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                {c.mandal}, {c.district}
              </small>
            </div>
          ))}
        </div>

        <div className="chat-main">
          <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-color)', background: '#111827' }}>
            <strong>{selectedUser ? selectedUser.full_name : 'Select a contact'}</strong>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
              ({selectedUser?.role})
            </span>
          </div>

          <div className="chat-messages">
            {messages.length === 0 && (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', margin: 'auto' }}>
                Start a consultation or inquire about pesticides and dosage.
              </p>
            )}
            {messages.map((m) => {
              const isMine = m.sender_id === currentUser.id;
              return (
                <div key={m.id} className={`chat-bubble ${isMine ? 'mine' : 'theirs'}`}>
                  {m.message}
                </div>
              );
            })}
          </div>

          <form onSubmit={handleSend} className="chat-input-bar">
            <input
              type="text"
              placeholder="Type your message, query, or order details..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
            <button type="submit" className="btn-primary">Send</button>
          </form>
        </div>
      </div>
    </div>
  );
}