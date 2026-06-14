const express = require('express');
const router = express.Router();
const { getAll, update } = require('../controllers/automatedNotificationController');
const protect = require('../middlewares/authMiddleware');
const adminOnly = require('../middlewares/adminMiddleware');

router.get('/', protect, adminOnly, getAll);
router.put('/:operation', protect, adminOnly, update);

module.exports = router;