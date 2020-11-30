var express = require('express');

var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { login_errors: req.session.messages || [] });
});

router.get('/patient_dashboard', function(req, res) {
  res.render('patient_dashboard', { username: req.user.username });
});
router.get('/admin', function(req, res) {
  res.render('admin', {error: {name: '', message: ''}});
});
router.get('/account_setting', function(req, res) {
  res.render('account_setting', { username: req.user.username });
});

module.exports = router;