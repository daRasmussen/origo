"use strict";
var qs = require('query-string');
var getWindow = function(){
  return window;
};
var getLocation = function(){
  return this.getWindow().location;
}
var getSearch = function() {
  return this.getLocation().search;
}
module.exports.getWindow = getWindow;
module.exports.getLocation = getLocation;
module.exports.getSearch = getSearch;
