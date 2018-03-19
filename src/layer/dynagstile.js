/**
 * This module creates a dynamic tile source that supports ArcGIS REST services with dynamic layers enabled.
 * @type {Object} Dynamic AGS_TILE
 */
 "use strict";
var ol                   = require('openlayers');
var $                    = require('jquery');
var viewer               = require('../viewer');
var tile                 = require('./tile');
/**
 * [dynAgsTile description]
 * @param {Object} layerOptions are passed from the configuration.
 * @return {Object} a tile layer with a configured ags tile source. That support dynamic layers.
 */
var dynAgsTile = function dynAgsTile(layerOptions) {
    var agsDefault            = { layerType: 'tile', featureinfoLayer: undefined};
    var sourceDefault         = {};
    var agsOptions            = $.extend(agsDefault, layerOptions);
    var sourceOptions         = $.extend(sourceDefault, viewer.getMapSource()[layerOptions.source]);

    sourceOptions.attribution = agsOptions.attribution;
    sourceOptions.projection  = viewer.getProjection();
    //sourceOptions.tileSize    = agsOptions.tileSize;
    // var map = viewer.getMap();
    // var s = map.getSize();
    // var w = s[0];
    // var h = s[1];
    // var ow = 512; //w/4;
    // var oh = 512; //h/4;
    // console.log(w, h);
    // console.log(ow, oh);
    // console.log(Math.ceil(ow), Math.ceil(oh));

    var e = viewer.getMap().getView().calculateExtent(viewer.getMap().getSize());
    var w = ol.extent.getWidth(e);
    var h = ol.extent.getHeight(e);
    //var wk = w/512;
    //var hk = h/512;
    //console.log(wk, hk);

    // 3000 ms
    //var ow = w/0.98 * (512/w);
    //var oh = h/0.95 * (512/h);

    var ow = w/1.51 * (512/w);
    var oh = h/1.48 * (512/h);

    //var ow = w/256; 6000ms
    //var oh = h/256;

    //console.log(1/wk, 1/hk);
    console.log(ow, oh);
    //sourceOptions.tileSize    = [512, 512];
    sourceOptions.tileSize = [ow, oh];
    sourceOptions.tileSizes   = [
      [w/0.48 * (512/w), h/0.45 * (512/h)], // 4 096 000
      [w/0.48 * (512/w), h/0.45 * (512/h)], // 2 048 000
      [w/0.48 * (512/w), h/0.45 * (512/h)], // 1 024 000
      [w/0.48 * (512/w), h/0.45 * (512/h)], // 512 000 start
      [w/0.48 * (512/w), h/0.45 * (512/h)], // 256 000
      [w/0.98 * (512/w), h/0.95 * (512/h)], // 128 000
      [w/1.48 * (512/w), h/1.45 * (512/h)], // 64 000
      [w/1.49 * (512/w), h/1.46 * (512/h)], // 32 000
      [w/1.49 * (512/w), h/1.46 * (512/h)], // 16 000
      [w/1.49 * (512/w), h/1.46 * (512/h)], // 8 000
      [w/1.49 * (512/w), h/1.46 * (512/h)], // 4 000
      [w/1.49 * (512/w), h/1.46 * (512/h)], // 2 000
      [w/1.49 * (512/w), h/1.46 * (512/h)], // 1 000
      [w/1.49 * (512/w), h/1.46 * (512/h)], // 500
      [w/1.49 * (512/w), h/1.46 * (512/h)] // 200
    ];
    sourceOptions.extent = viewer.getExtent();
    sourceOptions.resolutions = viewer.getResolutions();
    sourceOptions.params      = colligate(JSON.parse("[" + agsOptions.id + "]"));

    var tg = new ol.tilegrid.TileGrid({
                         tileSizes: sourceOptions.tileSizes,
                         //tileSize: sourceOptions.tileSize,
                         //extent: sourceOptions.extent,
                         extent: viewer.getMap().getView().calculateExtent(viewer.getMap().getSize()),
                         resolutions: sourceOptions.resolutions
                       });

    var agsSource             = createSource(sourceOptions, tg);
  return tile(agsOptions, agsSource);
  /**
   * This method creates a arcgis tile that supports REST and dynamic layers.
   * @param {Object} options Options for source.
   * @return {Object} return an source TileArcGISRest object
   */
  function createSource(options, tg) {
    //console.log(options);
      var source = new ol.source.TileArcGISRest({
        //attributions: options.attribution,
        //projection  : options.projection,
        crossOrigin : 'anonymous',
        params      : options.params,
        url         : options.url,
        tileGrid    : tg
      });
    return source;
  }
}
/**
 * Returns a JSON object with a dynamic layers list.
 * @param {Number} ids a list of ids.
 * @return {Object} an JSON object with dynamicLayers as string.
 */
function colligate(ids){
  return {
    "dynamicLayers": produce(ids),
    "DPI": 90
  };
};
/**
 * Returns a string representation of a list containing dynamic layers.
 * @param {Number} ids a list of ids.
 * @return {String} a list as string over ids.
 */
function produce(ids){
    var result = "";
    for(var drawn in ids){
      result += (drawn == (ids.length-1)) ? reorder(drawn, ids[drawn]) : reorder(drawn, ids[drawn])+',';
    }
  return "["+result+"]";
}
/**
 * Returns a string representation of a dynamic layer object.
 * @param {Number} drawn the new draw position. Index 0 is the top position.
 * @param {Number} inUse the id of the layer in the ArcGIS REST service.
 * @return {String} a dynamic layer object.
 */
function reorder(drawn, inUse){
  return JSON.stringify({"id":drawn, source: {"mapLayerId": inUse}});
}

module.exports = dynAgsTile;
