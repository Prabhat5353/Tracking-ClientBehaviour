const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const { connectDB, disconnectDB } = require('../config/db');
const Event = require('../models/Event');

const PAGES = [
  '/store/index.html',
  '/store/checkout.html',
  '/demo/index.html',
  '/demo/pricing.html',
];

// Click clusters simulating real user interactions on UI components
const BUTTON_HOTSPOTS = {
  '/store/index.html': [
    { name: 'Hero CTA (Explore Collection)', baseX: 300, baseY: 310, spread: 25 },
    { name: 'Hero CTA (Preview Apex ANC)', baseX: 470, baseY: 310, spread: 20 },
    { name: 'Category Tab: Studio Audio', baseX: 430, baseY: 48, spread: 15 },
    { name: 'Category Tab: Workstation', baseX: 530, baseY: 48, spread: 15 },
    { name: 'Navbar Bag Trigger', baseX: 1180, baseY: 48, spread: 12 },
    { name: 'Apex Headphones Add to Cart', baseX: 320, baseY: 670, spread: 20 },
    { name: 'Tactile Keyboard Add to Cart', baseX: 640, baseY: 670, spread: 20 },
    { name: 'Chrono Watch Add to Cart', baseX: 960, baseY: 670, spread: 20 },
    { name: 'Cart Drawer Proceed to Checkout', baseX: 1080, baseY: 520, spread: 25 },
  ],
  '/store/checkout.html': [
    { name: 'Email Input', baseX: 450, baseY: 220, spread: 20 },
    { name: 'Address Input', baseX: 450, baseY: 420, spread: 20 },
    { name: 'Credit Card Payment Method', baseX: 360, baseY: 560, spread: 15 },
    { name: 'Apply Coupon Button', baseX: 1080, baseY: 380, spread: 15 },
    { name: 'Complete Order Button', baseX: 520, baseY: 760, spread: 25 },
  ],
  '/demo/index.html': [
    { name: 'Hero Primary CTA', baseX: 480, baseY: 310, spread: 25 },
    { name: 'Hero Secondary CTA', baseX: 640, baseY: 310, spread: 20 },
    { name: 'Navbar Pricing Link', baseX: 520, baseY: 42, spread: 15 },
    { name: 'Feature Card 1', baseX: 320, baseY: 580, spread: 35 },
  ],
  '/demo/pricing.html': [
    { name: 'Pro Plan Button (Popular)', baseX: 600, baseY: 430, spread: 30 },
    { name: 'Starter Plan Button', baseX: 300, baseY: 440, spread: 25 },
  ],
};

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateHotspotClick(hotspot) {
  const offsetX = (Math.random() - 0.5) * 2 * hotspot.spread;
  const offsetY = (Math.random() - 0.5) * 2 * hotspot.spread;
  return {
    x: Math.round(hotspot.baseX + offsetX),
    y: Math.round(hotspot.baseY + offsetY),
  };
}

async function seedData() {
  try {
    console.log('🌱 Starting Analytics Database Seeder...');
    await connectDB();

    // Clear existing events
    await Event.deleteMany({});
    console.log('🧹 Cleared existing event documents.');

    const now = Date.now();
    const sessions = [
      { id: 'sess_prod_exec_alpha81', minutesAgo: 85, journeyLength: 9 },
      { id: 'sess_prod_shopper_99x1', minutesAgo: 50, journeyLength: 7 },
      { id: 'sess_prod_evaluator_4b2', minutesAgo: 32, journeyLength: 12 },
      { id: 'sess_prod_visitor_12f9', minutesAgo: 18, journeyLength: 5 },
      { id: 'sess_prod_buyer_770a', minutesAgo: 8, journeyLength: 15 },
      { id: 'sess_prod_current_active', minutesAgo: 2, journeyLength: 6 },
    ];

    const eventsToInsert = [];

    for (const session of sessions) {
      let currentTime = now - session.minutesAgo * 60 * 1000;
      let currentPage = PAGES[0]; // Start at home

      // First event is page_view
      eventsToInsert.push({
        sessionId: session.id,
        eventType: 'page_view',
        pageUrl: currentPage,
        timestamp: new Date(currentTime),
        coordinates: null,
      });

      for (let step = 1; step < session.journeyLength; step++) {
        // Step time forward 3 to 25 seconds
        currentTime += getRandomInt(3000, 25000);

        // 75% chance of click on current page, 25% chance of navigating to new page
        const isPageSwitch = Math.random() < 0.25;

        if (isPageSwitch) {
          const nextPages = PAGES.filter((p) => p !== currentPage);
          currentPage = nextPages[getRandomInt(0, nextPages.length - 1)];

          eventsToInsert.push({
            sessionId: session.id,
            eventType: 'page_view',
            pageUrl: currentPage,
            timestamp: new Date(currentTime),
            coordinates: null,
          });
        } else {
          // Generate a click
          const hotspots = BUTTON_HOTSPOTS[currentPage] || BUTTON_HOTSPOTS['/demo/index.html'];
          const chosenHotspot = hotspots[getRandomInt(0, hotspots.length - 1)];
          const coords = generateHotspotClick(chosenHotspot);

          eventsToInsert.push({
            sessionId: session.id,
            eventType: 'click',
            pageUrl: currentPage,
            timestamp: new Date(currentTime),
            coordinates: coords,
          });
        }
      }
    }

    const inserted = await Event.insertMany(eventsToInsert);
    console.log(`✅ Successfully seeded ${inserted.length} analytics events across ${sessions.length} sessions!`);

    await disconnectDB();
    console.log('🎉 Seeder completed successfully.');
  } catch (error) {
    console.error('❌ Seeder Failed:', error);
    process.exit(1);
  }
}

// Auto-run if executed directly
if (require.main === module) {
  seedData();
}

module.exports = seedData;
