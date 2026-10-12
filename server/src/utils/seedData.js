const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const { connectDB, disconnectDB } = require('../config/db');
const Event = require('../models/Event');

const PRODUCTS = [
  { id: 'lumina-apex-headphones', name: 'Apex Wireless Studio Headphones', price: 349 },
  { id: 'craft-tactile-keyboard', name: 'Craft Precision Mechanical Keyboard', price: 219 },
  { id: 'chrono-titanium-watch', name: 'Aura Chrono Titanium Watch', price: 429 },
  { id: 'merino-studio-hoodie', name: 'Merino Wool Studio Overshirt', price: 165 },
  { id: 'orbit-magnetic-dock', name: 'Orbit MagSpeed Charging Dock', price: 89 },
  { id: 'puretone-iem-monitors', name: 'PureTone Reference In-Ear Monitors', price: 189 },
];

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateCoords(baseX, baseY, spread = 20) {
  return {
    x: Math.round(baseX + (Math.random() - 0.5) * spread * 2),
    y: Math.round(baseY + (Math.random() - 0.5) * spread * 2),
  };
}

async function seedData() {
  try {
    console.log('🌱 Starting Enterprise Analytics Database Seeder...');
    await connectDB();

    await Event.deleteMany({});
    console.log('🧹 Cleared existing event documents.');

    const now = Date.now();
    const eventsToInsert = [];

    // Define archetypes for realistic user behavioral data
    const userArchetypes = [
      // 1. High-intent Buyer (Full funnel journey)
      {
        id: 'sess_prod_buyer_99a1',
        minutesAgo: 65,
        type: 'full_buyer',
        product: PRODUCTS[0],
      },
      // 2. High-intent Buyer 2
      {
        id: 'sess_prod_buyer_770c',
        minutesAgo: 45,
        type: 'full_buyer',
        product: PRODUCTS[1],
      },
      // 3. Cart abandoner (View -> Product -> Add to Cart -> Drop off)
      {
        id: 'sess_prod_abandon_44b2',
        minutesAgo: 50,
        type: 'cart_abandon',
        product: PRODUCTS[2],
      },
      // 4. Cart abandoner 2
      {
        id: 'sess_prod_abandon_11d8',
        minutesAgo: 38,
        type: 'cart_abandon',
        product: PRODUCTS[0],
      },
      // 5. Product Explorer (Browsed multiple products, clicked quick-views)
      {
        id: 'sess_prod_explorer_32e5',
        minutesAgo: 30,
        type: 'product_explorer',
        product: PRODUCTS[3],
      },
      // 6. Product Explorer 2
      {
        id: 'sess_prod_explorer_88f1',
        minutesAgo: 22,
        type: 'product_explorer',
        product: PRODUCTS[4],
      },
      // 7. Casual browser (Home page views & category filters)
      {
        id: 'sess_prod_browser_60d3',
        minutesAgo: 15,
        type: 'casual_browser',
      },
      // 8. Bouncer 1 (Bounced immediately after landing)
      {
        id: 'sess_prod_bounce_10a9',
        minutesAgo: 12,
        type: 'bounce',
      },
      // 9. Bouncer 2
      {
        id: 'sess_prod_bounce_55c4',
        minutesAgo: 8,
        type: 'bounce',
      },
      // 10. Active Live Shopper (Recent session still shopping)
      {
        id: 'sess_prod_active_live01',
        minutesAgo: 3,
        type: 'active_shopper',
        product: PRODUCTS[0],
      },
    ];

    for (const user of userArchetypes) {
      let t = now - user.minutesAgo * 60 * 1000;

      if (user.type === 'bounce') {
        // Only 1 page view event
        eventsToInsert.push({
          sessionId: user.id,
          eventType: 'page_view',
          pageUrl: '/store/index.html',
          timestamp: new Date(t),
          coordinates: null,
          metadata: {
            elementTag: 'body',
            elementText: 'LUMINA — Architectural Design & Studio Hardware',
            actionType: 'VIEW',
          },
        });
        continue;
      }

      // Initial Page View
      eventsToInsert.push({
        sessionId: user.id,
        eventType: 'page_view',
        pageUrl: '/store/index.html',
        timestamp: new Date(t),
        coordinates: null,
        metadata: {
          elementTag: 'body',
          elementText: 'LUMINA — Architectural Design & Studio Hardware',
          actionType: 'VIEW',
        },
      });

      if (user.type === 'casual_browser') {
        t += getRandomInt(4000, 9000);
        eventsToInsert.push({
          sessionId: user.id,
          eventType: 'click',
          pageUrl: '/store/index.html',
          timestamp: new Date(t),
          coordinates: generateCoords(430, 48),
          metadata: {
            elementTag: 'button',
            elementId: 'tabAudio',
            elementClass: 'cat-tab',
            elementText: 'Studio Audio',
            actionType: 'FILTER',
          },
        });

        t += getRandomInt(6000, 12000);
        eventsToInsert.push({
          sessionId: user.id,
          eventType: 'click',
          pageUrl: '/store/index.html',
          timestamp: new Date(t),
          coordinates: generateCoords(300, 310),
          metadata: {
            elementTag: 'button',
            elementId: 'btnHeroShopNow',
            elementClass: 'btn-add-cart',
            elementText: 'Explore Collection →',
            actionType: 'NAVIGATE',
          },
        });
        continue;
      }

      // Product Explorer / Cart Abandon / Full Buyer
      t += getRandomInt(3000, 7000);
      eventsToInsert.push({
        sessionId: user.id,
        eventType: 'click',
        pageUrl: '/store/index.html',
        timestamp: new Date(t),
        coordinates: generateCoords(320, 670),
        metadata: {
          elementTag: 'button',
          elementId: `btnQuickView_${user.product.id}`,
          elementClass: 'btn-quick-view',
          elementText: 'Quick View',
          productId: user.product.id,
          productName: user.product.name,
          actionType: 'PRODUCT_CLICK',
        },
      });

      if (user.type === 'product_explorer') {
        t += getRandomInt(4000, 9000);
        const secProd = PRODUCTS[5];
        eventsToInsert.push({
          sessionId: user.id,
          eventType: 'click',
          pageUrl: '/store/index.html',
          timestamp: new Date(t),
          coordinates: generateCoords(640, 670),
          metadata: {
            elementTag: 'button',
            elementId: `btnQuickView_${secProd.id}`,
            elementClass: 'btn-quick-view',
            elementText: 'Quick View',
            productId: secProd.id,
            productName: secProd.name,
            actionType: 'PRODUCT_CLICK',
          },
        });
        continue;
      }

      // Add to Cart
      t += getRandomInt(4000, 8000);
      eventsToInsert.push({
        sessionId: user.id,
        eventType: 'click',
        pageUrl: '/store/index.html',
        timestamp: new Date(t),
        coordinates: generateCoords(320, 710),
        metadata: {
          elementTag: 'button',
          elementId: `btnAddCart_${user.product.id}`,
          elementClass: 'btn-add-cart',
          elementText: 'Add to Cart',
          productId: user.product.id,
          productName: user.product.name,
          actionType: 'CART_ACTION',
        },
      });

      if (user.type === 'cart_abandon') {
        t += getRandomInt(5000, 10000);
        eventsToInsert.push({
          sessionId: user.id,
          eventType: 'click',
          pageUrl: '/store/index.html',
          timestamp: new Date(t),
          coordinates: generateCoords(1180, 48),
          metadata: {
            elementTag: 'button',
            elementId: 'btnCartToggle',
            elementClass: 'icon-btn',
            elementText: 'Shopping Bag',
            actionType: 'CART_ACTION',
          },
        });
        continue;
      }

      // Proceed to Checkout
      t += getRandomInt(3000, 7000);
      eventsToInsert.push({
        sessionId: user.id,
        eventType: 'click',
        pageUrl: '/store/index.html',
        timestamp: new Date(t),
        coordinates: generateCoords(1080, 520),
        metadata: {
          elementTag: 'a',
          elementId: 'btnProceedCheckout',
          elementClass: 'btn-checkout',
          elementText: 'Proceed to Checkout →',
          actionType: 'CHECKOUT_ACTION',
        },
      });

      // Checkout Page View
      t += getRandomInt(2000, 4000);
      eventsToInsert.push({
        sessionId: user.id,
        eventType: 'page_view',
        pageUrl: '/store/checkout.html',
        timestamp: new Date(t),
        coordinates: null,
        metadata: {
          elementTag: 'body',
          elementText: 'LUMINA — Secure Express Checkout',
          actionType: 'VIEW',
        },
      });

      // Payment Selection
      t += getRandomInt(5000, 9000);
      eventsToInsert.push({
        sessionId: user.id,
        eventType: 'click',
        pageUrl: '/store/checkout.html',
        timestamp: new Date(t),
        coordinates: generateCoords(360, 560),
        metadata: {
          elementTag: 'div',
          elementId: 'payMethodCard',
          elementClass: 'payment-card active',
          elementText: 'Credit Card',
          actionType: 'PAYMENT_SELECT',
        },
      });

      if (user.type === 'full_buyer') {
        // Complete Order
        t += getRandomInt(8000, 16000);
        eventsToInsert.push({
          sessionId: user.id,
          eventType: 'click',
          pageUrl: '/store/checkout.html',
          timestamp: new Date(t),
          coordinates: generateCoords(520, 760),
          metadata: {
            elementTag: 'button',
            elementId: 'btnPlaceOrder',
            elementClass: 'btn-checkout',
            elementText: 'Complete Order & Pay 🔒',
            productId: user.product.id,
            productName: user.product.name,
            actionType: 'CHECKOUT_ACTION',
            domain: 'localhost:5000',
            siteId: 'lumina-store',
          },
        });
      }
    }

    // Attach domain and siteId to all lumina events if not present
    eventsToInsert.forEach((ev) => {
      if (!ev.metadata) ev.metadata = {};
      if (!ev.metadata.domain) ev.metadata.domain = 'localhost:5000';
      if (!ev.metadata.siteId) ev.metadata.siteId = 'lumina-store';
    });

    // Seed 3 realistic sessions for external client website (NovaCloud AI)
    const externalSessions = [
      {
        id: 'sess_ext_nova_dev_alpha',
        minutesAgo: 40,
        actions: [
          {
            type: 'page_view',
            meta: { actionType: 'VIEW', elementText: 'NovaCloud AI — Autonomous Inference' },
          },
          {
            type: 'click',
            coords: { x: 380, y: 720 },
            meta: {
              elementTag: 'BUTTON',
              elementId: 'btnInspectRouting',
              elementText: 'Inspect Routing Topology →',
              actionType: 'FEATURE_CLICK',
              productName: 'Vector Routing Engine',
            },
          },
          {
            type: 'click',
            coords: { x: 650, y: 1100 },
            meta: {
              elementTag: 'BUTTON',
              elementId: 'tierEnterprise',
              elementText: '64x H100 (Enterprise Mesh)',
              actionType: 'TIER_SELECT',
              productName: '64x H100 Mesh',
            },
          },
          {
            type: 'click',
            coords: { x: 600, y: 1250 },
            meta: {
              elementTag: 'BUTTON',
              elementId: 'btnProvisionNow',
              elementText: 'Provision Instant Cluster 🚀',
              actionType: 'CHECKOUT_ACTION',
              productName: 'Instant Compute Provisioning',
            },
          },
        ],
      },
      {
        id: 'sess_ext_nova_founder_beta',
        minutesAgo: 25,
        actions: [
          {
            type: 'page_view',
            meta: { actionType: 'VIEW', elementText: 'NovaCloud AI — Autonomous Inference' },
          },
          {
            type: 'click',
            coords: { x: 480, y: 380 },
            meta: {
              elementTag: 'BUTTON',
              elementId: 'btnHeroDeployFree',
              elementText: 'Start Free Sandbox Cluster →',
              actionType: 'TRIAL_START',
              productName: 'NovaCloud Free Tier',
            },
          },
        ],
      },
      {
        id: 'sess_ext_nova_architect_gamma',
        minutesAgo: 10,
        actions: [
          {
            type: 'page_view',
            meta: { actionType: 'VIEW', elementText: 'NovaCloud AI — Autonomous Inference' },
          },
          {
            type: 'click',
            coords: { x: 800, y: 720 },
            meta: {
              elementTag: 'BUTTON',
              elementId: 'btnInspectSecurity',
              elementText: 'Download SOC-2 Type II Report →',
              actionType: 'FEATURE_CLICK',
              productName: 'Confidential Compute',
            },
          },
        ],
      },
    ];

    for (const ext of externalSessions) {
      let t = now - ext.minutesAgo * 60 * 1000;
      for (const act of ext.actions) {
        t += getRandomInt(3000, 12000);
        eventsToInsert.push({
          sessionId: ext.id,
          eventType: act.type,
          pageUrl: '/external/index.html',
          timestamp: new Date(t),
          coordinates: act.coords || null,
          metadata: {
            ...act.meta,
            domain: 'novacloud-ai.io',
            siteId: 'novacloud-ai',
            title: 'NovaCloud AI — Autonomous Inference & Cloud GPU Mesh',
            referrer: 'https://news.ycombinator.com',
          },
        });
      }
    }

    const inserted = await Event.insertMany(eventsToInsert);
    console.log(`✅ Successfully seeded ${inserted.length} analytics events across ${userArchetypes.length + externalSessions.length} sessions (multi-domain enabled)!`);

    if (require.main === module) {
      await disconnectDB();
      console.log('🎉 Enterprise seeder completed successfully.');
    }

    return inserted.length;
  } catch (error) {
    console.error('❌ Seeder Failed:', error);
    if (require.main === module) {
      process.exit(1);
    }
    throw error;
  }
}

if (require.main === module) {
  seedData();
}

module.exports = seedData;
