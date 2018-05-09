'use strict';

// TODO :: Imported modules variables should start with a bit letter
// TODO :: Big letter as CONSTRUCTOR
// Last import i the inspector.

var Viewer = require('./viewer');
var Utils = require('./utils');
var style = require('./style')();
var styleTypes = require('./style/styletypes');
var round2 = require('./utils/round2');
var inspect = require('./inspect');

var ol = require('openlayers');
var $ = require('jquery');

// TODO :: Statistics remove unnecessary modules.
var d3 = require('d3');
var d3Axis = require('d3-axis');

var c3 = require('c3');
var Chart = require('chart.js');

var overlayArray = [];
// var map;
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

// var drawnFeatures;
// var source;
var label;

var isActive = false;
var measureTools;
var defaultTool;
var lengthTool = { 'isEnabled': false };
var areaTool = { 'isEnabled': false };

var settings = {
  'tool': {
    'toolName': 'stats',
    'active': true
  },
  'interactions': {
    'default': 'featureInfo',
    'tool': 'statsInfo' // was stats
  },
  'buttons': {
    'default': '',
    'active': ''
  },
  'target': {
    'id': {
      'mapTools': '#o-toolbar-maptools',
      'buttons': {
        'stats': '#o-stats-button',
        'hand': '#o-stats-hand-button',
        'square': '#o-stats-square-button'
      }
    },
    'class': {
      'map': '.o-map',
      'true': {
        'stats': '.o-stats-button-true'
      }
    }
  },
  'map': null
};

var select = {
  'layers': [],
  'type': {
    'single': {
      'interaction': null,
      'helpMsg': 'Klicka för att börja mäta, Håll inne Shift för att mäta flera.'
    },
    'box': {
      'interaction': null,
      'helpMsg': 'Håll inne Ctrl och sedan klicka för att börja mäta'
    },
    'selected': null
  },
  'tools': {
    'names': [],
    'list': [
      {
        'name': 'single',
        'enabled': null,
        'icon': 'hand',
        'toolTip': 'Singel',
        'tipPlace': 'north'
      },
      {
        'name': 'box',
        'enabled': null,
        'icon': 'square',
        'toolTip': 'Box',
        'tipPlace': 'north'
      }
    ]
  }
};
// var toolName;

// var select;
// var single = { 'name': 'single', 'enabled': false };
// var box = { 'name': 'box', 'enabled': false };

var charts;
var line = { 'enabled': false };
var bar = { 'enabled': false };
var radar = { 'enabled': false };
var pie = { 'enabled': false };
var polar = { 'enabled': false };
var bubble = { 'enabled': false };

var singleSelect;
var boxSelect;
var selected;
var tmpSelect;
// var tmpLayers = [];

var visibleLayers = []; // select Layers
var data = [];
var dataJSON = [];

var sum = 0;
var avg = 0.00;

// Display and move tooltips with pointer
function pointerMoveHandler(evt) {
  if (evt.dragging) { return; }

  // Depending on what tool is display diffrent helpMsg
  var helpMsg = 'Klicka för att börja mäta';
  var tooltipCoord = evt.coordinate;

  if (sketch) {
    var output;
    var geom = (sketch.getGeometry());
    if (geom instanceof ol.geom.Polygon) {
      tooltipCoord = geom.getInteriorPoint().getCoordinates();
    } else if (geom instanceof ol.geom.LineString) {
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
  if (e.interaction === settings.interactions.tool) {
    $('#o-stats-button button').addClass('o-stats-button-true');
    if (lengthTool.isEnabled) { $('#o-stats-hand-button').removeClass('o-hidden'); }
    if (areaTool.isEnabled) { $('#o-stats-square-button').removeClass('o-hidden'); }
    $('#o-stats-button').removeClass('tooltip');
    // setActive(true);
    isActive = true;
    settings.tool.active = true;
    defaultButton.trigger('click');
  } else {
    // TODO:: Clear selection
    if (activeButton) {
      activeButton.removeClass('o-stats-button-true');
    }

    $('#o-stats-button button').removeClass('o-stats-button-true');
    if (lengthTool.isEnabled) { $('#o-stats-hand-button').addClass('o-hidden'); }
    if (areaTool.isEnabled) { $('#o-stats-square-button').addClass('o-hidden'); }
    $('#o-stats-button').addClass('tooltip');

    settings.map.un('pointermove', pointerMoveHandler);
    settings.map.un('click', pointerMoveHandler);
    settings.map.removeInteraction(stats);
    // drawnFeatures.setVisible(false);
    Viewer.removeOverlays(overlayArray);
    // drawnFeatures.getSource().clear();
    // setActive(false);
    isActive = false;
    settings.tool.active = false;
  }
}
/** TODO:: Write commentst
 * [createTool description]
 * @param {[type]} toolName [description]
 * @param {[type]} icon     [description]
 * @param {[type]} toolTip  [description]
 * @param {[type]} tipPlace [description]
 * @return {[type]} [description]
 */
function createTool(toolName, icon, toolTip, tipPlace) {
  $('#o-' + toolName + '-toolbar').append(Utils.createButton({
    id: 'o-' + toolName + '-' + icon + '-button',
    cls: 'o-' + toolName + '-type-button',
    iconCls: 'o-icon-minicons-' + icon + '-vector',
    src: '#minicons-' + icon + '-vector',
    tooltipText: toolTip,
    tooltipPlacement: tipPlace
  }));
  $('#o-' + toolName + '-' + icon + '-button').addClass('o-hidden');
}
/**
 * [addButton adds a button to the canvas and appends a toolTip text.]
 * @param {[String]} target  [The name of the target element]
 * @param {[String]} name    [The name of the toolTip ]
 * @param {[String]} toolTip [The text that is displayed on hover aka. tooltip]
 * @return {[HTML]} [Appends a new toolbar to the map.]
 */
function addButton(target, name, toolTip) {
  $('#o-' + name + '-toolbar')
    .append(Utils.createButton({
      id: 'o-' + name + '-button',
      cls: 'o-' + name + '-button',
      iconCls: 'o-icon-steady-' + name,
      src: '#steady-' + name,
      tooltipText: toolTip
    }));
}
/**
 * [createControl Creates a new div element]
 * @param {[String]} target [Name of the target element]
 * @param {[String]} name   [Name of the toolbar]
 * @param {[String]} toolTip [The text that is displayed on hover aka. tooltip]
 * @return {[HTML]} [Appends a new toolbar to the map.]
 */
function createControl(target, name, toolTip) {
  var toolbar = Utils.createElement('div', '', {
    id: 'o-' + name + '-toolbar',
    cls: 'o-toolbar-horizontal'
  });
  $(target).append(toolbar);
  addButton(target, name, toolTip);
}
function render2(target) {
  if (allEnabled(select.tools.list)) {
    createControl(target, settings.tool.toolName, 'Mät i kartan2');
  }
  var list = select.tools.list;
  for (var index in list) {
    if (list[index].enabled) {
      createTool(settings.tool.toolName, list[index].icon, list[index].toolTip, list[index].tipPlace);
    }
  }
}

/** TODO :: Add comments
 * [addClick description]
 * @param {[type]} event [description]
 * @returns {[type]} event [description]
 */
function clickStatsButton2(event) {
  toogleInteraction(settings.target.class.map, settings.interactions.default, settings.interactions.tool);
  $(settings.target.id.buttons.stats + ' button').blur();
  event.preventDefault();
}
function bindTools() {
  // add event listner
  //
  toggleType2();
}
function bindStatsButton() {
  if (allEnabled(select.tools.list)) {
    $(settings.target.id.buttons.stats).on('click', clickStatsButton2);
  }
}
function bindUIActions2() {
  bindStatsButton();
  bindTools();
}

function clickStatsButton(e) {
  toggleMeasure();
  $('#o-stats-button button').blur();
  e.preventDefault();
}
function clickLineButton(e) {
  selected = 'single';
  select.type.selected = 'single';
  type = 'Point';
  toggleType($('#o-stats-hand-button button'));
  $('#o-stats-hand-button button').blur();
  e.preventDefault();
}
function clickAreaButton(e) {
  selected = 'box';
  select.type.selected = 'box';
  type = 'Polygon';
  toggleType($('#o-stats-square-button button'));
  $('#o-stats-square-button button').blur();
  e.preventDefault();
}

function bindUIActions() {
  if (lengthTool.isEnabled || areaTool.isEnabled) {
    $('#o-stats-button').on('click', clickStatsButton2);
  }

  if (lengthTool.isEnabled) {
    $('#o-stats-hand-button').on('click', clickLineButton);
  }

  if (areaTool.isEnabled) {
    $('#o-stats-square-button').on('click', clickAreaButton);
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
        ['m20_29'].concat(data[5] + 1)
      ],
      type: 'donut'
    },
    donut: {
      title: 'Procentfördelning'
    }
  });
}
function testCharts() {
  var ctx = document.getElementById('myChart');
  var myChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Red', 'Blue', 'Yellow', 'Green', 'Purple', 'Orange'],
      datasets: [{
        label: '# of Votes',
        data: [12, 19, 3, 5, 2, 3],
        backgroundColor: [
          'rgba(255, 99, 132, 0.2)',
          'rgba(54, 162, 235, 0.2)',
          'rgba(255, 206, 86, 0.2)',
          'rgba(75, 192, 192, 0.2)',
          'rgba(153, 102, 255, 0.2)',
          'rgba(255, 159, 64, 0.2)'
        ],
        borderColor: [
          'rgba(255,99,132,1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)'
        ],
        borderWidth: 1
      }]
    },
    options: {
      scales: {
        yAxes: [{
          ticks: {
            beginAtZero: true
          }
        }]
      }
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
        ['m20_29'].concat(data[5] + 1)

      ],
      type: 'bar'
    },
    bar: {
      width: {
        ratio: 0.5 // this makes bar width 50% of length between ticks
      }
      // or
      // width: 100 // this makes bar width 100px
    }
  });
}
function kartesisktChart() {
  var first = data.slice(0, 3);
  var last = data.slice(-3);
  last.forEach(function (part, index, theArray) {
    theArray[index] = part - 1;
  });
  var chart = c3.generate({
    bindto: '#kartesisktChart',
    data: {
      columns: [
        ['Kvinnors ålder'].concat(first),
        ['Mäns ålder'].concat(last)
      ],
      onclick: function (d, element) {
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
    .tickFormat(5, '+%');

  var g = d3.select('.d3LinearLegend g').call(xAxis);

  g.select('.domain')
    .remove();

  g.selectAll('rect')
    .data(threshold.range().map(function (color) {
      var d = threshold.invertExtent(color);
      if (d[0] == null) d[0] = x.domain()[0];
      if (d[1] == null) d[1] = x.domain()[1];
      return d;
    }))
    .enter().insert('rect', '.tick')
    .attr('height', 8)
    .attr('x', function (d) { return x(d[0]); })
    .attr('width', function (d) { return x(d[1]) - x(d[0]); })
    .attr('fill', function (d) { return threshold(d[0]); });

  d3.selectAll('text').remove();
  g.append('text')
    .attr('fill', '#000')
    .attr('font-weight', 'bold')
    .attr('text-anchor', 'start')
    .attr('font-size', '40px')
    .attr('y', -6)
    .data([{'sum': sum}])
    .text(function (d) { return 'Summan: ' + d.sum; });
}
function add(accumulator, currentValue) {
  return accumulator + currentValue;
}
function getSum(a) {
  return a.reduce(add);
}
function getAvg(a) {
  return round2(getSum(a) / a.length, 2);
}

/**
 * [selectLayers description]
 * @param {[type]} a [description]
 * @param {[type]} v [description]
 * @return {[type]} [description]
 */
function getSelectableVisible(a, v) {
  var r = [];
  if (v) {
    a.forEach(function (l) {
      if (l instanceof ol.layer.Vector && l.get('visible')) {
        r.push(l);
      }
    });
    return r;
  }
  a.forEach(function (l) {
    if (l instanceof ol.layer.Vector) {
      r.push(l);
    }
  });
  return r;
}

/**
 * [getRelevantLayers description]
 * @param {[type]} l [description]
 * @return {[type]} [description]
 */
function addInteraction2() {
  select.type.single.interaction = new ol.interaction.Select({
    condition: ol.events.condition.click,
    layers: getSelectableVisible(settings.map.getLayers(), true)
  });
  settings.map.addInteraction(select.type.single.interaction);
  var selectedFeatures = select.type.single.interaction.getFeatures();

  if (select.type.selected === 'box') {
    select.type.box.interaction = new ol.interaction.DragBox({
      condition: ol.events.condition.platformModifierKeyOnly,
      layers: getSelectableVisible(settings.map.getLayers(), true)
    });
    settings.map.addIntercation(select.type.box.interaction);
    select.type.box.on('boxstart', function () {
      console.log('boxstart')
      var extent = select.type.box.interaction.getGeometry().getExtent();
      select.layers.forEach(function (layer) {
        layer.getSource().forEachFeatureIntersectingExtent(extent, function (feature) {
            selectedFeatures.push(feature);
          });
      });
    });
    select.type.box.on('boxend', function () {
      console.log('boxend')
    });
  }
}

function addInteraction() {
  // drawnFeatures.setVisible(true);

  // stats = new ol.interaction.Draw({
  //   source: source,
  //   type: type,
  //   style: style.createStyleRule(statsStyleOptions.interaction)
  // });
  //
  // var layers = null;
  // var selectedFeatures = null;

  function getRelevantLayers(l) {
    if (l.get('visible') && l.get('name') !== 'topowebbkartan_nedtonad' && l.get('name') !== 'stats') {
      visibleLayers.push(l.get('name'));
    }
  }
  if (selected === 'single') {
    singleSelect = new ol.interaction.Select({
      condition: ol.events.condition.click,
      layers: select.layers
      // toggleCondition: ol.events.condition.never
    });
    settings.map.addInteraction(singleSelect);
    // map.addInteraction(stats);

    var layers = settings.map.getLayers();
    // visibleLayers

    var selectedFeatures = singleSelect.getFeatures();
    selectedFeatures.on(['add', 'remove'], function () {
      data = [];
      visibleLayers = [];
      layers.forEach(getRelevantLayers);
      visibleLayers.forEach( function (l) {
        var tmp = selectedFeatures.getArray().map( function (feature) {
          return feature.get(l);
        });
        var oi = isNaN(parseInt(tmp[0], 10)) ? 0 : parseInt(tmp[0], 10);
        data.push(oi);
        dataJSON.push({'field': l,  'value': oi});
        // console.log(dataJSON);
      });

      sum = getSum(data);
      avg = getAvg(data);
      document.getElementById('sumVal').innerHTML = sum;
      document.getElementById('medVal').innerHTML = avg;

      // createLinearLegend();
      // kartesisktChart();

      createPieChartLegend();
      barChart();
      testCharts();

    });
  } else if (selected === 'box') {
    tmpSelect = new ol.interaction.Select({
      condition: ol.events.condition.click
    });
    settings.map.addInteraction(tmpSelect);

    var sf = tmpSelect.getFeatures();

    // var slayers = [];
    // var sff = [];

    boxSelect = new ol.interaction.DragBox({
      condition: ol.events.condition.platformModifierKeyOnly
    });
    settings.map.addInteraction(boxSelect);

    boxSelect.on('boxend', function () {
      // features that intersect the box are added to the collection of
      // selected features
      var extent = boxSelect.getGeometry().getExtent();
      var map = settings.map;

      map.getLayers().forEach(function (l) {
        if (l instanceof ol.layer.Vector && l.get('id') === 'flera_joins1_nyko3') {
          // tmpLayers.push(l);
          l.getSource().forEachFeatureIntersectingExtent(extent, function (f) {
            sf.push(f);
            // sff.push(f);
          });
        }
      });
    });

    // clear selection when drawing a new box and when clicking on the map
    boxSelect.on('boxstart', function () {
      // console.log('clear');
      // console.log(selectedFeatures)
      // daniel.forEach(function(l){
      //   l.clear();
      // });

      // console.log(sf.getKeys());
      // console.log(sf.get('length'));
      // console.log(boxSelect.getKeys());
      // console.log(tmpSelect.getFeatures());

      // console.log(slayers.length);
      // console.log(sff.length);

      // slayers.forEach(function(l){
      //   sff.forEach(function(f){
      //     l.getSource().removeFeature(f);
      //   });
      // });

      // sf.clear();

      // tmpLayers.forEach(function(layer){
      //   if (layer instanceof ol.layer.Vector && layer.get('id') === 'flera_joins1_nyko3') {
      //     console.log(layer);
      //     layer.getSource().clear();
      //   }
      // });
    });
  }

  createMeasureTooltip();
  createHelpTooltip();

  settings.map.on('pointermove', pointerMoveHandler);
  settings.map.on('click', pointerMoveHandler);

  // stats.on('drawstart', setSketch, this);
  // stats.on('drawend', unSketch, this);
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
  settings.map.addOverlay(helpTooltip);
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
  settings.map.addOverlay(statsTooltip);
}
/** TODO :: Write comments
 * [toogleInteraction description]
 * @param {[type]} target       [description]
 * @param {[type]} interaction0 [description]
 * @param {[type]} interaction1 [description]
 * @return {[type]} [description]
 */
function toogleInteraction(target, interaction0, interaction1) {
  if (settings.tool.active) {
    $(target).trigger({
      type: 'enableInteraction',
      interaction: interaction0
    });
  } else {
    $(target).trigger({
      type: 'enableInteraction',
      interaction: interaction1
    });
  }
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

function toggleType2(button) {
  var trueCls = settings.target.class.true.stats;
  settings.buttons.active.removeClass(trueCls);
  settings.buttons.active = button.addClass(trueCls);

  // remove current interaction.
  // settings.map.removeInteraction(stats);

  settings.map.removeInteraction(select.type.single.interaction);
  settings.map.removeInteraction(select.type.box.interaction);
  addInteraction2();
}
function toggleType(button) {
  if (activeButton) {
    activeButton.removeClass('.o-stats-button-true');
  }

  button.addClass('.o-stats-button-true');
  activeButton = button;
  // remove current interaction.
  settings.map.removeInteraction(selected);
  settings.map.removeInteraction(singleSelect);
  settings.map.removeInteraction(boxSelect);
  settings.map.removeInteraction(tmpSelect);
  addInteraction();
}

/** TODO :: Write comments
 * [initMapTool description]
 * @return {[type]} [description]
 */
function initMapTool() {
  settings.target.id.mapTools = inspect(options, 'target', '#o-toolbar-maptools', options.inspect.show.warn);
  settings.map = Viewer.getMap();
  select.layers = getSelectableVisible(settings.map.getLayers(), false);

  $(settings.target.class.map).on('enableInteraction', onEnableInteraction);
  // TODO :: Continue clean UP FIX:: ploygon, add Charts, add dynamic legend.
  render2(settings.target.id.mapTools);
  bindUIActions();
  defaultButton = defaultTool === 'area' ? $('#o-stats-polygon-button button') : $('#o-stats-hand-button button');
}
/**
 * [isEnabled takes an array an checks if all items are enabled]
 * @param {[Array]} a [array of tools]
 * @return {Boolean} [are all values enabled]
 */
function allEnabled(a) {
  for (var i in a   ) {
    if (!a[i].enabled) return false;
  }
  return true;
}
/**
 * [connectNames connects names list from options with given objects list.]
 * @param {[Array]} names [List of tool names]
 * @param {[Array]} list  [list of objects]
 * @return {[Object]} [updates list of objects by enablnig them]
 */
function connectNames(names, list) {
  names.forEach(function (name) {
    list.forEach(function (tool) {
      tool.enabled = tool.enabled === null ? name === tool.name : true;
    });
  });
}
/**
 * This function initiates the stats tool.
 * @param {[Object]} optOptions [options settings from controls]
 * @return {[Object]} Stats Toolkit [A control for visualizing geodata in charts]
 */
module.exports.init = function (optOptions) {
  options = optOptions || {};
  options.inspect.show.warn = inspect(options.inspect.show, 'warn', true, true);
  select.tools.names = inspect(options, 'select', ['single'], options.inspect.show.warn);
  settings.tool.toolName = inspect(options, 'toolName', ['stats'], options.inspect.show.warn);
  connectNames(select.tools.names, select.tools.list);

  charts = inspect(options, 'charts', ['circle', 'bar'], options.inspect.show.warn);
  line.enabled = charts.includes('line');
  bar.enabled = charts.includes('bar');
  radar.enabled = charts.includes('radar');
  pie.enabled = charts.includes('pie');
  polar.enabled = charts.includes('polar');
  bubble.enabled = charts.includes('bubble');

  measureTools =  inspect(options, 'measureTools', ['area', 'length'], options.inspect.show.warn);
  lengthTool.isEnabled = measureTools.indexOf('length') >= 0;
  areaTool.isEnabled = measureTools.indexOf('area') >= 0;

  if (allEnabled(select.tools.list)) {
    initMapTool();
  } else {
    throw Error('Cannot initialize stats into #o-map-tools.');
  }
};
