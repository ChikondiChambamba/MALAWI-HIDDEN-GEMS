const express = require('express');
const { renderHome, renderAbout } = require('../controllers/pageController');

const router = express.Router();

router.get('/', renderHome);
router.get('/about', renderAbout);

module.exports = router;
