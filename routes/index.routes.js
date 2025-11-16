const express = require('express');
const {
  generateTrackingUrl,
  getTrackedUrl,
  getRealGeoLocation,
} = require('../controllers/generate.tracking.url');

const router = express.Router();

router.route('/generate-tracking-url').post(generateTrackingUrl);
router.route('/target/:trackingId').get(getTrackedUrl);
router.route('/location/:trackingId').post(getRealGeoLocation);

module.exports = router;
