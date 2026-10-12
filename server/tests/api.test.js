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

  test('POST /api/events persists rich element and product metadata', async () => {
    const payload = {
      sessionId: 'test_sess_rich',
      eventType: 'click',
      pageUrl: '/store/index.html',
      coordinates: { x: 420, y: 780 },
      metadata: {
        elementTag: 'button',
        elementId: 'btnAddCart_lumina-apex-headphones',
        elementClass: 'btn-add-cart',
        elementText: 'Add to Cart',
        productId: 'lumina-apex-headphones',
        productName: 'Apex Wireless Studio Headphones',
        actionType: 'CART_ACTION',
      },
    };

    const res = await request(app).post('/api/events').send(payload);
    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.event.metadata.productName, 'Apex Wireless Studio Headphones');
    assert.strictEqual(res.body.event.metadata.actionType, 'CART_ACTION');
  });

  test('GET /api/analytics/overview returns executive KPI aggregates & time-series', async () => {
    const res = await request(app).get('/api/analytics/overview');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert(res.body.kpis);
    assert(typeof res.body.kpis.totalSessions === 'number');
    assert(typeof res.body.kpis.totalClicks === 'number');
    assert(typeof res.body.kpis.bounceRatePercent === 'number');
    assert(Array.isArray(res.body.timeline));
  });

  test('GET /api/analytics/product-interactions ranks products with unique users and rates', async () => {
    const res = await request(app).get('/api/analytics/product-interactions');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert(Array.isArray(res.body.items));
    const prod = res.body.items.find((p) => p.name === 'Apex Wireless Studio Headphones');
    assert(prod, 'Apex Headphones should appear in product interactions');
    assert(prod.totalClicks >= 1);
    assert(prod.uniqueUsers >= 1);
  });

  test('GET /api/analytics/funnel returns sequential stage drop-off analysis', async () => {
    const res = await request(app).get('/api/analytics/funnel');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert(Array.isArray(res.body.steps));
    assert.strictEqual(res.body.steps.length, 4);
    assert.strictEqual(res.body.steps[0].name, 'Store Visit');
    assert.strictEqual(res.body.steps[1].name, 'Product Engagement');
    assert.strictEqual(res.body.steps[2].name, 'Add to Cart');
    assert.strictEqual(res.body.steps[3].name, 'Checkout & Order');
  });

  test('GET /api/sessions/:sessionId/report returns detailed audit trail with action badges', async () => {
    const res = await request(app).get('/api/sessions/test_sess_rich/report');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.sessionId, 'test_sess_rich');
    assert(Array.isArray(res.body.timeline));
    assert.strictEqual(res.body.timeline[0].actionBadge, 'CART_ACTION');
    assert(Array.isArray(res.body.pagesTimeBreakdown));
  });

  test('POST /api/events ingests external website event with domain & siteId', async () => {
    const payload = {
      sessionId: 'sess_ext_test_site',
      eventType: 'click',
      pageUrl: '/pricing.html',
      coordinates: { x: 500, y: 350 },
      metadata: {
        domain: 'novacloud-ai.io',
        siteId: 'novacloud-ai',
        title: 'NovaCloud AI Pricing',
        actionType: 'TIER_SELECT',
        elementText: 'Deploy Enterprise Cluster',
      },
    };

    const res = await request(app).post('/api/events').send(payload);
    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.event.metadata.domain, 'novacloud-ai.io');
    assert.strictEqual(res.body.event.metadata.siteId, 'novacloud-ai');
  });

  test('GET /api/analytics/domains discovers external domains and aggregates counts', async () => {
    const res = await request(app).get('/api/analytics/domains');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert(Array.isArray(res.body.domains));
    const nova = res.body.domains.find((d) => d.siteId === 'novacloud-ai' || d.domain === 'novacloud-ai.io');
    assert(nova, 'Expected novacloud-ai domain in /api/analytics/domains');
    assert(nova.totalEvents >= 1);
  });

  test('GET /api/analytics/overview supports siteId filtering', async () => {
    const res = await request(app).get('/api/analytics/overview?siteId=novacloud-ai');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert(res.body.kpis.totalEvents >= 1);
    assert.strictEqual(res.body.kpis.totalSessions, 1);
  });
});

