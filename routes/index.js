var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

module.exports = router;
/* GET Hello World page. */
router.get('/patient_dashboard', function(req, res) {
  res.render('patient_dashboard', { title: 'Patient Dashboard' });
});