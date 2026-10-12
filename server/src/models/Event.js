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

const Event = mongoose.model('Event', eventSchema);

module.exports = Event;
