const { Schema, model } = require('mongoose');

const Tracker = new Schema(
  {
    trackingId: {
      type: String,
      unique: true,
      required: true,
    },
    ogMetadata: {
      title: String, // usually username
      description: String, // bio excerpt or hardcoded
      image: String, // avatar URL
      url: String, // canonical URL
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
