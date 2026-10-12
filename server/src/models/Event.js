const mongoose = require('mongoose');

const coordinatesSchema = new mongoose.Schema(
  {
    x: {
      type: Number,
      required: true,
    },
    y: {
      type: Number,
      required: true,
    },
  },
  { _id: false }
);

const metadataSchema = new mongoose.Schema(
  {
    elementTag: { type: String, default: null, trim: true },
    elementId: { type: String, default: null, trim: true },
    elementClass: { type: String, default: null, trim: true },
    elementText: { type: String, default: null, trim: true },
    productId: { type: String, default: null, trim: true },
    productName: { type: String, default: null, trim: true },
    actionType: { type: String, default: null, trim: true },
    domain: { type: String, default: null, trim: true },
    siteId: { type: String, default: null, trim: true },
    referrer: { type: String, default: null, trim: true },
    title: { type: String, default: null, trim: true },
  },
  { _id: false }
);

const eventSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: [true, 'sessionId is required'],
      trim: true,
      index: true,
    },
    eventType: {
      type: String,
      required: [true, 'eventType is required'],
      enum: {
        values: ['page_view', 'click'],
        message: '{VALUE} is not a valid eventType. Must be "page_view" or "click".',
      },
      index: true,
    },
    pageUrl: {
      type: String,
      required: [true, 'pageUrl is required'],
      trim: true,
      index: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    coordinates: {
      type: coordinatesSchema,
      default: null,
    },
    metadata: {
      type: metadataSchema,
      default: null,
    },
  },
  {
    timestamps: false,
    versionKey: false,
  }
);

// Compound index for chronological session reconstructions
eventSchema.index({ sessionId: 1, timestamp: 1 });

// Compound index for URL click heatmap queries
eventSchema.index({ pageUrl: 1, eventType: 1, timestamp: -1 });

// Index for product interaction analytics
eventSchema.index({ 'metadata.productName': 1, eventType: 1 });
eventSchema.index({ 'metadata.domain': 1, timestamp: -1 });
eventSchema.index({ 'metadata.siteId': 1, timestamp: -1 });
eventSchema.index({ timestamp: -1 });

const Event = mongoose.model('Event', eventSchema);

module.exports = Event;
