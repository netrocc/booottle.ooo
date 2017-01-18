var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {

  res.locals.title = 'OOO - Water Bottle Flip 3D';
  res.locals.description = 'The first real 3D bottle flip browser game';
  res.locals.keywords = 'bottle flip, water bottle flipping, browser game, free';
  res.locals.requrl = req.hostname;
  res.locals.ogimageurl = 'ooo-fb.jpg';

  if (req.device.type == 'bot') res.render('index-bot');
  else if (req.device.type == 'desktop') res.render('index');
  else res.render('index-nogame');
});

module.exports = router;
