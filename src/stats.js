'use strict';

// TODO :: Imported modules variables should start with a bit letter
// TODO :: Big letter as CONSTRUCTOR
// Last import i the inspector.

var Viewer = require('./viewer');
var Utils = require('./utils');
var round2 = require('./utils/round2');
var inspect = require('./inspect');

var featureInfo = require('./featureinfo');


var ol = require('openlayers');
var $ = require('jquery');

// TODO :: Statistics remove unnecessary modules.

var c3 = require('c3');
var Chart = require('chart.js');

var overlayArray = [];

var sketch;

var stats;
var statsTooltip;
var statsTooltipElement;

var helpTooltip;
var helpTooltipElement;


// TODO :: Merge settings with tools
// TODO :: Add stats buttons to settings.
var settings = {
  'overlayArray': [],
  'tooltip': {
    'cls': 'o-tooltip o-tooltip-stats',
    'tips': [
      {
        'name': 'help',
        'element': null,
        'tip': null,
        'offset': [15, 0],
        'positioning': 'center-left',
        'stopEvent': false,
        'overlay': null
      },
      {
        'name': 'stats',
        'element': null,
        'tip': null,
        'offset': [0, -15],
        'positioning': 'bottom-center',
        'stopEvent': false,
        'overlay': null
      }
    ]
  },
  'tool': {
    'toolName': 'stats',
    'active': false,
    'toolTip': 'Mät i kartan2',
    'events': {
      'click': function (e) {
        // settings.map.removeInteraction(select.type.single.interaction);
        // settings.map.removeInteraction(select.type.box.interaction);

        // featureInfo.setActive(false);

        // settings.map.getInteractions().forEach(function (interaction) {
        //   if(interaction instanceof ol.interaction.Select) { console.log(interaction); settings.map.removeInteraction(interaction); }
        // });

        // toogleInteraction(settings.target.class.map, settings.interactions.default, settings.interactions.tool);
        // $(settings.target.html.buttons.stats).blur();
        // e.preventDefault();
      }
    }
  },
  'interactions': {
    'default': 'featureInfo',
    'tool': 'statsInfo' // was stats
  },
  'buttons': {
    'default': '',
    'active': ''
  },
  'target': { // More General targets, where to putt default maybee in buttons?
    'id': {
      'mapTools': '#o-toolbar-maptools',
      'buttons': {
        'stats': '#o-stats-button',
        'hand': '#o-stats-hand-button',
        'square': '#o-stats-square-button'
      }
    },
    'html': {
      'buttons': {
        'stats': '#o-stats-button button',
        'hand': '#o-stats-hand-button button',
        'square': '#o-stats-square-button button'
      }
    },
    'class': {
      'map': '.o-map',
      'visible': {
        'stats': 'o-stats-button-true'
      },
      'hidden': 'o-hidden',
      'tooltip': 'tooltip'
    }
  },
  'map': null,
  'options': {
    'default': {
      'name': 'options',
      'inspect': {
        'show': {
          'warn': true
        }
      }
    }
  }
};
// var counter = 0; // for debug
var select = {
  'layers': [],
  'type': {
    'single': {
      'interaction': null,
      'helpMsg': 'Klicka för att börja mäta, Håll inne Shift för att mäta flera.'
    },
    'box': {
      'interaction': null,
      'helpMsg': 'Rita en box för att börja mäta, Håll inne Ctrl för att mäta flera.'
    },
    'singleBox': {
      'interaction': null
    },
    'selected': null
  },
  'selected':
  {
    'features': null,
    'length': {
      'group': 0,
      'all': 0
    },
    'layer': {
      'names': []
    }
  },
  // [
  //   {
  //     'features': null,
  //     'length': {
  //       'group': 0,
  //       'all': 0
  //     },
  //     'layer': {
  //       'names': []
  //     }
  //   }
  // ],
  'tools': {
    'names': [],
    'list': [
      {
        'name': 'all',
        'enabled': false,
        'active': false,
        'icon': 'stats',
        'toolTip': 'Mät i kartan',
        'tipPlace': '',
        'target': {
          'id': '#o-stats-button',
          'html': '#o-stats-button button'
        },
        'events': {
          'click': function (e) {
            settings.tool.active = settings.tool.active ? false : true;
            toogleInteraction(settings.target.class.map, settings.interactions.default, settings.interactions.tool);
              toggleType($(settings.target.html.buttons.hand), false);
              toggleType($(settings.target.html.buttons.square), false);
              settings.map.removeInteraction(select.type.single.interaction);
              settings.map.removeInteraction(select.type.singleBox.interaction);
              settings.map.removeInteraction(select.type.box.interaction);
            $(settings.target.html.buttons.stats).blur();
            // settings.map.getInteractions().forEach(function(iin) {
            //   // console.log(iin instanceof ol.interaction.Select, iin.get('name'), iin.getActive() );
            //   if (iin instanceof ol.interaction.Select) {
            //     counter++;
            //   }
            // });
            // console.log(counter);
            e.preventDefault();
          }
        }
      },
      {
        'name': 'single',
        'enabled': false,
        'active': false,
        'icon': 'hand',
        'toolTip': 'Enskild',
        'tipPlace': 'north',
        'target': {
          'id': '#o-stats-hand-button',
          'html': '#o-stats-hand-button button'
        },
        'events': {
          'click': function (e) {
            select.type.selected = 'single';
            select.tools.list[getIndex(select.tools.list, 'name', 'single')].active = select.tools.list[getIndex(select.tools.list, 'name', 'single')].active ? false : true;
            toggleType($(settings.target.html.buttons.hand), select.tools.list[getIndex(select.tools.list, 'name', 'single')].active);

            $(settings.target.html.buttons.hand).blur();
            e.preventDefault();
          },
          'pointerMoveHandler': function (e) {
            if (e.type === 'pointermove') {
              // settings.helpTooltipElement.innerHTML = 'Klicka för att börja mäta. Håll in Shift för att markera flera';
              // settings.helpTooltip.setPosition(e.coordinate);
              updateInfo('help', select.type.single.helpMsg, e.coordinate);
            }
          }
        }
      },
      {
        'name': 'box',
        'enabled': false,
        'active': false,
        'icon': 'square',
        'toolTip': 'MultiBox',
        'tipPlace': 'north',
        'target': {
          'id': '#o-stats-square-button',
          'html': '#o-stats-square-button button'
        },
        'events': {
          'click': function (e) {
            select.type.selected = 'box';
            select.tools.list[getIndex(select.tools.list, 'name', 'box')].active = select.tools.list[getIndex(select.tools.list, 'name', 'box')].active ? false : true;
            toggleType($(settings.target.html.buttons.square), select.tools.list[getIndex(select.tools.list, 'name', 'box')].active);
            $(settings.target.html.buttons.square).blur();
            e.preventDefault();
          },
          'pointerMoveHandler': function (e) {
            if (e.type === 'pointermove') {
              // settings.helpTooltipElement.innerHTML = 'Klicka för att börja mäta. Håll in Ctrl för att markera flera';
              // settings.helpTooltip.setPosition(e.coordinate);
              updateInfo('stats', select.type.box.helpMsg, e.coordinate);
            }
          }
        }
      }
    ]
  }
};

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
    // label = output;
    statsTooltip.setPosition(tooltipCoord);
  }

  if (evt.type === 'pointermove') {
    helpTooltipElement.innerHTML = helpMsg;
    helpTooltip.setPosition(evt.coordinate);
  }
}

function onEnableInteraction(e) {
  if (e.interaction === settings.interactions.tool) {
    $(settings.target.html.buttons.stats).addClass(settings.target.class.visible.stats);
    select.tools.list.forEach(function (tool) {
      if (tool.enabled) {
        $(tool.target.id).removeClass(settings.target.class.hidden);
      }
    });
    $(settings.target.id.buttons.stats).removeClass(settings.target.class.tooltip);
    settings.tool.active = true;
    // settings.buttons.default.trigger('click');
    // console.log(select.type.selected);
    // $('#o-stats-hand-button > button').on('click', function(e) {
    //   // var layers = select.type.single.interaction.getLayers();
    //   // layers.forEach(function(l) {
    //   //   l.getSource().getFeatures().forEach(function(f) {
    //   //     l.getSource().removeFeature(f);
    //   //   });
    //   // });
    //   console.log('Show tooltip for single select.');
    // });
    // $('#o-stats-square-button > button').on('click', function(e) {
    //   console.log('Show tooltip for box box.');
    // });

    settings.map.removeInteraction(settings.interactions.default);
  } else {
    // TODO:: Clear selection
    if (settings.buttons.active) { settings.buttons.active.removeClass(settings.target.class.visible.stats); }
    $(settings.target.html.buttons.stats).removeClass(settings.target.class.visible.stats);
    select.tools.list.forEach(function (tool) {
      if (tool.enabled && tool.name !== 'all') {
        $(tool.target.id).addClass(settings.target.class.hidden);
      }
    });
    $(settings.target.id.buttons.stats).addClass(settings.target.class.tooltip);

    // settings.map.un('pointermove', pointerMoveHandler);
    // settings.map.un('click', pointerMoveHandler);

    // settings.map.un('click', errorDector);
    //
    select.tools.list.forEach(function (t) {
      settings.map.un('pointermove', t.events.pointerMoveHandler);
      settings.map.un('click', t.events.pointerMoveHandler);
    });

    settings.map.removeInteraction(settings.interactions.tool);
    settings.map.removeInteraction(select.type.single.interaction);
    select.type.single.interaction = null;
    settings.map.removeInteraction(select.type.box.interaction);
    // Viewer.removeOverlays(overlayArray);
    select.type.selected = null;

    settings.tool.active = false;
  }
  e.preventDefault();
}
function updateInfo(name, helpMsg, coords) {
  settings.tooltip.tips.forEach(function (t) {
    if (t.name === name) {
      t.element.innerHTML = helpMsg;
      t.overlay.setPosition(coords);
    }
  });
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
/** TODO :: Add comments.
 * [render2 description]
 * @param {[type]} target [description]
 * @return {[type]} [description]
 */
function render2(target) {
  if (hasEnabled(select.tools.list)) {
    createControl(target, settings.tool.toolName, select.tools.list[getIndex(select.tools.list, 'name', 'all')].toolTip);
  }
  select.tools.list.forEach(function (tool) {
    if (tool.enabled) {
      createTool(settings.tool.toolName, tool.icon, tool.toolTip, tool.tipPlace);
    }
  });
}
/** TODO :: Add comments
 * [bindUIActions description]
 * @return {[type]} [description]
 */
function bindUIActions() {
  if (hasEnabled(select.tools.list)) {
    $(settings.target.id.buttons.stats).on('click', settings.tool.events.click);
  }
  select.tools.list.forEach(function (tool) {
    if (tool.enabled) {
      $(tool.target.id).on('click', tool.events.click);
    }
  });
}
function createPieChartLegend(columns) {
  var chart = c3.generate({
    bindto: '#circleChart',
    data: {
      columns: columns,
      // columns: [
      //   ['k0_9'].concat(11),
      //   ['k10_19'].concat(12),
      //   ['k20_29'].concat(13),
      //   ['m0_9'].concat(14),
      //   ['m10_19'].concat(15),
      //   ['m20_29'].concat(16)
      // ],
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
function barChart(colums) {
  var chart = c3.generate({
    bindto: '#barChart',
    data: {
      columns: colums,
      // [
      //   ['k0_9'].concat(data[0]),
      //   ['k10_19'].concat(data[1] - 2),
      //   ['k20_29'].concat(data[2]),
      //   ['m0_9'].concat(data[3] + 1),
      //   ['m10_19'].concat(data[4]),
      //   ['m20_29'].concat(data[5] + 1)
      // ],
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
function errorDector(e) {
  alert('error');
}
/**
 * [getRelevantLayers description]
 * @param {[type]} l [description]
 * @return {[type]} [description]
 */
function addInteraction2() {
  settings.map.removeInteraction(select.type.single.interaction);
  settings.map.removeInteraction(select.type.singleBox.interaction);
  settings.map.removeInteraction(select.type.box.interaction);

  if (select.tools.list[getIndex(select.tools.list, 'name', 'single')].active) {
    // settings.map.on('pointermove', select.tools.list[getIndex(select.tools.list, 'name', 'single')].events.pointerMoveHandler);
    // settings.map.on('click', select.tools.list[getIndex(select.tools.list, 'name', 'single')].events.click);
    select.type.single.interaction = new ol.interaction.Select({
      condition: ol.events.condition.click,
      layers: getSelectableVisible(settings.map.getLayers(), true)
      // , style: new ol.style.Style({
      //   fill: new ol.style.Fill({
      //     color: 'rgba(255, 255, 255, 0.6)'
      //   }),
      //   stroke: new ol.style.Stroke({
      //     color: '#30d24a',
      //     width: 1
      //   })
      // })
    });

    settings.map.addInteraction(select.type.single.interaction);
    select.selected.features = select.type.single.interaction.getFeatures();

        var selectedFeatures = select.type.single.interaction.getFeatures();
        var columns = [];
        var total = 0;
        var navg = 0;
        var length = 3;
        selectedFeatures.on(['add', 'remove'], function (e) {
          total = 0;
          navg = 0;
          columns = [];
          selectedFeatures.getArray().forEach(function(f) {
            if(e.element.get("total")) {
              total += parseInt(e.element.get("total"), 10)
              document.getElementById('sumVal').innerHTML = total;
              navg += round2(parseInt(e.element.get("total"), 10)/length, 2);
              document.getElementById('medVal').innerHTML = navg;
              columns.push(['total'].concat(total));
              columns.push(['avg'].concat(navg));
              createPieChartLegend(columns);
              barChart(columns);
            } else if (f.get('m0_9')) {
              total += isNaN(parseInt(f.get('m0_9'), 10)) ? 0 : parseInt(f.get('m0_9'), 10);
              document.getElementById('sumVal').innerHTML = total;
              navg += round2(parseInt(e.element.get("m0_9"), 10)/length, 2);
              document.getElementById('medVal').innerHTML = navg;
              columns.push(['m0_9'].concat(isNaN(parseInt(f.get('m0_9'), 10)) ? 0 : parseInt(f.get('m0_9'), 10)));
            } else if (f.get('m10_19')) {
              total += isNaN(parseInt(f.get('m10_19'), 10)) ? 0 : parseInt(f.get('m10_19'), 10);
              document.getElementById('sumVal').innerHTML = total;
              navg += round2(parseInt(e.element.get("m10_19"), 10)/ length, 2);
              document.getElementById('medVal').innerHTML = navg;
              columns.push(['m10_19'].concat(isNaN(parseInt(f.get('m10_19'), 10)) ? 0 : parseInt(f.get('m10_19'), 10)));
            } else if (f.get('m20_29')) {
              total += isNaN(parseInt(f.get('m20_29'), 10)) ? 0 : parseInt(f.get('m20_29'), 10);
              document.getElementById('sumVal').innerHTML = total;
              navg += round2(parseInt(e.element.get("m20_29"), 10)/length, 2);
              document.getElementById('medVal').innerHTML = navg;
            } else if (f.get('k0_9')) {
              total += isNaN(parseInt(f.get('k0_9'), 10)) ? 0 : parseInt(f.get('k0_9'), 10);
              document.getElementById('sumVal').innerHTML = total;
              navg += round2(parseInt(e.element.get("k0_9"), 10)/length, 2);
              document.getElementById('medVal').innerHTML = navg;
            } else if (f.get('k10_19')) {
              total += isNaN(parseInt(f.get('k10_19'), 10)) ? 0 : parseInt(f.get('k10_19'), 10);
              document.getElementById('sumVal').innerHTML = total;
              navg += round2(parseInt(e.element.get("k10_19"), 10)/length, 2);
              document.getElementById('medVal').innerHTML = navg;
            } else if (f.get('k20_29')) {
              total += isNaN(parseInt(f.get('k20_29'), 10)) ? 0 : parseInt(f.get('k20_29'), 10);
              document.getElementById('sumVal').innerHTML = total;
              navg += round2(parseInt(e.element.get("k20_29"), 10)/length, 2);
              document.getElementById('medVal').innerHTML = navg;
            }
            // console.log(columns);
            // createPieChartLegend(columns);
          });

          // data = [];

          // sum = getSum(data);
          // avg = getAvg(data);
          // document.getElementById('sumVal').innerHTML = sum;
          // document.getElementById('medVal').innerHTML = avg;
          //
          // // createLinearLegend();
          // // kartesisktChart();
          //
          //createPieChartLegend(columns);
          // barChart();
          // testCharts();
        });

    // select.type.single.interaction.on('select', function (e) {
    //   select.selected.length.group = e.selected.length;
    //   select.selected.length.all = select.selected.features.getLength();
    //   settings.map.getLayers().forEach(function (l) {
    //     if (l.get('visible')) {
    //       // console.log(l.get('name'));
    //     }
    //   });
    //   //console.log(select.selected.length.group, select.selected.length.all);
    //
    //   // var a = e.selected;
    //   // var al = a.length;
    //   // console.log(al);
    //   // console.log(e); // e.selected.length anger hur många features per select.
    //   // var b = select.selected.features;
    //   // var bl = b.getLength();
    //   // console.log(bl);
    //   // if (a.length === 0) {
    //   //   console.log('toolTip');
    //   // } else if (a.length === 1) {
    //   //   console.log('remove tooltip'); // clear remove earliery ovs. //default case
    //   //   console.log('add overlay: Val 1');
    //   // } else if (a.length === 2) {
    //   //   console.log('add overlay: Val 2');
    //   // }
    //   // console.log(e);
    //   // console.log('selected');
    // }, this);
    // initTips();
    // unToolTip();

    // counter = 0;
    // settings.map.getInteractions().forEach(function(iin) {
    //   // console.log(iin instanceof ol.interaction.Select, iin.get('name'), iin.getActive() );
    //   if (iin instanceof ol.interaction.Select) {
    //     counter++;
    //   }
    // });
    // console.log('on addInteraction2 counter: '+counter);
    // console.log(settings.map.getInteractions().getLength());
    // console.log(select.type.single.interaction);
    // console.log(select.type.box.interaction);
    // console.log(select.type.selected);
  } else if (select.tools.list[getIndex(select.tools.list, 'name', 'box')].active) {
    select.type.singleBox.interaction = new ol.interaction.Select();
    settings.map.addInteraction(select.type.singleBox.interaction);
    select.selected.features = select.type.singleBox.interaction.getFeatures();
    select.type.box.interaction = new ol.interaction.DragBox({
      condition: ol.events.condition.platformModifierKeyOnly
    });
    settings.map.addInteraction(select.type.box.interaction);

    select.type.box.interaction.on('boxend', function () {
      var extent = select.type.box.interaction.getGeometry().getExtent();
      select.layers.forEach(function (layer) {
        layer.getSource().forEachFeatureIntersectingExtent(extent, function (feature) {
          select.selected.features.push(feature);
        });
      });
    });

    // settings.map.on('pointermove', select.tools.list[getIndex(select.tools.list, 'name', 'box')].events.pointerMoveHandler);
    // settings.map.on('click', select.tools.list[getIndex(select.tools.list, 'name', 'box')].events.click);

    //var counter = 0;
    // settings.map.getInteractions().forEach(function(iin) {
    //   // console.log(iin instanceof ol.interaction.Select, iin.get('name'), iin.getActive() );
    //   if (iin instanceof ol.interaction.Select || iin instanceof ol.interaction.DragBox ) {
    //     counter++;
    //   }
    // });
    // console.log('on addInteraction2 counter: '+counter);
    // console.log(settings.map.getInteractions().getLength());
    // console.log(select.type.single.interaction);
    // console.log(select.type.box.interaction);
    // console.log(select.type.selected);

  } else {
    // console.log(featureInfo.clear())
    // select.selected.features = null;
    // console.log('remove select');
    settings.map.removeInteraction(select.type.single.interaction);
    settings.map.removeInteraction(select.type.singleBox.interaction);
    settings.map.removeInteraction(select.type.box.interaction);
    // counter = 0;
    // settings.map.getInteractions().forEach(function(iin) {
    //   // console.log(iin instanceof ol.interaction.Select, iin.get('name'), iin.getActive() );
    //   if (iin instanceof ol.interaction.Select) {
    //     counter++;
    //   }
    // });
    // console.log('on remove'+counter);
  }
  // if (select.tools.list[getIndex(select.tools.list, 'name', 'box')].active) {
  //   select.type.singleBox.interaction = new ol.interaction.Select();
  //   settings.map.addInteraction(select.type.singleBox.interaction);
  //   select.selected.features = select.type.singleBox.interaction.getFeatures();
  //   select.type.box.interaction = new ol.interaction.DragBox({
  //     condition: ol.events.condition.platformModifierKeyOnly
  //   });
  //   settings.map.addInteraction(select.type.box.interaction);
  //
  //   select.type.box.interaction.on('boxend', function () {
  //     var extent = select.type.box.interaction.getGeometry().getExtent();
  //     select.layers.forEach(function (layer) {
  //       layer.getSource().forEachFeatureIntersectingExtent(extent, function (feature) {
  //         select.selected.features.push(feature);
  //       });
  //     });
  //   });
  //
  //   // select.type.box.interaction.on('boxstart', function() {
  //   //    select.selected.features.clear();
  //   //  });
  //
  //   // settings.map.on('pointermove', select.tools.list[getIndex(select.tools.list, 'name', 'box')].events.pointerMoveHandler);
  //   // settings.map.on('click', select.tools.list[getIndex(select.tools.list, 'name', 'box')].events.click);
  //
  //   //var counter = 0;
  //   settings.map.getInteractions().forEach(function(iin) {
  //     // console.log(iin instanceof ol.interaction.Select, iin.get('name'), iin.getActive() );
  //     if (iin instanceof ol.interaction.Select || iin instanceof ol.interaction.DragBox ) {
  //       counter++;
  //     }
  //   });
  //   console.log('on addInteraction2 counter: '+counter);
  //   // console.log(settings.map.getInteractions().getLength());
  //   // console.log(select.type.single.interaction);
  //   // console.log(select.type.box.interaction);
  //   // console.log(select.type.selected);
  // } else {
  //   console.log('remove box select && remove singlebox select');
  //   settings.map.removeInteraction(select.type.box.interaction);
  //   settings.map.removeInteraction(select.type.singleBox.interaction);
  //   // select.selected.features = null;
  //   // console.log('lenght:'+select.selected.features.getLength())
  //   // select.selected.features = select.selected.features !== null || select.selected.features !== undefined ? select.selected.features.clear() : null;
  //   counter--;
  //   counter--;
  //   console.log(counter);
  // }
  // settings.map.on('click', errorDector);
}
/** TODO:: Write Comments
 * [getIndex description]
 * @param {[type]} list [description]
 * @param {[type]} key  [description]
 * @param {[type]} value [description]
 * @return {[type]} [description]
 */
function getIndex(list, key, value) {
  return JSON.parse(JSON.stringify(list)).map(function (t) { return t[key]; }).indexOf(value);
}
// function unToolTip() {
//   // $(measureTooltipElement).remove();
//   // measureTooltipElement = null;
//   // createMeasureTooltip();
//   // $(helpTooltipElement).removeClass('o-hidden');
// };
// function addInteraction() {
//   function getRelevantLayers(l) {
//     if (l.get('visible') && l.get('name') !== 'topowebbkartan_nedtonad' && l.get('name') !== 'stats') {
//       visibleLayers.push(l.get('name'));
//     }
//   }
//   if (selected === 'single') {
//     singleSelect = new ol.interaction.Select({
//       condition: ol.events.condition.click,
//       layers: select.layers
//       // toggleCondition: ol.events.condition.never
//     });
//     settings.map.addInteraction(singleSelect);
//     // map.addInteraction(stats);
//
//     var layers = settings.map.getLayers();
//     // visibleLayers
//
//     var selectedFeatures = singleSelect.getFeatures();
//     selectedFeatures.on(['add', 'remove'], function () {
//       data = [];
//       visibleLayers = [];
//       layers.forEach(getRelevantLayers);
//       visibleLayers.forEach( function (l) {
//         var tmp = selectedFeatures.getArray().map( function (feature) {
//           return feature.get(l);
//         });
//         var oi = isNaN(parseInt(tmp[0], 10)) ? 0 : parseInt(tmp[0], 10);
//         data.push(oi);
//         dataJSON.push({'field': l,  'value': oi});
//         // console.log(dataJSON);
//       });
//
//       sum = getSum(data);
//       avg = getAvg(data);
//       document.getElementById('sumVal').innerHTML = sum;
//       document.getElementById('medVal').innerHTML = avg;
//
//       // createLinearLegend();
//       // kartesisktChart();
//
//       createPieChartLegend();
//       barChart();
//       testCharts();
//     });
//   } else if (selected === 'box') {
//     tmpSelect = new ol.interaction.Select({
//       condition: ol.events.condition.click
//     });
//     settings.map.addInteraction(tmpSelect);
//
//     var sf = tmpSelect.getFeatures();
//
//     // var slayers = [];
//     // var sff = [];
//
//     boxSelect = new ol.interaction.DragBox({
//       condition: ol.events.condition.platformModifierKeyOnly
//     });
//     settings.map.addInteraction(boxSelect);
//
//     boxSelect.on('boxend', function () {
//       // features that intersect the box are added to the collection of
//       // selected features
//       var extent = boxSelect.getGeometry().getExtent();
//       var map = settings.map;
//
//       map.getLayers().forEach(function (l) {
//         if (l instanceof ol.layer.Vector && l.get('id') === 'flera_joins1_nyko3') {
//           // tmpLayers.push(l);
//           l.getSource().forEachFeatureIntersectingExtent(extent, function (f) {
//             sf.push(f);
//             // sff.push(f);
//           });
//         }
//       });
//     });
//
//     // clear selection when drawing a new box and when clicking on the map
//     boxSelect.on('boxstart', function () {
//
//     });
//   }
//
//   // initToolTip();
//   // initHelp();
//
//   settings.map.on('pointermove', pointerMoveHandler);
//   settings.map.on('click', pointerMoveHandler);
// }
/** TODO :: Add comments
 * [initTips description]
 * @return {[type]} [description]
 */
function initTips() {
  settings.tooltip.tips.forEach(function(t){
    $(t.element).remove();
    t.element = null;

  });
  settings.tooltip.tips.forEach(function (t) {
    t.element = document.createElement('div');
    t.className = settings.tooltip.cls;
    t.overlay = new ol.Overlay({
      element: t.element,
      offset: t.offset,
      positioning: t.positioning,
      stopEvent: t.stopEvent
    });
    settings.map.addOverlay(t.overlay);
  });
}
/** TODO :: Write comments
 * [toogleInteraction description]
 * @param {[type]} target       [description]
 * @param {[type]} featureInfo [description]
 * @param {[type]} statsInfo [description]
 * @return {[type]} [description]
 */
function toogleInteraction(target, featureInfo, statsInfo) {
  // console.log(target, featureInfo, statsInfo)
  // console.log(settings.tool.active);
  if (settings.tool.active) {
    $(target).trigger({
      type: 'enableInteraction',
      interaction: statsInfo
    });
    $(target).trigger({
      type: 'removeInteraction',
      interaction: featureInfo
    });
  } else {
    $(target).trigger({
      type: 'enableInteraction',
      interaction: featureInfo
    });
    // settings.map.removeInteraction(select.type.single.interaction);
    // select.tools.list[getIndex(select.tools.list, 'name', 'single')].active = false;
    // toggleType($(settings.target.html.buttons.hand), select.tools.list[getIndex(select.tools.list, 'name', 'single')].active);
    // settings.map.removeInteraction(select.type.singleBox.interaction);
    // settings.map.removeInteraction(select.type.box.interaction);
    // select.tools.list[getIndex(select.tools.list, 'name', 'box')].active = false;
    // toggleType($(settings.target.html.buttons.square), select.tools.list[getIndex(select.tools.list, 'name', 'box')].active);
    // select.tools.list.forEach(function(t) {
    //   t.active = false;
    // })
  }
}
/** TODO :: Add comments
 * [toggleType description]
 * @param {[type]} button [description]
 * @return {[type]} [description]
 */
function toggleType(button, active) {
  // console.log(button, active)
  if (active) {
    button.addClass(settings.target.class.visible.stats);
  } else {
    button.removeClass(settings.target.class.visible.stats);
  }
  addInteraction2();
}
/** TODO :: Write comments
 * [initMapTool description]
 * @return {[type]} [description]
 */
function initMapTool() {
  settings.target.id.mapTools = inspect(settings.options, 'target', '#o-toolbar-maptools', settings.options.inspect.show.warn);
  settings.map = Viewer.getMap();
  select.layers = getSelectableVisible(settings.map.getLayers(), false);

  $(settings.target.class.map).on('enableInteraction', onEnableInteraction);
  // TODO :: Continue clean UP FIX:: ploygon, add Charts, add dynamic legend.
  render2(settings.target.id.mapTools);
  bindUIActions();
  settings.buttons.default = hasEnabled(select.tools.list) ? $(settings.target.html.buttons.hand) : $(settings.target.html.buttons.box);
}
/**
 * [hasEnabled takes an array an checks if array has an item that is enabled]
 * @param {[Array]} a [array of tools]
 * @return {Boolean} [has at least one tool enabled]
 */
function hasEnabled(a) {
  var has = false;
  a.forEach(function (t) {
    if (t.enabled) { has = true;}
  });
  return has;
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
  settings.options = optOptions || settings.options;
  settings.options.inspect.show.warn = inspect(settings.options.inspect.show, 'warn', true, true);
  select.tools.names = inspect(settings.options, 'select', ['single'], settings.options.inspect.show.warn);
  settings.tool.toolName = inspect(settings.options, 'toolName', ['stats'], settings.options.inspect.show.warn);
  connectNames(select.tools.names, select.tools.list);

  // TODO :: include more tools by default?
  charts = inspect(settings.options, 'charts', ['circle', 'bar'], settings.options.inspect.show.warn);
  line.enabled = charts.includes('line');
  bar.enabled = charts.includes('bar');
  radar.enabled = charts.includes('radar');
  pie.enabled = charts.includes('pie');
  polar.enabled = charts.includes('polar');
  bubble.enabled = charts.includes('bubble');

  if (hasEnabled(select.tools.list)) {
    initMapTool();
  } else {
    throw Error('Cannot initialize stats tool because no tools are enabled.');
  }
};
