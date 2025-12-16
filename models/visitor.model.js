const { Schema, model } = require('mongoose');

const LocationSchema = new Schema({
  type: {
    type: String,
    enum: ['Point'],
    required: true,
  },
  coordinates: {
    type: [Number], // [longitude, latitude]
    index: '2dsphere',
  },
});

const VisitLogSchema = new Schema(
  {
    ip: String,
    userAgent: String,
    referer: String,
    location: LocationSchema,
    method: {
      type: String,
      enum: ['IP-Based', 'Browser-GPS'],
    },
    trackerId: {
      type: Schema.Types.ObjectId,
      ref: 'Tracker',
      required: true,
    },
    deviceFingerprint: {
      type: {
        screenResolution: String, // e.g., "1920x1080"
        colorDepth: Number, // e.g., 24
        platform: String, // e.g., "Win32", "MacIntel"
        language: String, // e.g., "en-US"
        languages: [String], // All languages
        deviceMemory: Number, // GB of RAM
        hardwareConcurrency: Number, // CPU cores
        timezone: String, // Browser timezone
        timezoneOffset: Number, // Minutes from UTC
        touchSupport: Boolean, // Has touch screen
        plugins: [String], // Browser plugins
        canvas: String, // Canvas fingerprint hash
        canvasFull: String, // Full Canvas fingerprint hash
        webgl: String, // WebGL fingerprint
        fonts: [String], // Available fonts
        battery: {
          charging: Boolean,
          level: Number,
        },
        connection: {
          effectiveType: String, // e.g., "4g"
          downlink: Number,
          rtt: Number,
        },
      },
      required: false,
      default: {},
    },

    // Reverse geocoded address from coordinates
    destination_addresses: {
      type: [String],
      required: false,
    },
    origin_addresses: {
      type: [String],
      required: false,
    },
    rows: {
      type: Array,
      required: false,
    },
  },
  { timestamps: true }
);

VisitLogSchema.index({ location: '2dsphere' });
VisitLogSchema.index({ trackerId: 1, createdAt: -1 }); // Get logs by tracker
VisitLogSchema.index({ ip: 1, 'deviceFingerprint.canvas': 1 }); // For matching repeat visitors
VisitLogSchema.index({ 'deviceFingerprint.canvas': 1 }); // Quick device fingerprint lookup

const VisitLogModel = model('VisitLog', VisitLogSchema);
module.exports = { VisitLogModel };
