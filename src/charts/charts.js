'use strict';

var Chart = require('chart.js');
module.exports = {
  initChar: function (name, type) {
    return new Chart(document.getElementById(name), {
      type: type
    });
  }
};
