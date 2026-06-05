import React, { useMemo, useState } from 'react';
import { useNotifications } from './useNotifications';
import NotificationItem from './components/NotificationItem';
import FilterBar from './components/FilterBar';
import Composer from './components/Composer';

export default function App() {
  const { notifications, connected, error, create, toggleRead, markAllRead } = useNotifications();
  const [filter, setFilter] = useState({ priority: 'All', unreadOnly: false, hideSpam: false });

  const counts = useMemo(() => {
    const c = { All: notifications.length, High: 0, Medium: 0, Low: 0 };
    for (const n of notifications) c[n.priority] = (c[n.priority] || 0) + 1;
    return c;
  }, [notifications]);

  const visible = useMemo(() => {
    return notifications.filter((n) => {
      if (filter.priority !== 'All' && n.priority !== filter.priority) return false;
      if (filter.unreadOnly && n.read) return false;
      if (filter.hideSpam && n.isSpam) return false;
      return true;
    });
  }, [notifications, filter]);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const highCount   = notifications.filter((n) => n.priority === 'High' && !n.read).length;

  return (
    <div className="app">
      <header className="app-header">
        <div className="title-block">
          <h1>AI Notification Center</h1>
          <p className="subtitle">
            Real-time notifications, prioritized and filtered by an on-device classifier.
          </p>
        </div>
        <div className="status-block">
          <span className={`status-dot ${connected ? 'online' : 'offline'}`} />
          <span>{connected ? 'Live' : 'Connecting…'}</span>
          {error && <span className="error-pill">{error}</span>}
        </div>
      </header>

      <section className="stats">
        <div className="stat">
          <span className="stat-value">{notifications.length}</span>
          <span className="stat-label">Total</span>
        </div>
        <div className="stat">
          <span className="stat-value">{unreadCount}</span>
          <span className="stat-label">Unread</span>
        </div>
        <div className="stat stat-high">
          <span className="stat-value">{highCount}</span>
          <span className="stat-label">High priority unread</span>
        </div>
        <button className="primary-btn" onClick={markAllRead} disabled={!unreadCount}>
          Mark all read
        </button>
      </section>

      <main className="layout">
        <aside className="sidebar">
          <Composer onSubmit={create} />
        </aside>

        <section className="feed">
          <FilterBar filter={filter} onChange={setFilter} counts={counts} />

          {visible.length === 0 ? (
            <div className="empty">No notifications match the current filters.</div>
          ) : (
            <ul className="notifications">
              {visible.map((n) => (
                <li key={n.id}>
                  <NotificationItem notification={n} onToggleRead={toggleRead} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
