var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Caretaker Monitoring App' });
});

router.get('/patient_dashboard', function(req, res) {
  res.render('patient_dashboard', { title: 'Patient Dashboard' });
});

router.get('/setting', function(req, res) {
  res.render('setting', { title: 'User Setting' });
});

module.exports = router;