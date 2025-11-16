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
  },
  { timestamps: true }
);

VisitLogSchema.index({ location: '2dsphere' });

const VisitLogModel = model('VisitLog', VisitLogSchema);
module.exports = { VisitLogModel };
