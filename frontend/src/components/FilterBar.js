import React from 'react';

const PRIORITIES = ['All', 'High', 'Medium', 'Low'];

export default function FilterBar({ filter, onChange, counts }) {
  return (
    <div className="filter-bar">
      <div className="filter-group">
        {PRIORITIES.map((p) => (
          <button
            key={p}
            className={`filter-pill ${filter.priority === p ? 'active' : ''}`}
            onClick={() => onChange({ ...filter, priority: p })}
          >
            {p} <span className="count">{counts[p] ?? 0}</span>
          </button>
        ))}
      </div>

      <label className="toggle">
        <input
          type="checkbox"
          checked={filter.unreadOnly}
          onChange={(e) => onChange({ ...filter, unreadOnly: e.target.checked })}
        />
        Unread only
      </label>

      <label className="toggle">
        <input
          type="checkbox"
          checked={filter.hideSpam}
          onChange={(e) => onChange({ ...filter, hideSpam: e.target.checked })}
        />
        Hide spam
      </label>
    </div>
  );
}
