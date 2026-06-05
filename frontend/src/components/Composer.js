import React, { useState } from 'react';

const PRESETS = [
  { title: 'Unauthorized login attempt', message: 'A suspicious login from a new device was blocked. Verify immediately.' },
  { title: 'Invoice overdue', message: 'Your payment for the May subscription is overdue.' },
  { title: 'You WON a prize!!!', message: 'CONGRATULATIONS! Click here to claim your free iPhone now!' },
  { title: 'Weekly digest', message: 'Here are 5 articles you might enjoy. FYI only.' }
];

export default function Composer({ onSubmit }) {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;
    setBusy(true);
    try {
      await onSubmit({ title: title.trim(), message: message.trim(), source: 'dashboard' });
      setTitle('');
      setMessage('');
    } finally {
      setBusy(false);
    }
  }

  function loadPreset(p) {
    setTitle(p.title);
    setMessage(p.message);
  }

  return (
    <form className="composer" onSubmit={submit}>
      <h2>Send a test notification</h2>
      <input
        type="text"
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={120}
      />
      <textarea
        placeholder="Message"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={3}
        maxLength={500}
      />
      <div className="composer-actions">
        <div className="presets">
          {PRESETS.map((p, i) => (
            <button type="button" key={i} className="preset-btn" onClick={() => loadPreset(p)}>
              {p.title}
            </button>
          ))}
        </div>
        <button type="submit" className="primary-btn" disabled={busy}>
          {busy ? 'Sending…' : 'Send'}
        </button>
      </div>
    </form>
  );
}
