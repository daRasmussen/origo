"use strict";

var ol = require('openlayers');
var progressBar = require('../progressBar');
module.exports = function tile(options, source) {
  options.source = source;
  var progress = new progressBar(document.getElementById('progress'));

  source.on('tileloadstart', function() {
    progress.addLoading();
  });
  source.on('tileloadend', function() {
    progress.addLoaded();
  });
  source.on('tileloaderror', function() {
    progress.addLoaded();
  });
  return new ol.layer.Tile(options);
}
