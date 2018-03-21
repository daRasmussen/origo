"use strict";

var $             = require('jquery');
var viewer        = require('./viewer');
var mapUtils      = require('./maputils');
var group         = require('./layer/group');
var type          = {};
var layerCreator;
type.WFS          = require('./layer/wfs');
type.AGS_FEATURE  = require('./layer/agsfeature');
type.TOPOJSON     = require('./layer/topojson');
type.GEOJSON      = require('./layer/geojson');
type.WMS          = require('./layer/wms');
type.WMTS         = require('./layer/wmts');
type.AGS_TILE     = require('./layer/agstile');
type.DYN_AGS_TILE = require('./layer/dynagstile');
type.XYZ          = require('./layer/xyz');
type.OSM          = require('./layer/osm');
type.VECTORTILE   = require('./layer/vectortile');
type.FEATURE      = require('./layer/featurelayer');
type.GROUP        = groupLayer;

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
    agsTileEvents(layer);
    return layer;
  } else {
    console.log('Layer type is missing or layer type is not correct. Check your layer definition: ');
  }
}
/**
 * tmp layers stores tmp settings for drawn layers.
 * @type {Array}
 */
var tmp = [];
/**
 * Handler that andles speicif type in this case generic ArcGIS Tiles.
 * @param {[Object]} layer Generic layer
 * @return {[Array]} Selected ids and draworder in cloaked layers of optimal performance.
 */
function agsTileEvents(layer){
  if(layer.get('type') === 'DYN_AGS_TILE') {
    layer.on('change:visible', function(){
      if(this.get('visible')){
        addCollected(layer);
        kickOff(viewer);
        layer.setSource(null);
        tmp.push(layer);
      } else if(!this.get('visible')) {
        removeCollected(layer);
        kickOff(viewer);
        tmp = restore(tmp, layer);
      }
    });
  }
};
/**
 * Restores the source to original source.
 * @param {[Array]} list  A list that contains a number of layers.
 * @param {[Object]} layer Target layer to restore.
 * @return {[Array]} A list of layers
 */
function restore(list, layer){
  list.forEach(function(l){
    if(layer.get('name') === l.get('name')){
      layer.setSource(l.getSource());
    }
  });
  return list;
}
/**
 * This method distributes and kicks off different cloaked layers.
 * This method is required for optimal perfomance. If you wnat to call
 * maximum of 20 layers i one GET request. Use kickoff to distribute
 * the number of layers and han handle maximum of 100 layers, hence 5
 * single requests.
 * @param {[Object]} viewer [description]
 * @return {[Objects]} Cloaked objects
 */
function kickOff(viewer){
  viewer.getLayers().forEach(function(layer){
    var stable = require('./ids').stable;
    var collected = require('./ids').collected;
    collected = structure(stable, collected);
    var indices = hand(stable, collected);
    var mpl = 20;
    switch(cardinal(collected.length, mpl)){
      case 1:
        toggle(viewer, layer, indices, collected, 'cloaked0', (mpl-mpl), mpl);
      break;
      case 2:
        toggle(viewer, layer, indices, collected, 'cloaked0', mpl, mpl*2);
        toggle(viewer, layer, indices, collected, 'cloaked1', (mpl-mpl), mpl);
      break;
      case 3:
        toggle(viewer, layer, indices, collected, 'cloaked0', mpl*2, mpl*3);
        toggle(viewer, layer, indices, collected, 'cloaked1', mpl, mpl*2);
        toggle(viewer, layer, indices, collected, 'cloaked2', (mpl-mpl), mpl);
      break;
      case 4:
        toggle(viewer, layer, indices, collected, 'cloaked0', mpl*3, mpl*4);
        toggle(viewer, layer, indices, collected, 'cloaked1', mpl*2, mpl*3);
        toggle(viewer, layer, indices, collected, 'cloaked2', mpl, mpl*2);
        toggle(viewer, layer, indices, collected, 'cloaked3', (mpl-mpl), mpl);
      break;
      case 5:
        toggle(viewer, layer, indices, collected, 'cloaked0', mpl*4, mpl*5);
        toggle(viewer, layer, indices, collected, 'cloaked1', mpl*3, mpl*4);
        toggle(viewer, layer, indices, collected, 'cloaked2', mpl*2, mpl*3);
        toggle(viewer, layer, indices, collected, 'cloaked3', mpl, mpl*2);
        toggle(viewer, layer, indices, collected, 'cloaked4', (mpl-mpl), mpl);
      break;
      default:
        if(
          layer.get('name') === 'cloaked0' ||
          layer.get('name') === 'cloaked1' ||
          layer.get('name') === 'cloaked2' ||
          layer.get('name') === 'cloaked3' ||
          layer.get('name') === 'cloaked4'
         ) {
          layer.getSource().updateParams(colligate(viewer, collected));
        }
      break;
    }
  });
};
/**
 * Toggels or on/off a layer source.
 * @param {[Object]} viewer    Current viewer
 * @param {[Object]} layer     Target layer
 * @param {[Array]} indices   List of maintained indexis for draworder.
 * @param {[Array]} collected List of ids of the selected layers.
 * @param {[String]} name      Name of target layers ex. cloaked0
 * @param {[Integer]} min       Lowest array length 0, 20, 40 etc..
 * @param {[Integer]} max       Maximum array length 20, 40, 60 etc...
 * @return {[Object]} viewer    updated viwer and its components for draworder.
 */
function toggle(viewer, layer, indices, collected, name, min, max){
  if(layer.get('name') === name){
    var source = layer.getSource();
    revise(viewer, indices, source, collected.slice(min, max));
  };
};
/**
 * Multiplication functions
 * @param {[Integer]} bulk  Value
 * @param {[Integer]} crest Value
 * @return {IInteger]} Result
 */
function roof(bulk, crest){
  return bulk * crest;
};
/**
 * Lower value
 * @param {[Integer]} bulk  Value
 * @param {[Integer]} crest Value
 * @return {[Integer]} Result
 */
function tin(bulk, crest){
  return roof(bulk, crest) - roof(bulk, crest);
}
/**
 * Calculates the cardinal value.
 * @param {[Integer]} bulk  Value
 * @param {[Integer]} crest Value
 * @return {[Integer]} Result
 */
function cardinal(bulk, crest){
  return Math.ceil(bulk / crest) >= 0 ? Math.ceil(bulk / crest) : 0;
};
/**
 * Draworder revision corrects the draw order of layers.
 * @param {[Object]} viewer    Current viewer in map.
 * @param {[Array]} indices   Array of index values.
 * @param {[Object]} source    Target source value.
 * @param {[Integer]} collected Target selected values
 * @return {[Object]} Updates viwer.
 */
function revise(viewer, indices, source, collected){
  if(indices[0] > 0){
    source.updateParams(colligate(viewer, collected));
  } else if(indices[0] !== undefined){
    source.updateParams(colligate(viewer, collected.reverse()));
  } else {
    source.updateParams(colligate(viewer, []));
  }
};
/**
 * Drawoder hands what order the collected ids should be arranged based on the stable static values.
 * @param {[Array]} stable    Integers values id values for static layers.
 * @param {[Array]} collected Integers values id values for selected layers.
 * @return {[Array]} [description]
 */
function hand(stable, collected){
  var indices = new Array(collected.length);
  for (var index in collected) indices[index] = index;
  return indices.sort(function (x, y) {
    return stable.indexOf(collected[x]) < stable.indexOf(collected[y]) ? -1 : stable.indexOf(collected[x]) > stable.indexOf(collected[y]) ? 1 : 0; });
};
/**
 * Returns a JSON object with a dynamic layers list.
 * @param {Number} ids a list of ids.
 * @return {Object} an JSON object with dynamicLayers as string.
 */
function colligate(viewer, ids) {
  var currentExtent = viewer.getMap().getView().calculateExtent(viewer.getMap().getSize());
  var result = {
    "dynamicLayers": produce(ids),
    "bbox": currentExtent.join(',')
  };
  return result;
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
};
/**
 * Returns a string representation of a dynamic layer object.
 * @param {Number} drawn the new draw position. Index 0 is the top position.
 * @param {Number} inUse the id of the layer in the ArcGIS REST service.
 * @return {String} a dynamic layer object.
 */
function reorder(drawn, inUse){
  return JSON.stringify({"id":drawn, source: {"mapLayerId": inUse}});
};
/**
 * Adds target layer to all lists.
 * @param {[Object]} layer Target Layer
 * @return {[Array]} List of collected layers
 */
function addCollected(layer){
  var stable = require('./ids').stable;
  var collected = require('./ids').collected;
  var id = layer.get('id');
  collected.push(id);
  collected = structure(stable, collected);
};
/**
 * Removes collected
 * @param {[Object]} layer Target layer
 * @return {[Array]} List of collected layers
 */
function removeCollected(layer){
  var stable = require('./ids').stable;
  var collected = require('./ids').collected;
  var id = layer.get('id');
  collected.splice(collected.indexOf(id), 1);
  collected = structure(stable, collected);
};
/**
 * Struture function that filters out unhandled undefined och null values.
 * @param {[Array]} stable    Static ids in array.
 * @param {[Array]} collected Selected ids in array.
 * @return {[Array]} [description]
 */
function structure(stable, collected){
  var tidy = [];
  for(var x in stable){
    for(var y in collected){
      if(stable[x] === collected[y]){
        tidy[x] = collected[y];
      }
    }
  }
  return tidy.filter(function(x){
    return (x !== (undefined || null || ''));
  });
};

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
