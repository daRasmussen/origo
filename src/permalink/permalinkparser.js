"use strict";
var urlparser = require('../utils/urlparser');

var layerModel = {
    v: {
      name: "visible",
      dataType: "boolean"
    },
    s: {
      name: "legend",
      dataType: "boolean"
    },
}

module.exports = {
  layers: function(layersStr) {
      var layers = layersStr.split(',');
      var layerObjects = {};
      layers.forEach(function(layer) {
          var obj = {};
          var layerObject = urlparser.objectify(layer,{topmost: "name"});
          Object.getOwnPropertyNames(layerObject).forEach(function(prop) {
              var val = layerObject[prop];
              if(layerModel.hasOwnProperty(prop)) {
                  var attribute = layerModel[prop];
                  obj[attribute.name] = urlparser.strBoolean(val);
              }
              else {
                  obj[prop] = val;
              }
          });
          layerObjects[obj.name] = obj;

      });
      return layerObjects;
  },
  zoom: function(zoomStr) {
      return parseInt(zoomStr);
  },
  center: function(centerStr) {
      var center = centerStr.split(",").map(function(coord) {
          return parseInt(coord);
      });
      return center;
  },
  selection: function(selectionStr) {
      return urlparser.strArrayify(selectionStr, {
        topmostName: "geometryType",
        arrName: "coordinates"}
      );
  },
  /**
   * [description] returns a list of keys
   * @param {[String]} s [description] is a string keys=key0/key1
   * @return {[Array]} [description] [key0, key1]
   */
  keys: function(s) {
    return s.split('/');
  },
  /**
   * TODO:: this shoudbe renamed to nameANDid=
   * [description] returns a select list.
   * @param {[String]} s [description] is a select=layerName0/objectID0,layerName1/iobjectID1
   * @return {[Array]} [description] [{0: {0: layerName0, 1: objectID0 }, 1: {0: layerName1 ,1: objectID1 }}]
   */
  select: function(s) {
    var a = [];
    var items = s.split(',');
    items.forEach(function(i){
      var r = i.split('/');
      var o = {};
      r.forEach(function(l, n){
        o[n] = l;
      })
      a.push(o);
    });
    return a;
  },
  feature: function(featureId) {
    return featureId;
  },
  pin: function(pinStr) {
      return urlparser.strIntify(pinStr);
  },
  map: function(mapStr) {
      return mapStr;
  }
}
