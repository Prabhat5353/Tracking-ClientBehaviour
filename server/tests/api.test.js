const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const { app } = require('../src/server');
const { connectDB, disconnectDB } = require('../src/config/db');
const Event = require('../src/models/Event');

describe('User Analytics API Endpoints', () => {
  before(async () => {
    // Connect to in-memory/test DB
    await connectDB();
    await Event.deleteMany({});
  });

  after(async () => {
    await Event.deleteMany({});
    await disconnectDB();
  });

  test('GET /api/health returns 200 and healthy status', async () => {
    const res = await request(app).get('/api/health');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.status, 'healthy');
  });

  test('POST /api/events accepts valid page_view event', async () => {
    const payload = {
      sessionId: 'test_sess_001',
      eventType: 'page_view',
      pageUrl: '/demo/index.html',
      timestamp: new Date().toISOString(),
    };

    const res = await request(app).post('/api/events').send(payload);
    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.event.sessionId, 'test_sess_001');
    assert.strictEqual(res.body.event.eventType, 'page_view');
    assert.strictEqual(res.body.event.coordinates, null);
  });

  test('POST /api/events accepts valid click event with coordinates', async () => {
    const payload = {
      sessionId: 'test_sess_001',
      eventType: 'click',
      pageUrl: '/demo/index.html',
      timestamp: new Date().toISOString(),
      coordinates: { x: 350, y: 520 },
    };

    const res = await request(app).post('/api/events').send(payload);
    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.event.eventType, 'click');
    assert.strictEqual(res.body.event.coordinates.x, 350);
    assert.strictEqual(res.body.event.coordinates.y, 520);
  });

  test('POST /api/events rejects missing sessionId', async () => {
    const payload = {
      eventType: 'page_view',
      pageUrl: '/demo/index.html',
    };

    const res = await request(app).post('/api/events').send(payload);
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.success, false);
    assert.match(res.body.error, /sessionId/);
  });

  test('POST /api/events rejects invalid eventType', async () => {
    const payload = {
      sessionId: 'test_sess_002',
      eventType: 'hover',
      pageUrl: '/demo/index.html',
    };

    const res = await request(app).post('/api/events').send(payload);
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.success, false);
  });

  test('POST /api/events rejects click without valid coordinates', async () => {
    const payload = {
      sessionId: 'test_sess_002',
      eventType: 'click',
      pageUrl: '/demo/index.html',
    };

    const res = await request(app).post('/api/events').send(payload);
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.success, false);
    assert.match(res.body.error, /coordinates/);
  });

  test('GET /api/sessions returns aggregate session metrics', async () => {
    const res = await request(app).get('/api/sessions');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert(Array.isArray(res.body.sessions));
    assert(res.body.sessions.length > 0);

    const session = res.body.sessions.find((s) => s.sessionId === 'test_sess_001');
    assert(session, 'Expected test_sess_001 in sessions list');
    assert.strictEqual(session.totalEvents, 2);
    assert(session.firstSeen);
    assert(session.lastActive);
  });

  test('GET /api/sessions/:sessionId returns chronological user journey', async () => {
    const res = await request(app).get('/api/sessions/test_sess_001');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.sessionId, 'test_sess_001');
    assert.strictEqual(res.body.events.length, 2);
    assert.strictEqual(res.body.events[0].eventType, 'page_view');
    assert.strictEqual(res.body.events[1].eventType, 'click');
  });

  test('GET /api/clicks returns click coordinates for pageUrl', async () => {
    const res = await request(app).get('/api/clicks?url=/demo/index.html');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.totalClicks, 1);
    assert.strictEqual(res.body.points[0].x, 350);
    assert.strictEqual(res.body.points[0].y, 520);
  });

  test('GET /api/pages returns distinct tracked page paths', async () => {
    const res = await request(app).get('/api/pages');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert(res.body.pages.includes('/demo/index.html'));
  });

  test('GET /api/stats returns aggregate KPI numbers', async () => {
    const res = await request(app).get('/api/stats');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.stats.totalEvents, 2);
    assert.strictEqual(res.body.stats.totalClicks, 1);
    assert.strictEqual(res.body.stats.totalPageViews, 1);
  });
});
