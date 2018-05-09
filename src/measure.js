'use strict';

var Viewer = require('./viewer');
var utils = require('./utils');
var style = require('./style')();
var styleTypes = require('./style/styletypes');
var round2 = require('./utils/round2');
var ol = require('openlayers');
var $ = require('jquery');
var convert = require('convert-units');
var overlayArray = [];
var map;
var options;
var activeButton;
var defaultButton;
var type;
var sketch;
var measure;
var measureTooltip;
var measureTooltipElement;
var measureStyleOptions;
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
var outputString = { 'settings': { 'precision': { 'length': 0, 'area': 0 }, 'unit': { 'length': 'm', 'area': 'm2' }, 'units': { 'length': [], 'area': [] } } };

function outputLength(length, precision, units) {
  var converted = [];
  var out = 0.00 + ' m';
  units.forEach(function (i) {
    converted.push(round2(convert(length).from('m').to(i), precision) + ' ' + i);
  });
  converted.forEach(function (c) {
    if (c.split(' ')[0] >= 0.99 && c.split(' ')[0] <= 999.99 ) {
      out = c;
    }
  });
  return out;
}

function formatLength(line) {
  var projection = map.getView().getProjection();
  var length = ol.Sphere.getLength(line, { projection: projection });
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
  units.forEach(function (i) {
    var d = i.match(/\d+/g) === null ? '' : i.match(/\d+/g)[0];
    var u = i.match(/[a-zA-Z]+/g) === null ? 'm' : i.match(/[a-zA-Z]+/g)[0];
    converted.push(round2(convert(area).from('m2').to(i), precision) + ' ' + convertToSup(u, d));
  });
  converted.forEach(function (c) {
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
  var area = ol.Sphere.getArea(polygon, { procjetion: projection });
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

    measureTooltipElement.innerHTML = output;
    label = output;
    measureTooltip.setPosition(tooltipCoord);
  }

  if (evt.type === 'pointermove') {
    helpTooltipElement.innerHTML = helpMsg;
    helpTooltip.setPosition(evt.coordinate);
  }
}

function onEnableInteraction(e) {
  if (e.interaction === 'measure') {
    $('#o-measure-button button').addClass('o-measure-button-true');
    if (lengthTool.isEnabled) { $('#o-measure-line-button').removeClass('o-hidden'); }
    if (areaTool.isEnabled) { $('#o-measure-polygon-button').removeClass('o-hidden'); }
    $('#o-measure-button').removeClass('tooltip');
    // setActive(true);
    isActive = true;
    defaultButton.trigger('click');
  } else {
    if (activeButton) {
      activeButton.removeClass('o-measure-button-true');
    }

    $('#o-measure-button button').removeClass('o-measure-button-true');
    if (lengthTool.isEnabled) { $('#o-measure-line-button').addClass('o-hidden'); }
    if (areaTool.isEnabled) { $('#o-measure-polygon-button').addClass('o-hidden'); }
    $('#o-measure-button').addClass('tooltip');

    map.un('pointermove', pointerMoveHandler);
    map.un('click', pointerMoveHandler);
    map.removeInteraction(measure);
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
      id: 'o-measure-toolbar',
      cls: 'o-toolbar-horizontal'
    });
    $(target).append(toolbar);

    var mb = utils.createButton({
      id: 'o-measure-button',
      cls: 'o-measure-button',
      iconCls: 'o-icon-steady-measure',
      src: '#steady-measure',
      tooltipText: 'Mät i kartan'
    });
    $('#' + 'o-measure-toolbar').append(mb);
  }

  if (lengthTool.isEnabled) {
    var lb = utils.createButton({
      id: 'o-measure-line-button',
      cls: 'o-measure-type-button',
      iconCls: 'o-icon-minicons-line-vector',
      src: '#minicons-line-vector',
      tooltipText: 'Linje',
      tooltipPlacement: 'north'
    });
    $('#' + 'o-measure-toolbar').append(lb);
    $('#o-measure-line-button').addClass('o-hidden');
  }

  if (areaTool.isEnabled) {
    var pb = utils.createButton({
      id: 'o-measure-polygon-button',
      cls: 'o-measure-type-button',
      iconCls: 'o-icon-minicons-square-vector',
      src: '#minicons-square-vector',
      tooltipText: 'Yta',
      tooltipPlacement: 'north'
    });
    $('#' + 'o-measure-toolbar').append(pb);
    $('#o-measure-polygon-button').addClass('o-hidden');
  }
}

function clickMeasureButton(e) {
  toggleMeasure();
  $('#o-measure-button button').blur();
  e.preventDefault();
}
function clickLineButton(e) {
  type = 'LineString';
  toggleType($('#o-measure-line-button button'));
  $('#o-measure-line-button button').blur();
  e.preventDefault();
}
function clickAreaButton(e) {
  type = 'Polygon';
  toggleType($('#o-measure-polygon-button button'));
  $('#o-measure-polygon-button button').blur();
  e.preventDefault();
}
function bindUIActions() {
  if (lengthTool.isEnabled || areaTool.isEnabled) {
    $('#o-measure-button').on('click', clickMeasureButton);
  }

  if (lengthTool.isEnabled) {
    $('#o-measure-line-button').on('click', clickLineButton);
  }

  if (areaTool.isEnabled) {
    $('#o-measure-polygon-button').on('click', clickAreaButton);
  }
}

function createStyle(feature) {
  var featureType = feature.getGeometry().getType();
  var measureStyle = featureType === 'LineString' ? style.createStyleRule(measureStyleOptions.linestring) : style.createStyleRule(measureStyleOptions.polygon);
  return measureStyle;
}

function setSketch(e) {
  sketch = e.feature;
  $(helpTooltipElement).addClass('o-hidden');
}
function unToolTip() {
  // unset tooltip so that a new one can be created
  $(measureTooltipElement).remove();
  measureTooltipElement = null;
  createMeasureTooltip();
  $(helpTooltipElement).removeClass('o-hidden');
}
function unSketch(e) {
  var feature = e.feature;
  feature.setStyle(createStyle(feature));
  feature.getStyle()[0].getText().setText(label);
  sketch = null;
  unToolTip();
}
function addInteraction() {
  drawnFeatures.setVisible(true);

  measure = new ol.interaction.Draw({
    source: source,
    type: type,
    style: style.createStyleRule(measureStyleOptions.interaction)
  });

  map.addInteraction(measure);

  createMeasureTooltip();
  createHelpTooltip();

  map.on('pointermove', pointerMoveHandler);
  map.on('click', pointerMoveHandler);

  measure.on('drawstart', setSketch, this);
  measure.on('drawend', unSketch, this);
}

function createHelpTooltip() {
  if (helpTooltipElement) {
    helpTooltipElement.parentNode.removeChild(helpTooltipElement);
  }

  helpTooltipElement = document.createElement('div');
  helpTooltipElement.className = 'o-tooltip o-tooltip-measure';

  helpTooltip = new ol.Overlay({
    element: helpTooltipElement,
    offset: [15, 0],
    positioning: 'center-left'
  });

  overlayArray.push(helpTooltip);
  map.addOverlay(helpTooltip);
}

function createMeasureTooltip() {
  if (measureTooltipElement) {
    measureTooltipElement.parentNode.removeChild(measureTooltipElement);
  }

  measureTooltipElement = document.createElement('div');
  measureTooltipElement.className = 'o-tooltip o-tooltip-measure';

  measureTooltip = new ol.Overlay({
    element: measureTooltipElement,
    offset: [0, -15],
    positioning: 'bottom-center',
    stopEvent: false
  });

  overlayArray.push(measureTooltip);
  map.addOverlay(measureTooltip);
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
      interaction: 'measure'
    });
  }
}

function toggleType(button) {
  if (activeButton) {
    activeButton.removeClass('o-measure-button-true');
  }

  button.addClass('o-measure-button-true');
  activeButton = button;
  map.removeInteraction(measure);
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
  options.inspect.show.warn = setVar(options.inspect.show, 'warn', true, true);
  outputString.settings.precision.length = setVar(options.precision, 'length', 2, options.inspect.show.warn);
  outputString.settings.precision.area = setVar(options.precision, 'area', 2, options.inspect.show.warn);
  outputString.settings.unit.length = setVar(options.units, 'length', 'm', options.inspect.show.warn);
  outputString.settings.unit.area = setVar(options.units, 'area', 'm2', options.inspect.show.warn);
  outputString.settings.units.length = setVar(options.units, 'length', [], options.inspect.show.warn);
  outputString.settings.units.area = setVar(options.units, 'area', [], options.inspect.show.warn);
  defaultTool = setVar(options, 'default', 'length', options.inspect.show.warn);
  measureTools = setVar(options, 'measureTools', ['length', 'area'], options.inspect.show.warn);
  lengthTool.isEnabled = measureTools.indexOf('length') >= 0;
  areaTool.isEnabled = measureTools.indexOf('area') >= 0;

  if (lengthTool.isEnabled || areaTool.isEnabled) {
    var target = setVar(options, 'target', '#o-toolbar-maptools', options.inspect.show.warn);
    map = Viewer.getMap();
    source = new ol.source.Vector();
    measureStyleOptions = styleTypes.getStyle('measure');

    // Drawn features
    drawnFeatures = new ol.layer.Vector({
      source: source,
      name: 'measure',
      visible: false,
      zIndex: 6
    });

    map.addLayer(drawnFeatures);

    $('.o-map').on('enableInteraction', onEnableInteraction);

    render(target);
    bindUIActions();
    defaultButton = defaultTool === 'area' ? $('#o-measure-polygon-button button') : $('#o-measure-line-button button');
  }
}

module.exports.init = init;
