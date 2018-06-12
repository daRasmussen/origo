"use strict";

// Converts from degrees to radians.
var toRadians = function toRadians(degrees) {
  return degrees * Math.PI / 180;
};

// Converts from radians to degrees.
var toDegrees = function toDegrees(radians) {
  return radians * 180 / Math.PI;
};

module.exports.toRadians = toRadians;
module.exports.toDegrees = toDegrees;
