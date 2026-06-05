# AI-Powered Real-Time Notification System

A full-stack demo that streams notifications to a React dashboard in real time
over Socket.IO. Every incoming notification is run through a lightweight
AI classifier that assigns a **priority** (High / Medium / Low), tags it with a
**category** (security / billing / system / social / promo / general), and
flags **spam**. High-priority items are visually highlighted; spam is muted.

```
┌──────────────┐   POST /api/notifications   ┌────────────────┐  emit  ┌──────────────┐
│  REST client │ ──────────────────────────▶ │   Node server  │ ─────▶ │  React UI    │
│ (curl/UI)    │                             │  + AI classify │  WS    │ (dashboard)  │
└──────────────┘                             └────────────────┘        └──────────────┘
                                                     ▲
                                                     │ auto-generator (demo loop)
```

---

## Tech stack

| Layer        | Choice                                              |
| ------------ | --------------------------------------------------- |
| Frontend     | React 18, Socket.IO client, plain CSS               |
| Backend      | Node.js, Express, Socket.IO                         |
| Transport    | WebSockets (Socket.IO) + REST fallback              |
| AI           | Local rule-based NLP classifier (no external API)   |
| Storage      | In-memory (swap for any DB at `backend/data/store.js`) |

---

## Project layout

```
.
├── backend/
│   ├── ai/classifier.js      # priority + category + spam logic
│   ├── data/store.js         # in-memory store (drop-in replaceable)
│   ├── data/samples.js       # seed + auto-generator samples
│   ├── server.js             # Express + Socket.IO entry point
│   ├── package.json
│   └── .env.example
└── frontend/
    ├── public/index.html
    ├── src/
    │   ├── App.js
    │   ├── api.js
    │   ├── useNotifications.js   # Socket.IO + REST hook
    │   ├── components/
    │   │   ├── Composer.js       # send-test-notification form
    │   │   ├── FilterBar.js      # priority / unread / spam filters
    │   │   └── NotificationItem.js
    │   └── styles.css
    ├── package.json
    └── .env.example
```

---

## Setup

Prereqs: **Node 18+** and **npm**.

### 1. Backend

```bash
cd backend
cp .env.example .env        # optional — defaults work
npm install
npm start
```

Server runs on `http://localhost:4000`. The console will log the auto-generator
interval (default: a fresh sample every 15s).

### 2. Frontend

In a new terminal:

```bash
cd frontend
cp .env.example .env        # optional — defaults work
npm install
npm start
```

The dashboard opens on `http://localhost:3000` and connects to the backend
via WebSocket immediately. You should see seeded notifications appear and a
new one stream in every 15 seconds.

---

## Using the system

- **Send a test notification** — use the *Composer* in the left sidebar.
  Click any preset chip to autofill, then *Send*. Try the *"You WON a prize"*
  preset to see the spam detector in action.
- **Filter** — toggle priority pills, *Unread only*, or *Hide spam*.
- **Mark read/unread** — per-item, or *Mark all read* from the top stats bar.
- **REST API** (also usable from curl):

  ```bash
  curl -X POST http://localhost:4000/api/notifications \
    -H "Content-Type: application/json" \
    -d '{"title":"Server outage","message":"API down — critical alert!"}'
  ```

  All connected clients receive the new notification within milliseconds.

---

## Architecture overview

### Notification lifecycle

1. **Ingestion** — a notification enters via `POST /api/notifications`
   or a `notification:create` socket event.
2. **Classification** — `ai/classifier.js` enriches it with:
   - `priority` — High / Medium / Low
   - `category` — security / billing / system / social / promo / general
   - `isSpam` — boolean
   - `aiScore` — raw numeric confidence (for inspection in the UI)
3. **Persistence** — appended to the in-memory store.
4. **Broadcast** — the server emits `notification:new` over Socket.IO.
   Every connected client also receives a `notifications:snapshot` on connect
   so newcomers don't start empty.
5. **Render** — the React `useNotifications` hook keeps a single source of
   truth in state, updated by socket events; the dashboard re-renders.

### Socket events

| Event                       | Direction  | Payload                  |
| --------------------------- | ---------- | ------------------------ |
| `notifications:snapshot`    | server→cli | `Notification[]`         |
| `notification:new`          | server→cli | `Notification`           |
| `notification:updated`      | server→cli | `Notification`           |
| `notifications:all-read`    | server→cli | —                        |
| `notification:create`       | cli→server | `{ title, message, source? }` (with ack callback) |

### REST endpoints

| Method | Path                                   | Purpose                         |
| ------ | -------------------------------------- | ------------------------------- |
| GET    | `/api/health`                          | Liveness probe                  |
| GET    | `/api/notifications`                   | List all notifications          |
| POST   | `/api/notifications`                   | Create + classify + broadcast   |
| PATCH  | `/api/notifications/:id/read`          | Toggle read state               |
| POST   | `/api/notifications/mark-all-read`     | Mark everything read            |

---

## AI approach used

The classifier in `backend/ai/classifier.js` is a transparent rule-based NLP
pipeline — no external API calls — so the demo runs entirely offline and
reviewers can trace every verdict. It performs three independent jobs on the
concatenated `title + message`:

### 1. Priority classification
A weighted keyword lexicon scores three buckets:

- **High** keywords (`urgent`, `critical`, `breach`, `outage`, `expired`, …) → weight ×3
- **Medium** (`reminder`, `pending`, `invoice`, `deadline`, …) → weight ×2
- **Low** (`newsletter`, `promo`, `welcome`, `tip`, …) → weight ×1

Two heuristic boosters amplify urgency:
- `>= 2` exclamation marks → +1 to high score
- Uppercase character ratio `> 30%` → +1 to high score (shouting)

The highest qualifying bucket wins. Items with no signal default to **Medium**
so they aren't silently buried.

### 2. Category tagging
Six topical lexicons (`security`, `billing`, `system`, `social`, `promo`) are
matched against the text; the lexicon with the most hits becomes the category.
Falls back to `general`.

### 3. Spam detection
Triggers when the text contains:
- **≥ 2** spammy phrases (`congratulations`, `winner`, `click here`,
  `free money`, `bitcoin`, …), **or**
- **≥ 1** spammy phrase combined with strong amplification signals
  (3+ exclamation marks, money emoji).

When spam is detected, the item is force-downgraded to **Low** and re-tagged
as `promo`, so the UI mutes it automatically.

### Why rules and not an LLM?
For this assessment a rule-based classifier is the right trade-off:
- **Zero external dependencies** — graders can run the project without keys.
- **Deterministic and inspectable** — `aiScore` is shown in the UI; every
  decision can be traced to specific keyword hits.
- **Easy to swap** — `classify({ title, message })` is the single seam. To
  upgrade, replace the function body with an LLM call (e.g. an
  Anthropic Claude call returning structured JSON) without touching the
  server, store, or frontend.

### Hot-swap to an LLM (illustrative, not required)
```js
// drop-in replacement for ai/classifier.js — requires ANTHROPIC_API_KEY
async function classify({ title, message }) {
  const res = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 200,
    messages: [{ role: 'user', content: `Classify priority/category/spam: ${title}\n${message}` }]
  });
  return JSON.parse(res.content[0].text);
}
```

---

## Assumptions

- A single-tenant demo — no auth, no per-user notification routing. The
  `source` field is informational only.
- All notifications go to all connected clients (broadcast). A real system
  would scope by user/room.
- In-memory storage is intentional for an assessment: state resets on
  restart. The store is isolated behind `backend/data/store.js` so swapping
  to Postgres/Redis is a single-file change.
- The AI is **rule-based on purpose** (see *Why rules and not an LLM?* above).
  The contract — input shape and the `{ priority, category, isSpam, score }`
  output — is what would stay stable across implementations.
- An auto-generator runs every 15s to make the live-update behavior visible
  during a demo. Disable by setting `AUTO_GENERATE_INTERVAL_MS=0`.

---

## Environment variables

### `backend/.env`
| Var                          | Default                  | Purpose                                |
| ---------------------------- | ------------------------ | -------------------------------------- |
| `PORT`                       | `4000`                   | HTTP/WS port                           |
| `CORS_ORIGIN`                | `http://localhost:3000`  | Frontend origin allowed for CORS       |
| `AUTO_GENERATE_INTERVAL_MS`  | `15000`                  | Demo auto-broadcast interval (0=off)   |

### `frontend/.env`
| Var                       | Default                   | Purpose                          |
| ------------------------- | ------------------------- | -------------------------------- |
| `REACT_APP_API_URL`       | `http://localhost:4000`   | REST base URL                    |
| `REACT_APP_SOCKET_URL`    | `http://localhost:4000`   | Socket.IO endpoint               |

No secrets are committed. `.env` is gitignored; only `.env.example` files
are tracked.

---

## Manual test plan

1. Start backend, start frontend → dashboard loads with 4 seeded items.
2. Wait ~15s → a new notification streams in without a refresh; status dot
   shows *Live*.
3. Open a second browser tab → both tabs receive the same events.
4. Use the *"You WON a prize"* preset → arrives flagged **SPAM**, muted,
   priority forced to Low.
5. Use the *"Unauthorized login attempt"* preset → arrives **High**,
   category **security**, red border + glow.
6. Toggle *Hide spam* and *Unread only* → list updates immediately.
7. *Mark all read* → all items dim; counter resets.
8. POST via curl (see *Using the system*) → appears in every connected client.

---

## Demo

Run both servers locally, then capture a short screen recording of:
1. The initial dashboard load with seeded items.
2. A live auto-generated notification arriving.
3. Sending the spam preset and the High-priority preset from the Composer.
4. Filtering by priority / Unread only / Hide spam.

(Add `docs/demo.gif` or `docs/screenshot.png` to this folder before
submission.)
