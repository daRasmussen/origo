'use strict';

var Viewer = require('./viewer');
var utils = require('./utils');
var style = require('./style')();
var styleTypes = require('./style/styletypes');
var round2 = require('./utils/round2');
var ol = require('openlayers');
var $ = require('jquery');
var convert = require('convert-units');
var d3 = require('d3');
var d3Dsv = require('d3-dsv');
var d3Scale = require('d3-scale');
var d3Shape = require('d3-shape');
var d3Axis = require('d3-axis');
var c3 = require('c3');
var overlayArray = [];
var map;
var options;
var activeButton;
var defaultButton;
var type;
var sketch;
var stats;
var statsTooltip;
var statsTooltipElement;
var statsStyleOptions;
var helpTooltip;
var helpTooltipElement;
var drawnFeatures;
var source;
var label;
var isActive = false;
var measureTools;
var defaultTool;
var lengthTool = { 'isEnabled': false };
var areaTool = { 'isEnabled': false };
var outputString = { 'settings': { 'precision': { 'length': 2, 'area': 2 }, 'unit': { 'length': 'm', 'area': 'm2' }, 'units': { 'length': ['km', 'm', 'cm'], 'area': ['km2', 'ha', 'm2', 'cm2', 'mm2'] } } };
var singleSelect;
var visibleLayers = [];
var data = [];
var dataJSON = [];
var sum = 0;

function outputLength(length, precision, units) {
  var converted = [];
  var out = 0.00 + ' m';
  units.forEach((i) => {
    converted.push(round2(convert(length).from('m').to(i), precision) + ' ' + i);
  });
  converted.forEach((c) => {
    if (c.split(' ')[0] >= 0.99 && c.split(' ')[0] <= 999.99 ) {
      out = c;
    }
  });
  return out;
}

function formatLength(line) {
  var projection = map.getView().getProjection();
  var length = ol.Sphere.getLength(line, { projection });
  var precision = outputString.settings.precision.length;
  var units = outputString.settings.units.length;
  var unit = outputString.settings.unit.length;
  var output = units[0] === null ? round2(convert(length).from('m').to(unit), precision) + ' ' + unit : outputLength(length, precision, units);
  var htmlElem = document.createElement('span');
  htmlElem.innerHTML = output;
  return htmlElem.textContent;
}

function addSup(unit, sup) {
  return unit + '<sup>' + sup + '</sup>';
}
function convertToSup(unit, sup) {
  return sup === '' ? unit : addSup(unit.split(sup)[0], sup);
}

function outputArea(area, precision, units) {
  var converted = [];
  var out = 0.00 + addSup('m', 2);
  units.forEach((i) => {
    var d = i.match(/\d+/g) === null ? '' : i.match(/\d+/g)[0];
    var u = i.match(/[a-zA-Z]+/g) === null ? 'm' : i.match(/[a-zA-Z]+/g)[0];
    converted.push(round2(convert(area).from('m2').to(i), precision) + ' ' + convertToSup(u, d));
  });
  converted.forEach((c) => {
    if (c.split(' ')[0] >= 0.99 && c.split(' ')[0] <= 9999.99 ) {
      out = c;
    }
  });
  return out;
}
function deSup(element) {
  if (element.tagName === 'SUP') {
    element.textContent = String.fromCharCode(element.textContent.charCodeAt(0) + 128);
  }
}
function formatArea(polygon) {
  var projection = map.getView().getProjection();
  var area = ol.Sphere.getArea(polygon, { projection });
  var precision = outputString.settings.precision.area;
  var units = outputString.settings.units.area;
  var unit = outputString.settings.unit.area;
  var output = units[0] === null ? round2(convert(area).from('m2').to(unit), precision) + ' ' + addSup(unit, '2') : outputArea(area, precision, units);
  var htmlElem = document.createElement('span');
  htmlElem.innerHTML = output;
  [].forEach.call(htmlElem.children, deSup);
  return htmlElem.textContent;
}

// Display and move tooltips with pointer
function pointerMoveHandler(evt) {
  if (evt.dragging) { return; }

  var helpMsg = 'Klicka för att börja mäta';
  var tooltipCoord = evt.coordinate;

  if (sketch) {
    var output;
    var geom = (sketch.getGeometry());

    if (geom instanceof ol.geom.Polygon) {
      output = formatArea(/** @type {ol.geom.Polygon} */ (geom));
      tooltipCoord = geom.getInteriorPoint().getCoordinates();
    } else if (geom instanceof ol.geom.LineString) {
      output = formatLength(/** @type {ol.geom.LineString} */ (geom));
      tooltipCoord = geom.getLastCoordinate();
    }

    statsTooltipElement.innerHTML = output;
    label = output;
    statsTooltip.setPosition(tooltipCoord);
  }

  if (evt.type === 'pointermove') {
    helpTooltipElement.innerHTML = helpMsg;
    helpTooltip.setPosition(evt.coordinate);
  }
}

function onEnableInteraction(e) {
  if (e.interaction === 'stats') {
    $('#o-stats-button button').addClass('o-stats-button-true');
    if (lengthTool.isEnabled) { $('#o-stats-hand-button').removeClass('o-hidden'); }
    if (areaTool.isEnabled) { $('#o-stats-polygon-button').removeClass('o-hidden'); }
    $('#o-stats-button').removeClass('tooltip');
    // setActive(true);
    isActive = true;
    defaultButton.trigger('click');
  } else {
    if (activeButton) {
      activeButton.removeClass('o-stats-button-true');
    }

    $('#o-stats-button button').removeClass('o-stats-button-true');
    if (lengthTool.isEnabled) { $('#o-stats-hand-button').addClass('o-hidden'); }
    if (areaTool.isEnabled) { $('#o-stats-polygon-button').addClass('o-hidden'); }
    $('#o-stats-button').addClass('tooltip');

    map.un('pointermove', pointerMoveHandler);
    map.un('click', pointerMoveHandler);
    map.removeInteraction(stats);
    drawnFeatures.setVisible(false);
    Viewer.removeOverlays(overlayArray);
    drawnFeatures.getSource().clear();
    // setActive(false);
    isActive = false;
  }
}

// function setActive(state) {
//   isActive = state ? true : false;
// }

function render(target) {
  if (lengthTool.isEnalbed || areaTool.isEnabled) {
    var toolbar = utils.createElement('div', '', {
      id: 'o-stats-toolbar',
      cls: 'o-toolbar-horizontal'
    });
    $(target).append(toolbar);

    var mb = utils.createButton({
      id: 'o-stats-button',
      cls: 'o-stats-button',
      iconCls: 'o-icon-steady-stats',
      src: '#steady-stats',
      tooltipText: 'Mät i kartan'
    });
    $('#' + 'o-stats-toolbar').append(mb);
  }

  if (lengthTool.isEnabled) {
    var lb = utils.createButton({
      id: 'o-stats-hand-button',
      cls: 'o-stats-type-button',
      iconCls: 'o-icon-minicons-hand-vector',
      src: '#minicons-hand-vector',
      tooltipText: 'Enkel',
      tooltipPlacement: 'north'
    });
    $('#' + 'o-stats-toolbar').append(lb);
    $('#o-stats-hand-button').addClass('o-hidden');
  }

  if (areaTool.isEnabled) {
    var pb = utils.createButton({
      id: 'o-stats-polygon-button',
      cls: 'o-stats-type-button',
      iconCls: 'o-icon-minicons-square-vector',
      src: '#minicons-square-vector',
      tooltipText: 'Box',
      tooltipPlacement: 'north'
    });
    $('#' + 'o-stats-toolbar').append(pb);
    $('#o-stats-polygon-button').addClass('o-hidden');
  }
}

function clickMeasureButton(e) {
  toggleMeasure();
  $('#o-stats-button button').blur();
  e.preventDefault();
}
function clickLineButton(e) {
  type = 'LineString';
  toggleType($('#o-stats-hand-button button'));
  $('#o-stats-hand-button button').blur();
  e.preventDefault();
}
function clickAreaButton(e) {
  type = 'Polygon';
  toggleType($('#o-stats-polygon-button button'));
  $('#o-stats-polygon-button button').blur();
  e.preventDefault();
}
function bindUIActions() {
  if (lengthTool.isEnabled || areaTool.isEnabled) {
    $('#o-stats-button').on('click', clickMeasureButton);
  }

  if (lengthTool.isEnabled) {
    $('#o-stats-hand-button').on('click', clickLineButton);
  }

  if (areaTool.isEnabled) {
    $('#o-stats-polygon-button').on('click', clickAreaButton);
  }
}

function createStyle(feature) {
  var featureType = feature.getGeometry().getType();
  var measureStyle = featureType === 'LineString' ? style.createStyleRule(statsStyleOptions.linestring) : style.createStyleRule(statsStyleOptions.polygon);
  return measureStyle;
}

function setSketch(e) {
  sketch = e.feature;
  $(helpTooltipElement).addClass('o-hidden');
}
function unToolTip() {
  // unset tooltip so that a new one can be created
  $(statsTooltipElement).remove();
  statsTooltipElement = null;
  createMeasureTooltip();
  $(helpTooltipElement).removeClass('o-hidden');
}
function unSketch(e) {
  var feature = e.feature;
  var map = Viewer.getMap();
  feature.setStyle(createStyle(feature));
  feature.getStyle()[0].getText().setText(label);
  sketch = null;
  unToolTip();
}

function createPieChartLegend() {
  var chart = c3.generate({
    bindto: '#circleChart',
    data: {
        columns: [
          ['k0_9'].concat(data[0]),
          ['k10_19'].concat(data[1] - 2),
          ['k20_29'].concat(data[2]),
          ['m0_9'].concat(data[3] + 1),
          ['m10_19'].concat(data[4]),
          ['m20_29'].concat(data[5] + 1),
        ],
        type : 'donut',
        onclick: function (d, i) { console.log("onclick", d, i); },
        onmouseover: function (d, i) { console.log("onmouseover", d, i); },
        onmouseout: function (d, i) { console.log("onmouseout", d, i); }
    },
    donut: {
        title: "Procentfördelning"
    }
});
}
function barChart() {
  var chart = c3.generate({
    bindto: '#barChart',
    data: {
        columns: [
          ['k0_9'].concat(data[0]),
          ['k10_19'].concat(data[1] - 2),
          ['k20_29'].concat(data[2]),
          ['m0_9'].concat(data[3] + 1),
          ['m10_19'].concat(data[4]),
          ['m20_29'].concat(data[5] + 1),

        ],
        type: 'bar'
    },
    bar: {
        width: {
            ratio: 0.5 // this makes bar width 50% of length between ticks
        }
        // or
        //width: 100 // this makes bar width 100px
    }
});
}
function kartesisktChart() {
  var first = data.slice(0,3);
  var last = data.slice(-3);
  last.forEach(function(part, index, theArray) {
    theArray[index] = part - 1;
  });
  var chart = c3.generate({
    bindto: '#kartesisktChart',
    data: {
      columns: [
        ['Kvinnors ålder'].concat(first),
        ['Mäns ålder'].concat(last)
      ],
      onclick: function(d, element) {
        chart.internal.config.tooltip_show = true;
        chart.internal.showTooltip([d], element);
        chart.internal.config.tooltip_show = false;
      }
    },
    tooltip: {
        show: true
    }
  });
}
function createLinearLegend() {
  var formatPercent = d3.format('.0%');
  var formatNumber = d3.format('.0f');

  var threshold = d3.scaleThreshold()
    .domain([10, 20, 30, 40])
    .range(['#6e7c5a', '#a0b28f', '#d8b8b3', '#b45554', '#760000']);

  var x = d3.scaleLinear()
    .domain([0, 50])
    .range([0, 240]);

  var xAxis = d3Axis.axisBottom(x)
    .tickSize(13)
    .tickValues(threshold.domain())
    .tickFormat(5, "+%");

  var g = d3.select('.d3LinearLegend g').call(xAxis);

  g.select('.domain')
    .remove();

  g.selectAll('rect')
    .data(threshold.range().map(function(color) {
      var d = threshold.invertExtent(color);
      if (d[0] == null) d[0] = x.domain()[0];
      if (d[1] == null) d[1] = x.domain()[1];
      return d;
    }))
    .enter().insert('rect', '.tick')
    .attr('height', 8)
    .attr('x', function(d) { return x(d[0]); })
    .attr('width', function(d) { return x(d[1]) - x(d[0]); })
    .attr('fill', function(d) { return threshold(d[0]); });

  d3.selectAll('text').remove();
  g.append('text')
    .attr('fill', '#000')
    .attr('font-weight', 'bold')
    .attr('text-anchor', 'start')
    .attr('font-size', '40px')
    .attr('y', -6)
    .data([{'sum': sum}])
    .text(function(d) { return 'Summan: ' +d.sum; });
}
function getSum(a) {
  return a.reduce(function(accumulator, currentValue, currentIndex, array) {
    return accumulator + currentValue;
  });
}
function addInteraction() {
  drawnFeatures.setVisible(true);

  stats = new ol.interaction.Draw({
    source: source,
    type: type,
    style: style.createStyleRule(statsStyleOptions.interaction)
  });

  singleSelect = new ol.interaction.Select({
    toggleCondition: ol.events.condition.never
  });
  map.addInteraction(singleSelect);
  // map.addInteraction(stats);
  var layers = map.getLayers();
  // visibleLayers
  function getRelevantLayers(l) {
    if (l.get('visible') && l.get('name') !== 'topowebbkartan_nedtonad' && l.get('name') !== 'stats') {
      visibleLayers.push(l.get('name'));
    }
  }
  var selectedFeatures = singleSelect.getFeatures();
  selectedFeatures.on(['add', 'remove'], function() {
    data = [];
    visibleLayers = [];
    layers.forEach(getRelevantLayers);
    visibleLayers.forEach( function(l) {
      var tmp = selectedFeatures.getArray().map( function(feature) {
        return feature.get(l);
      });
      var oi = isNaN(parseInt(tmp[0], 10)) ? 0 : parseInt(tmp[0], 10);
      data.push(oi);
      dataJSON.push({'field': l,  'value': oi});
      // console.log(dataJSON);
    });
    sum = getSum(data);
    createLinearLegend();
    createPieChartLegend();
    kartesisktChart();
    barChart();
  });


  createMeasureTooltip();
  createHelpTooltip();

  map.on('pointermove', pointerMoveHandler);
  map.on('click', pointerMoveHandler);

  stats.on('drawstart', setSketch, this);
  stats.on('drawend', unSketch, this);
}

function createHelpTooltip() {
  if (helpTooltipElement) {
    helpTooltipElement.parentNode.removeChild(helpTooltipElement);
  }

  helpTooltipElement = document.createElement('div');
  helpTooltipElement.className = 'o-tooltip o-tooltip-stats';

  helpTooltip = new ol.Overlay({
    element: helpTooltipElement,
    offset: [15, 0],
    positioning: 'center-left'
  });

  overlayArray.push(helpTooltip);
  map.addOverlay(helpTooltip);
}

function createMeasureTooltip() {
  if (statsTooltipElement) {
    statsTooltipElement.parentNode.removeChild(statsTooltipElement);
  }

  statsTooltipElement = document.createElement('div');
  statsTooltipElement.className = 'o-tooltip o-tooltip-stats';

  statsTooltip = new ol.Overlay({
    element: statsTooltipElement,
    offset: [0, -15],
    positioning: 'bottom-center',
    stopEvent: false
  });

  overlayArray.push(statsTooltip);
  map.addOverlay(statsTooltip);
}

function toggleMeasure() {
  if (isActive) {
    $('.o-map').trigger({
      type: 'enableInteraction',
      interaction: 'featureInfo'
    });
  } else {
    $('.o-map').trigger({
      type: 'enableInteraction',
      interaction: 'stats'
    });
  }
}

function toggleType(button) {
  if (activeButton) {
    activeButton.removeClass('o-stats-button-true');
  }

  button.addClass('o-stats-button-true');
  activeButton = button;
  map.removeInteraction(stats);
  addInteraction();
}

function objectToString(v) {
  if (v instanceof Object) {
    return '[' + v + ']';
  }
  return v;
}

function hasNameWarning(o, p, v) {
  return o.hasOwnProperty('name') ? console.warn('The ' + o.name + ' property ' + p + ' is unset. A default value has been set to ' + objectToString(v) + '.') : console.warn('The property ' + p + ' is unset. A default value has been set to ' + objectToString(v) + '.');
}

function setVar(obj, prop, val, warn) {
  if (!obj.hasOwnProperty(prop)) {
    if (warn) {
      hasNameWarning(obj, prop, val);
    }
    return val;
  }
  return obj[prop];
}

function init(optOptions) {
  options = optOptions || {};
  options.debug.show.warn = setVar(options.debug.show, 'warn', true, true);
  measureTools = setVar(options, 'measureTools', ['area', 'length'], options.debug.show.warn);
  lengthTool.isEnabled = measureTools.indexOf('length') >= 0;
  areaTool.isEnabled = measureTools.indexOf('area') >= 0;

  if (lengthTool.isEnabled || areaTool.isEnabled) {
    var target = setVar(options, 'target', '#o-toolbar-maptools', options.debug.show.warn);
    map = Viewer.getMap();
    source = new ol.source.Vector();
    statsStyleOptions = styleTypes.getStyle('stats');

    // Drawn features
    drawnFeatures = new ol.layer.Vector({
      source: source,
      name: 'stats',
      visible: false,
      zIndex: 6
    });

    map.addLayer(drawnFeatures);

    $('.o-map').on('enableInteraction', onEnableInteraction);

    render(target);
    bindUIActions();
    defaultButton = defaultTool === 'area' ? $('#o-stats-polygon-button button') : $('#o-stats-hand-button button');
  }
}

module.exports.init = init;
