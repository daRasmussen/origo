"use strict";

window.proj4 = require('proj4');
global.jQuery = require("jquery");
var events = require('events');
var eventEmitter = new events.EventEmitter();

var $ = require('jquery');
var Viewer = require('./src/viewer');
var mapLoader = require('./src/maploader');
var controlInitialiser = require('./src/controlinitialiser');

var origo = {};
origo.map = {};
origo.config = require('./conf/origoConfig');
origo.controls = require('./conf/origoControls');

origo.map.init = function(options, opt_config) {

  var config = opt_config ? $.extend(origo.config, opt_config) : origo.config;
  // get state of object.
  //console.log(Object.keys(config));

  var map = mapLoader(options, config);

  if (map) {
    map.then(function(config) {
      init(config);
    })
    origo.map.viewer = Viewer;
    return Viewer;
  } else {
    return undefined;
  }
}

function init(config) {
  Viewer.init(config.el, config.options);

  //Init controls
  controlInitialiser(config.options.controls);
}

module.exports = origo;
