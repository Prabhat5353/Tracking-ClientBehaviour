# ⚡  User Analytics & Session Tracking Application

> **Full Stack Engineer Role Assignment Submission**  
> A lightweight, production-grade, end-to-end user analytics and session tracking platform built to help e-commerce businesses understand user interactions and journeys.

Featuring a standalone client-side vanilla JavaScript tracking script (`tracker.js`), an interactive mock e-commerce demo storefront, an Express + MongoDB backend with zero-configuration embedded in-memory fallback, and a modern React + Vite + Tailwind CSS admin dashboard with user journey timelines and click heatmap visualizers.

---

## 🎯 Assignment Requirements Coverage Matrix

| Assignment Requirement | Implementation Component | Status |
| :--- | :--- | :---: |
| **1. Event Tracking (Client Side)** | | |
| • Pure JavaScript tracking script | [`tracker/tracker.js`](tracker/tracker.js) (Zero dependencies, < 3KB) | ✅ Complete |
| • Track `page_view` and `click` | Automatic `page_view` on execution + window `click` capture | ✅ Complete |
| • Capture `session_id` (cookie or localStorage) | Persistent `cf_session_id` synchronized across `localStorage` & cookie | ✅ Complete |
| • Capture event type, page URL, timestamp | Included in all event payloads | ✅ Complete |
| • Capture click `x`/`y` coordinates | Document coordinates (`pageX`, `pageY` with scroll offset fallback) | ✅ Complete |
| • Send data to backend API | Asynchronous `fetch` with `keepalive: true` & silent fail handling | ✅ Complete |
| • Demo webpage to test tracking | [`demo/index.html`](demo/index.html) (CausalStore mock e-commerce site with live HUD) | ✅ Complete |
| **2. Backend (Node.js)** | | |
| • Ingest & store events API | `POST /api/events` with strict payload validation | ✅ Complete |
| • Fetch sessions list with event counts | `GET /api/sessions` with aggregation pipeline (`totalEvents`, `firstSeen`, `lastActive`) | ✅ Complete |
| • Fetch all events for specific session | `GET /api/sessions/:sessionId` (reconstructs chronological journey) | ✅ Complete |
| • Fetch click data for a page (heatmap) | `GET /api/clicks?url=<pageUrl>` (returns array of click coordinates) | ✅ Complete |
| **3. Database (MongoDB)** | | |
| • MongoDB schema suitable for querying | [`server/src/models/Event.js`](server/src/models/Event.js) with compound indexes | ✅ Complete |
| • Zero-config local execution | Embedded in-memory MongoDB fallback via `mongodb-memory-server` | ✅ Complete |
| **4. Dashboard (Frontend)** | | |
| • Sessions View: list with total events | [`client/src/components/SessionTable.jsx`](client/src/components/SessionTable.jsx) | ✅ Complete |
| • Session click: show ordered user journey | [`client/src/components/SessionDrawer.jsx`](client/src/components/SessionDrawer.jsx) (Timeline drawer) | ✅ Complete |
| • Heatmap View: select page URL | Dynamic dropdown in [`HeatmapViewer.jsx`](client/src/components/HeatmapViewer.jsx) | ✅ Complete |
| • Display click positions visually | Interactive HTML5 Canvas with radial glow / dots overlay | ✅ Complete |
| **5. Documentation & Submission** | | |
| • Setup steps & Tech stack | Included in README with quick-start guides | ✅ Complete |
| • Assumptions & trade-offs | Comprehensive section covering coordinates, ingestion, and storage | ✅ Complete |
| • Public GitHub repository ready | Initialized Git repository with clean commits | ✅ Complete |

---

## 🏛 Architecture & Data Flow

```
+-------------------------------------------------------------+
|                     Client Applications                     |
|                                                             |
|   +-----------------------+     +-----------------------+   |
|   |   Host / Demo Page    |     |    Admin Dashboard    |   |
|   |  (e-commerce / SaaS)  |     |   (React 18 + Vite)   |   |
|   +-----------+-----------+     +-----------+-----------+   |
|               |                             ^               |
|         <script tag>                        |               |
|               v                             |               |
|   +-----------------------+                 |               |
|   |      tracker.js       |                 |               |
|   |  - localStorage sess  |                 |               |
|   |  - page_view capture  |                 |               |
|   |  - click coordinates  |                 |               |
|   |  - silent async fetch |                 |               |
+---------------+-----------------------------+---------------+
                |                             |
     POST /api/events                 GET /api/sessions
     (Beacon Ingest)                  GET /api/clicks
                |                     GET /api/pages
                v                             |
+---------------------------------------------+---------------+
|                 Backend Server (Node.js & Express)          |
|                                                             |
|   - CORS Enabled (Ingest from any origin)                   |
|   - Request Validation Middleware                           |
|   - Aggregation Pipelines (Sessions, Metrics, Journeys)     |
|   - Static Serving of Tracker Script & Demo Landing Page    |
+-----------------------------+-------------------------------+
                              |
                     Mongoose Connection
                              v
+-------------------------------------------------------------+
|                      MongoDB Database                       |
|                                                             |
|   - Collections: `events`                                   |
|   - Compound Indexes:                                       |
|       * { sessionId: 1, timestamp: 1 }                      |
|       * { pageUrl: 1, eventType: 1, timestamp: -1 }         |
|   - Dual Mode: Native MongoDB or Zero-Config In-Memory      |
+-------------------------------------------------------------+
```

---

## 🛠 Tech Stack

| Layer | Technologies | Key Highlights |
| :--- | :--- | :--- |
| **Tracking Script** | Vanilla JavaScript (ES6+ / IIFE) | Zero dependencies, < 3KB, non-blocking async fetch, silent error handling, automatic session lifecycle in `localStorage`. |
| **Demo Application** | HTML5, CSS3, Vanilla JS | Realistic mock SaaS platform with CTAs, pricing matrix, and a live HUD showing real-time tracking metrics and session resets. |
| **Backend Server** | Node.js (v20+), Express 4, Mongoose 8, CORS | Strict payload validation, modular controllers, error handling, compound indexing, MongoDB aggregation pipelines. |
| **Database** | MongoDB / Mongoose | Dual-mode: Connects to external MongoDB (`MONGODB_URI`) or automatically starts an embedded in-memory MongoDB (`mongodb-memory-server`) for zero-friction setup. |
| **Admin Dashboard** | React 18, Vite 5, Tailwind CSS 3, Lucide Icons, Axios | Dark executive UI, Sessions Explorer, slide-over User Journey drawer, and HTML5 Canvas click heatmap overlay with customizable radial glow. |
| **Testing** | Node.js Test Runner (`node:test`), Supertest | Automated integration tests covering ingestion, validation errors, session aggregation, journey ordering, and click queries. |

---

## 📂 Project Structure

```
user-analytics-session-tracker/
├── package.json                 # Monorepo orchestration scripts
├── README.md                    # Comprehensive technical documentation
├── .gitignore
│
├── server/                      # Node.js + Express + Mongoose Backend
│   ├── package.json
│   ├── .env.example
│   ├── .env
│   ├── src/
│   │   ├── server.js            # Express app, static routes, CORS, bootstrap
│   │   ├── config/
│   │   │   └── db.js            # Mongoose dual-mode connection
│   │   ├── models/
│   │   │   └── Event.js         # Schema: sessionId, eventType, pageUrl, timestamp, coordinates
│   │   ├── middleware/
│   │   │   ├── validateEvent.js # Payload validation (400 on malformed events)
│   │   │   └── errorHandler.js  # Global centralized error handler
│   │   ├── controllers/
│   │   │   ├── eventController.js     # POST /api/events
│   │   │   ├── sessionController.js   # GET /api/sessions & GET /api/sessions/:sessionId
│   │   │   └── analyticsController.js # GET /api/clicks, GET /api/pages, GET /api/stats
│   │   ├── routes/
│   │   │   └── apiRoutes.js     # Express router mapping
│   │   └── utils/
│   │       └── seedData.js      # Mock sessions & click clusters seeder
│   └── tests/
│       └── api.test.js          # Integration test suite (11 test cases)
│
├── tracker/                     # Standalone Client Tracker
│   └── tracker.js               # Pure JS snippet, localStorage session management
│
├── demo/                        # Interactive Demo Webpage
│   ├── index.html               # Mock SaaS landing page with buttons & CTAs
│   ├── styles.css               # Modern dark styling
│   └── demo.js                  # Interactive HUD controller & page switcher
│
└── client/                      # React Admin Dashboard
    ├── package.json
    ├── vite.config.js           # Dev server & proxy settings
    ├── tailwind.config.js       # Color palette & layout tokens
    ├── postcss.config.js
    ├── index.html
    └── src/
        ├── main.jsx
        ├── App.jsx              # Tab navigation & live polling orchestrator
        ├── index.css            # Tailwind directives & glassmorphism utilities
        ├── api/
        │   └── client.js        # Axios client instance
        ├── utils/
        │   └── formatters.js    # Date, relative time, and duration utilities
        └── components/
            ├── Navbar.jsx       # Header, auto-refresh toggle (5s), demo link
            ├── StatsOverview.jsx# KPI metric cards (Sessions, Events, Clicks, Depth)
            ├── SessionTable.jsx # Searchable, sortable sessions explorer table
            ├── SessionDrawer.jsx# User journey chronological timeline drawer
            └── HeatmapViewer.jsx# HTML5 Canvas click coordinate overlay with glow
```

---

## 🚀 Quick Start & Local Setup

### Prerequisites
- **Node.js**: v18.x or v20.x
- **npm**: v9.x or higher
- **MongoDB**: *(Optional)* An external MongoDB instance is **not required** because the server automatically launches an embedded in-memory MongoDB instance out of the box! If you wish to use an external instance, specify `MONGODB_URI` in `server/.env`.

---

### Step 1: Install Dependencies

You can install dependencies for both the backend and frontend:

```bash
# 1. Install backend dependencies
cd server
npm install

# 2. Install client dependencies
cd ../client
npm install

# 3. Return to project root
cd ..
```

---

### Step 2: Configure Environment Variables

The server includes `.env.example`. A `.env` file is pre-populated in `server/.env`:

```env
PORT=5000
NODE_ENV=development

# Optional: external MongoDB connection string.
# If omitted or commented out, embedded in-memory MongoDB will be used automatically.
# MONGODB_URI=mongodb://localhost:27017/user_analytics

# Allowed origins for CORS (default '*' allows any origin)
CORS_ORIGIN=*
```

---

### Step 3: Populate Sample Data (Optional)

To seed the database with realistic multi-step user journeys and click hotspots across multiple pages:

```bash
cd server
npm run seed
cd ..
```

---

### Step 4: Start the Applications

#### Terminal 1: Start Backend Server
```bash
cd server
npm start
```
The server will start at:
- **API Base URL**: `http://localhost:5000/api`
- **Demo Webpage**: `http://localhost:5000/demo/index.html`
- **Tracker Script**: `http://localhost:5000/tracker/tracker.js`

#### Terminal 2: Start React Admin Dashboard
```bash
cd client
npm run dev
```
The dashboard will open at:
- **Admin Dashboard**: `http://localhost:5173`

---

## 🧪 Testing the Tracking Script (Demo Page)

1. Open your browser and navigate to:
   ```
   http://localhost:5000/demo/index.html
   ```
2. The demo page is an interactive SaaS platform containing buttons ("Buy Now", "Learn More", "Features", "Pricing", feature cards, and tier buttons) positioned across the viewport.
3. Observe the **floating HUD** in the bottom-right corner:
   - Displays your unique `cf_session_id`.
   - Displays the counter of events successfully transmitted to the backend.
   - Click any button or page area — the tracker immediately captures your `(pageX, pageY)` coordinates and fires a POST request to `/api/events`.
   - Click **🔄 New Session** in the HUD to simulate a new user session.
   - Click **📄 Next Page** to simulate navigating between pages (`/demo/index.html`, `/demo/pricing.html`, `/demo/features.html`).
4. Click **📊 Open Admin Dashboard →** in the HUD (or visit `http://localhost:5173`) to see your real-time actions reflected immediately!

---

## 📡 API Reference

All responses return standard JSON format.

### 1. Ingest Event
- **Endpoint**: `POST /api/events`
- **Description**: Ingests and validates an incoming tracking event. Fails with `400 Bad Request` if mandatory fields are missing or invalid.
- **Request Headers**: `Content-Type: application/json`
- **Request Body**:
```json
{
  "sessionId": "sess_l8xyz123_abc4567",
  "eventType": "click",
  "pageUrl": "/demo/index.html",
  "timestamp": "2026-10-12T09:50:00.000Z",
  "coordinates": {
    "x": 482,
    "y": 315
  }
}
```
> Note: For `eventType: "page_view"`, `coordinates` may be omitted or `null`.
- **Response**: `201 Created`
```json
{
  "success": true,
  "message": "Event recorded successfully",
  "event": {
    "_id": "670a3f89e210b39241b71aa1",
    "sessionId": "sess_l8xyz123_abc4567",
    "eventType": "click",
    "pageUrl": "/demo/index.html",
    "timestamp": "2026-10-12T09:50:00.000Z",
    "coordinates": { "x": 482, "y": 315 }
  }
}
```

---

### 2. Get All Sessions
- **Endpoint**: `GET /api/sessions`
- **Description**: Returns all unique tracked sessions aggregated with total event count, first seen timestamp, last active timestamp, and event breakdown, sorted by most recent activity descending.
- **Response**: `200 OK`
```json
{
  "success": true,
  "count": 6,
  "sessions": [
    {
      "sessionId": "sess_prod_current_active",
      "totalEvents": 6,
      "firstSeen": "2026-10-12T09:42:00.000Z",
      "lastActive": "2026-10-12T09:44:15.000Z",
      "pageViews": 2,
      "clicks": 4,
      "uniquePagesCount": 2
    }
  ]
}
```

---

### 3. Get Session Journey
- **Endpoint**: `GET /api/sessions/:sessionId`
- **Description**: Returns the chronologically ordered sequence of user events for a specific session to reconstruct the user's complete navigation path and interactions.
- **Response**: `200 OK`
```json
{
  "success": true,
  "sessionId": "sess_prod_current_active",
  "summary": {
    "totalEvents": 6,
    "firstSeen": "2026-10-12T09:42:00.000Z",
    "lastActive": "2026-10-12T09:44:15.000Z",
    "durationMs": 135000,
    "durationSeconds": 135
  },
  "events": [
    {
      "_id": "670a3f89e210b39241b71aa1",
      "sessionId": "sess_prod_current_active",
      "eventType": "page_view",
      "pageUrl": "/demo/index.html",
      "timestamp": "2026-10-12T09:42:00.000Z",
      "coordinates": null
    },
    {
      "_id": "670a3f89e210b39241b71aa2",
      "sessionId": "sess_prod_current_active",
      "eventType": "click",
      "pageUrl": "/demo/index.html",
      "timestamp": "2026-10-12T09:42:18.000Z",
      "coordinates": { "x": 480, "y": 310 }
    }
  ]
}
```

---

### 4. Get Click Coordinates for Heatmap
- **Endpoint**: `GET /api/clicks?url=<pageUrl>`
- **Query Parameters**:
  - `url` *(optional)*: Filter clicks to a specific page path (e.g., `/demo/index.html`). If omitted, returns all clicks across the application.
- **Response**: `200 OK`
```json
{
  "success": true,
  "pageUrl": "/demo/index.html",
  "totalClicks": 24,
  "points": [
    {
      "id": "670a3f89e210b39241b71aa2",
      "x": 480,
      "y": 310,
      "pageUrl": "/demo/index.html",
      "timestamp": "2026-10-12T09:42:18.000Z",
      "sessionId": "sess_prod_current_active"
    }
  ]
}
```

---

### 5. Get Tracked Pages
- **Endpoint**: `GET /api/pages`
- **Description**: Returns a distinct list of all tracked `pageUrl` paths along with per-page metrics (total events, clicks, page views).
- **Response**: `200 OK`
```json
{
  "success": true,
  "count": 4,
  "pages": [
    "/demo/index.html",
    "/demo/pricing.html",
    "/demo/features.html",
    "/demo/checkout.html"
  ],
  "pageStats": [
    {
      "pageUrl": "/demo/index.html",
      "totalEvents": 42,
      "clicks": 28,
      "pageViews": 14,
      "lastSeen": "2026-10-12T09:44:15.000Z"
    }
  ]
}
```

---

### 6. Get High-Level KPI Summary
- **Endpoint**: `GET /api/stats`
- **Description**: Returns overall system totals for dashboard metric cards.
- **Response**: `200 OK`
```json
{
  "success": true,
  "stats": {
    "totalEvents": 68,
    "totalSessions": 6,
    "totalClicks": 44,
    "totalPageViews": 24,
    "avgEventsPerSession": 11.3
  }
}
```

---

## ⚖️ Architectural Assumptions & Trade-offs

### 1. Coordinate Tracking: Document-Relative vs Viewport-Relative vs Normalized
- **Chosen Approach**: Document-relative coordinates (`pageX`, `pageY` with scroll offset fallback).
- **Rationale**:
  - `clientX` and `clientY` are relative to the visible browser viewport. If a user scrolls down a long webpage and clicks a pricing card, `clientY` would reflect their current viewport offset rather than the card's position on the page. Overlaying `clientX/Y` on a full-page canvas would cluster all clicks near the top.
  - `pageX` and `pageY` record the absolute position from the top-left of the entire HTML document, preserving click placement regardless of scroll position.
- **Trade-off / Limitation**:
  - Responsive web design means buttons change positions across different screen widths (e.g., mobile 375px vs desktop 1920px). Document-relative absolute coordinates assume a standard reference layout.
  - *Production Enhancement*: In higher-scale enterprise setups (like Hotjar/FullStory), tracker scripts either capture CSS selector paths (`e.target.closest('button')`) or record viewport width alongside percentage coordinates (`x / document.body.clientWidth * 100`) to reproject clicks dynamically across responsive breakpoints.

---

### 2. Event Ingestion: Immediate HTTP Fetch vs Batching vs `navigator.sendBeacon`
- **Chosen Approach**: Immediate asynchronous `window.fetch` with `keepalive: true` and fail-silent error swallowing.
- **Rationale**:
  - Immediate dispatch guarantees that clicks and page views appear on the admin dashboard with zero latency.
  - Setting `keepalive: true` ensures that outgoing fetch requests are not abruptly terminated by the browser if a user immediately clicks a link that navigates away from the page.
- **Trade-off / Limitation**:
  - High-frequency clicking or rapid browsing can generate multiple concurrent HTTP requests, which may cause connection overhead on mobile networks.
  - *Production Enhancement*: A client-side queue with a short debounce (e.g., buffer events for 500ms or until 10 events accumulate) combined with `navigator.sendBeacon(url, blob)` during `visibilitychange` or `pagehide` provides optimal network batching under heavy enterprise loads.

---

### 3. Real-Time Dashboard Updates: Polling vs WebSockets vs Server-Sent Events (SSE)
- **Chosen Approach**: Client-side interval polling (every 5 seconds) with manual refresh toggle and visual active state.
- **Rationale**:
  - Polling requires zero stateful server connection overhead, operates seamlessly across serverless or containerized environments without sticky sessions, and avoids WebSocket reconnection edge cases.
- **Trade-off / Limitation**:
  - Slight delay of up to 5 seconds before new sessions appear on the dashboard; incurs recurring HTTP roundtrips when the tab is idle.
  - *Production Enhancement*: In ultra high-frequency monitoring rooms, Server-Sent Events (SSE) offer an ideal one-way streaming protocol for lightweight event pushes without full duplex WebSocket complexity.

---

### 4. Database Schema: Single Document per Event vs Bucket Pattern
- **Chosen Approach**: Single document per event with compound indexing:
  - `{ sessionId: 1, timestamp: 1 }`
  - `{ pageUrl: 1, eventType: 1, timestamp: -1 }`
- **Rationale**:
  - Simplicity and flexibility: individual events can be queried, filtered, or deleted independently.
  - High write performance: simple `insertOne` / `insertMany` operations without race conditions or document locking.
  - MongoDB's aggregation pipeline (`$group`, `$min`, `$max`) provides sub-millisecond session reconstruction across tens of thousands of records when properly indexed.
- **Trade-off / Limitation**:
  - Storing millions of standalone event documents consumes more BSON index overhead compared to the MongoDB Time-Series collection or the Bucket Pattern (where multiple events within a time window are packed into a single document array).

---

## 🧪 Automated Testing

The backend includes a comprehensive automated test suite testing all 5 core endpoints and error conditions.

```bash
cd server
npm test
```

### Test Suite Coverage:
1. `GET /api/health` — Verifies server health check response.
2. `POST /api/events` — Verifies valid `page_view` ingestion and null coordinates handling.
3. `POST /api/events` — Verifies valid `click` ingestion with numeric `(x, y)` coordinates.
4. `POST /api/events` — Verifies rejection of missing `sessionId` with `400 Bad Request`.
5. `POST /api/events` — Verifies rejection of invalid `eventType` with `400 Bad Request`.
6. `POST /api/events` — Verifies rejection of click events missing valid coordinates with `400 Bad Request`.
7. `GET /api/sessions` — Verifies MongoDB aggregation pipeline computes `totalEvents`, `firstSeen`, and `lastActive`.
8. `GET /api/sessions/:sessionId` — Verifies chronological user journey ordering.
9. `GET /api/clicks?url=...` — Verifies coordinate filtering for heatmap rendering.
10. `GET /api/pages` — Verifies distinct URL extraction for heatmap filters.
11. `GET /api/stats` — Verifies overall KPI metrics computation.

---

## 📜 License
MIT License. Built for full-stack user analytics and session tracking demonstrations.
