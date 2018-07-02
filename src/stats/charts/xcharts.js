'use strict';

var Chart = require('chart.js');
require('chartjs-plugin-datalabels');

module.exports = {
  init: function (target, type, options, data) {
    return new Chart(document.getElementById(target), {
      type: type,
      options: options,
      data: data
    });
  }
};
