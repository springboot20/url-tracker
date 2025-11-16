const express = require('express');
const {
  generateTrackingUrl,
  getTrackedUrl,
  getRealGeoLocation,
  getVisitLogsDetails,
} = require('../controllers/generate.tracking.url');

const router = express.Router();

router.route('/generate-tracking-url').post(generateTrackingUrl);
router.route('/t/:trackingId').get(getTrackedUrl);
router.route('/t/logs/:trackingId').get(getVisitLogsDetails);
router.route('/location/:trackingId').post(getRealGeoLocation);

module.exports = router;
