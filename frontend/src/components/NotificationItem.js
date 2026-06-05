import React from 'react';

const PRIORITY_CLASS = {
  High: 'priority-high',
  Medium: 'priority-medium',
  Low: 'priority-low'
};

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function NotificationItem({ notification, onToggleRead }) {
  const { id, title, message, priority, category, isSpam, read, createdAt, source, aiScore } = notification;

  const classes = [
    'notification',
    PRIORITY_CLASS[priority] || 'priority-low',
    read ? 'is-read' : 'is-unread',
    isSpam ? 'is-spam' : ''
  ].filter(Boolean).join(' ');

  return (
    <article className={classes}>
      <header className="notification-header">
        <div className="badges">
          <span className={`badge badge-${priority.toLowerCase()}`}>{priority}</span>
          <span className="badge badge-category">{category}</span>
          {isSpam && <span className="badge badge-spam">SPAM</span>}
        </div>
        <span className="meta">{timeAgo(createdAt)} · {source}</span>
      </header>

      <h3 className="notification-title">{title}</h3>
      <p className="notification-message">{message}</p>

      <footer className="notification-footer">
        <span className="ai-score" title="AI confidence score">AI score: {aiScore}</span>
        <button
          className="link-btn"
          onClick={() => onToggleRead(id, !read)}
        >
          {read ? 'Mark unread' : 'Mark read'}
        </button>
      </footer>
    </article>
  );
}
