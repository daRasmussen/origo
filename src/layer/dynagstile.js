"use strict";

var ol = require('openlayers');
var $ = require('jquery');
var viewer = require('../viewer');
var tile = require('./tile');
var visibleTILELayersIDS = require('../visibleTILELayersIDS');

var dynAgsTile = function dynAgsTile(layerOptions) {
  var agsDefault = {
    layerType: 'tile',
    featureinfoLayer: undefined
  };
  var sourceDefault = {};
  var agsOptions = $.extend(agsDefault, layerOptions);
  var sourceOptions = $.extend(sourceDefault, viewer.getMapSource()[layerOptions.source]);
  sourceOptions.attribution = agsOptions.attribution;
  sourceOptions.projection = viewer.getProjection();
  sourceOptions.params = agsOptions.params || {};
  sourceOptions.params.layers = "show:" + agsOptions.id;
  var agsSource = createSource(sourceOptions);

  //console.log(sourceOptions);
  //console.log(agsOptions);
  //console.log(agsSource);

  return tile(agsOptions, agsSource);

  function createSource(options) {
    return new ol.source.TileArcGISRest({
      attributions: options.attribution,
      projection: options.projection,
      crossOrigin: 'anonymous',
      params: options.params,
      url: options.url
    });
  }

  function updateVisibleIDS(){
    sourceOptions.params.layers = "show:" + visibleTILELayersIDS.ids.join();
    return source.updateParams(sourceOptions);
  }
}
module.exports = dynAgsTile;
