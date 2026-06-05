require('dotenv').config();

const http = require('http');
const path = require('path');
const express = require('express');
const cors = require('cors');
const { Server } = require('socket.io');
const { nanoid } = require('nanoid');

const { classify } = require('./ai/classifier');
const store = require('./data/store');
const samples = require('./data/samples');

const PORT = Number(process.env.PORT) || 4000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000';
const AUTO_INTERVAL_MS = Number(process.env.AUTO_GENERATE_INTERVAL_MS ?? 15000);

const app = express();
app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: CORS_ORIGIN, methods: ['GET', 'POST'] }
});

function buildNotification({ title, message, source = 'api' }) {
  const ai = classify({ title, message });
  return {
    id: nanoid(10),
    title,
    message,
    source,
    createdAt: new Date().toISOString(),
    read: false,
    priority: ai.priority,
    category: ai.category,
    isSpam: ai.isSpam,
    aiScore: ai.score
  };
}

function publish(notification) {
  store.add(notification);
  io.emit('notification:new', notification);
  return notification;
}

// REST API ------------------------------------------------------------
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, uptime: process.uptime() });
});

app.get('/api/notifications', (_req, res) => {
  res.json(store.list());
});

app.post('/api/notifications', (req, res) => {
  const { title, message, source } = req.body || {};
  if (!title || !message) {
    return res.status(400).json({ error: 'title and message are required' });
  }
  const notification = buildNotification({ title, message, source });
  publish(notification);
  res.status(201).json(notification);
});

app.patch('/api/notifications/:id/read', (req, res) => {
  const { read = true } = req.body || {};
  const updated = store.markRead(req.params.id, Boolean(read));
  if (!updated) return res.status(404).json({ error: 'not found' });
  io.emit('notification:updated', updated);
  res.json(updated);
});

app.post('/api/notifications/mark-all-read', (_req, res) => {
  const count = store.markAllRead();
  io.emit('notifications:all-read');
  res.json({ updated: count });
});

// Socket.IO ----------------------------------------------------------
io.on('connection', (socket) => {
  // hydrate the new client with current state
  socket.emit('notifications:snapshot', store.list());

  socket.on('notification:create', (payload, ack) => {
    if (!payload || !payload.title || !payload.message) {
      if (typeof ack === 'function') ack({ ok: false, error: 'title and message required' });
      return;
    }
    const notification = buildNotification({
      title: payload.title,
      message: payload.message,
      source: payload.source || 'socket'
    });
    publish(notification);
    if (typeof ack === 'function') ack({ ok: true, notification });
  });
});

// Demo seeding + auto-generator -------------------------------------
function seed() {
  // backdate a few so the dashboard isn't empty on first load
  samples.slice(0, 4).forEach((s, i) => {
    const n = buildNotification(s);
    n.createdAt = new Date(Date.now() - (4 - i) * 60_000).toISOString();
    store.add(n);
  });
}

function startAutoGenerator() {
  if (!AUTO_INTERVAL_MS) return;
  setInterval(() => {
    const pick = samples[Math.floor(Math.random() * samples.length)];
    publish(buildNotification(pick));
  }, AUTO_INTERVAL_MS);
}

seed();
startAutoGenerator();

server.listen(PORT, () => {
  console.log(`[notify] listening on http://localhost:${PORT}`);
  console.log(`[notify] CORS origin: ${CORS_ORIGIN}`);
  if (AUTO_INTERVAL_MS) {
    console.log(`[notify] auto-generating a sample every ${AUTO_INTERVAL_MS}ms`);
  }
});
