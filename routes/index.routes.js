const express = require('express');
const {
  generateTrackingUrl,
  getTrackedUrl,
  getRealGeoLocation,
  getVisitLogsDetails,
  getAllTrackers,
  deleteAllVisitLogs,
  deleteVisitLog,
  deleteTrackerAndAllLogs,
} = require('../controllers/generate.tracking.url');

const router = express.Router();

router.route('/generate-tracking-url').post(generateTrackingUrl);
router.route('/t').get(getAllTrackers);
router.route('/t/:trackingId').get(getTrackedUrl).delete(deleteTrackerAndAllLogs);
router.route('/t/logs/:trackingId').get(getVisitLogsDetails).delete(deleteAllVisitLogs);
router.route('/t/log/:logId').delete(deleteVisitLog);
router.route('/location/:trackingId').post(getRealGeoLocation);

module.exports = router;
