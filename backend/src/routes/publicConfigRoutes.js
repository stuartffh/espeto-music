const express = require('express');
const publicConfigController = require('../controllers/publicConfigController');

const router = express.Router();

router.get('/', publicConfigController.getPublicConfig);

module.exports = router;
