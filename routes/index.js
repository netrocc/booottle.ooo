var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', {
    title: 'BOOOTTLE.OOO - Water Bottle Flip 3D',
    description: '',
    keywords: 'bottle, flip, 3d, netro',
    requrl: req.hostname,
    ogimageurl: 'booottle.ooo.jpg'
  });
});

module.exports = router;
