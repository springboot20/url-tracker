const { Schema, model } = require('mongoose');

const Tracker = new Schema(
  {
    trackingId: {
      type: String,
      unique: true,
      required: true,
    },
    targetURL: {
      type: String,
      required: true,
    },
    logs: [
      {
        type: Schema.Types.ObjectId,
        ref: 'VisitLog',
      },
    ],
  },
  { timestamps: true }
);

const TrackerModel = model('Tracker', Tracker);
module.exports = { TrackerModel };
