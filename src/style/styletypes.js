"use strict";

var pin = require('./pin');
var measure = require('./measure');
var stats = require('./stats');

module.exports = function() {
  var styleTypes = {};
  styleTypes.pin     = pin;
  styleTypes.measure = measure;
  styleTypes.stats   = stats;
  return {
    getStyle: function getStyle(type) {
      if(type) {
        return styleTypes[type];
      } else {
        console.log(type + ' is not a default style');
      }
    }
  }
}();
