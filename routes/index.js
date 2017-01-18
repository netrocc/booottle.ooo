var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {

  res.locals.title = 'OOO - Water Bottle Flip 3D';
  res.locals.description = 'NTO Water presents a browser game';
  res.locals.keywords = 'bottle flip, browser game, free';
  res.locals.requrl = req.hostname;
  res.locals.ogimageurl = 'ooo-fb.jpg';

  res.render('index');
/*
  if (req.device.type == 'bot') res.render('index-bot');
  else if (req.device.type == 'desktop') res.render('index');
  else res.render('index-nogame');
*/
});

module.exports = router;
