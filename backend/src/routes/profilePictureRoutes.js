const express = require('express');
const uploadController = require('../controllers/uploadController');

const router = express.Router();

// Public profile picture endpoint (no authentication required)
router.get('/:userId', uploadController.getProfilePicture);

module.exports = router;
