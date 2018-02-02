"use strict";

var $ = require('jquery');
var viewer = require('./viewer');
var mapUtils = require('./maputils');
var group = require('./layer/group');
var type = {};
var layerCreator;
type.WFS = require('./layer/wfs');
type.AGS_FEATURE = require('./layer/agsfeature');
type.TOPOJSON = require('./layer/topojson');
type.GEOJSON = require('./layer/geojson');
type.WMS = require('./layer/wms');
type.WMTS = require('./layer/wmts');
type.AGS_TILE = require('./layer/agstile');
type.XYZ = require('./layer/xyz');
type.OSM = require('./layer/osm');
type.VECTORTILE = require('./layer/vectortile');
type.FEATURE = require('./layer/featurelayer');
type.GROUP = groupLayer;

var visibleLayersIDS = require('./visibleLayersIDS');
var visibleTILELayersIDS = require('./visibleTILELayersIDS');
type.DYN_AGS_TILE = require('./layer/dynagstile');
var t = require('./layer/dynagstile');

layerCreator = function layerCreator(opt_options) {
  var defaultOptions = {
    name: undefined,
    id: undefined,
    title: undefined,
    group: 'none',
    opacity: 1,
    geometryName: 'geom',
    geometryType: undefined,
    filter: undefined,
    layerType: undefined,
    legend: false,
    sourceName: undefined,
    attribution: undefined,
    style: 'default',
    styleName: undefined,
    queryable: true,
    minResolution: undefined,
    maxResolution: undefined,
    visible: false,
    type: undefined,
    extent: undefined,
    attributes: undefined,
    tileSize: viewer.getTileSize()
  };
  var projection = viewer.getProjection();
  var options = opt_options || {};
  var layerOptions = $.extend(defaultOptions, options);
  var name = layerOptions.name;
  layerOptions.minResolution = layerOptions.hasOwnProperty('minScale') ? mapUtils.scaleToResolution(layerOptions.minScale, projection): undefined;
  layerOptions.maxResolution = layerOptions.hasOwnProperty('maxScale') ? mapUtils.scaleToResolution(layerOptions.maxScale, projection): undefined;
  layerOptions.extent = layerOptions.extent || viewer.getExtent();
  layerOptions.sourceName = layerOptions.source;
  layerOptions.styleName = layerOptions.style;
  if (layerOptions.id === undefined) {
    layerOptions.id = name.split('__').shift();
  }

  layerOptions.name = name.split(':').pop();

  if (type.hasOwnProperty(layerOptions.type)) {
    var layer = type[layerOptions.type](layerOptions, layerCreator);

    // This evnt listner listens for change of visiblity of each layer.
    layer.on('change:visible', function(){
      fillVisibleTILELayersIDS(layer);
      if(this.get('type') === 'AGS_TILE'){
         this.setOpacity(0);
         //console.log(this.get('id'));
      }
      //else if(this.get('type') === 'DYN_AGS_TILE'){
      //   var source = this.getSource();
      //   // MISSING ALL PARAMS
      //   source.updateParams({
      //     params: {'layers': 'show:'+visibleLayersIDS.ids.join()},
      //   });
      if(this.get('type') === 'DYN_AGS_TILE'){
        this.setOpacity(1);
        // var sourceOptions = {
        //   url: "https://kartor.vasteras.se/arcgis/rest/services/ext/tff_skotsel_dyn/MapServer/",
        //   projection: viewer.getProjection(),
        //   params: {
        //     layers: 'show: 122'
        //   }
        // };
        // var url = "https://kartor.vasteras.se/arcgis/rest/services/ext/tff_skotsel_dyn/MapServer/";
        // var projection = viewer.getProjection();
        // var params = {
        //   layers: 'show'+visibleLayersIDS.ids.join()
        // };
        console.log(viewer.getExtent());
        //console.log(this.get('id'));
        //this.set('id', '122');
        console.log(visibleTILELayersIDS.ids.join());
        var source = this.getSource();
        source.updateParams({layers: 'show: '+visibleTILELayersIDS.ids.join(), extent: viewer.getExtent()});
        //source.refresh();
        //console.log(this.get('id'));
      }
    });
    return layer;
  } else {
    console.log('Layer type is missing or layer type is not correct. Check your layer definition: ');
    console.log(layerOptions);
  }
}
/**
  * This method fills the global parameter visibleTILELayersIDS.
  * This includes ids for all layers types of AGS_TILE.
  */
function fillVisibleTILELayersIDS(layer){
  if(layer.get('type') === 'AGS_TILE'){
    var id = layer.get('id');
    var index = visibleTILELayersIDS.ids.indexOf(id);
    if(index === -1){
      visibleTILELayersIDS.ids.splice(visibleTILELayersIDS.length, 0, id);
    } else {
      visibleTILELayersIDS.ids = removeItem(visibleTILELayersIDS.ids, id);
    }
  }
}
/**
  * This method fills the global parameter visibleLayersIDS.
  * This includes ids for all types of layers.
  */
function fillVisibleLayersIDS(layer){
  var id = layer.get('id');
  var index = visibleLayersIDS.ids.indexOf(id);
  if(index === -1){
    visibleLayersIDS.ids.splice(visibleLayersIDS.length, 0, id);
  } else {
    visibleLayersIDS.ids = removeItem(visibleLayersIDS.ids, id);
  }
}
/**
 * This method takes a list and parameter remove.
 * And returns a list without the parameter remove.
 */
function removeItem(list, remove){
  var tmp = [];
  for(var item in list){
    if(list[item] !== remove){
      tmp.push(list[item]);
    }
  }
  return tmp;
}

function groupLayer(options) {
  var layers;
  var layerOptions;
  if (options.hasOwnProperty('layers')) {
    layers = options.layers.map(function(layer) {
      return layerCreator(layer);
    });

    layerOptions = {};
    layerOptions.layers = layers;
    return group($.extend(options, layerOptions));
  } else {
    console.log('Group layer has no layers');
  }
}

module.exports = layerCreator;
