/**
 * In-memory notification store. Swap for a real DB by replacing these methods.
 * Order: newest first.
 */

const notifications = [];

function add(notification) {
  notifications.unshift(notification);
  // cap memory growth in demo
  if (notifications.length > 500) notifications.length = 500;
  return notification;
}

function list() {
  return notifications.slice();
}

function markRead(id, read = true) {
  const n = notifications.find((x) => x.id === id);
  if (!n) return null;
  n.read = read;
  return n;
}

function markAllRead() {
  notifications.forEach((n) => { n.read = true; });
  return notifications.length;
}

function clear() {
  notifications.length = 0;
}

module.exports = { add, list, markRead, markAllRead, clear };
