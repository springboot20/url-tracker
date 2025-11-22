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

Tracker.pre('deleteOne', { document: true, query: false }, async function (next) {
  console.log(`Cascade deleting logs for tracker: ${this._id}`);
  // 'this' refers to the document being deleted
  await model('VisitLog').deleteMany({ _id: { $in: this.logs } });
  next();
});

const TrackerModel = model('Tracker', Tracker);
module.exports = { TrackerModel };
