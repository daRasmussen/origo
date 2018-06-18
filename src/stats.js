'use strict';

// TODO :: Imported modules variables should start with a bit letter
// TODO :: Big letter as CONSTRUCTOR
// Last import i the inspector.

var Viewer = require('./viewer');
var Utils = require('./utils');
var round2 = require('./utils/round2');
var inspect = require('./inspect');

var ol = require('openlayers');
var $ = require('jquery');

// TODO :: Statistics remove unnecessary modules.

// Container for multiple charts
// var ocharts = require('./charts/ocharts.js');


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
    'events': {}
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
      },
      'info': '#o-stats-info'
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

var ocharts = {
  'fieldNames': [],
  'names': [],
  'ids': [],
  'values': [],
  'selections': {
    'total': {
      'names': [],
      'ids': [],
      'values': []
    },
    'compare': {
      'selected': [],
      'deselected': [],
      'results': [],
      'data': []
    }
  },
  'data': {
    'sum': 0,
    'average': 0.0,
    'stdDev': 0.0,
    'scale': 2,
    'precision': 7
    // https://derickbailey.com/2014/09/21/calculating-standard-deviation-with-array-map-and-array-reduce-in-javascript/
    // Precision 7, scale 2: 12345.67
    // Precision 6, scale 2:  1234.56
    // Precision 4, scale 2: 99.99
    // Precision 10, scale 0: 9999999999
    // Precision 8, scale 3: 99999.999
    // Precision 5, scale -3: 99999000
  },
  'enabled': {
    'line': false,
    'bar': false,
    'radar': false,
    'donought': false,
    'pie': false,
    'polar': false,
    'bubble': false
  }
};
var charts;
var line = { 'enabled': false };
var bar = { 'enabled': false };
var radar = { 'enabled': false };
var pie = { 'enabled': false };
var polar = { 'enabled': false };
var bubble = { 'enabled': false };

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
    settings.map.removeInteraction(settings.interactions.default);
  } else {
    // TODO:: Clear selection
    if (settings.buttons.active) { settings.buttons.active.removeClass(settings.target.class.visible.stats); }
    $(settings.target.html.buttons.stats).removeClass(settings.target.class.visible.stats);
    select.tools.list.forEach(function (tool) {
      if (tool.enabled && tool.name !== 'all') {
        $(tool.target.id).addClass(settings.target.class.hidden);
        // TODO :: BUG single selection active. console.log(tool.enabled)
      }
    });
    $(settings.target.id.buttons.stats).addClass(settings.target.class.tooltip);

    select.tools.list.forEach(function (t) {
      settings.map.un('pointermove', t.events.pointerMoveHandler);
      settings.map.un('click', t.events.pointerMoveHandler);
    });

    settings.map.removeInteraction(settings.interactions.tool);
    settings.map.removeInteraction(select.type.single.interaction);
    select.type.single.interaction = null;
    settings.map.removeInteraction(select.type.box.interaction);
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
 * [render description]
 * @param {[type]} target [description]
 * @return {[type]} [description]
 */
function render(target) {
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
  // TODO:: Add support if layer is instaceof ol.layer.tile
  a.forEach(function (l) {
    if (l instanceof ol.layer.Vector) {
      r.push(l);
    } else if (l instanceof ol.layer.Tile) {
      // do something epic.
      // WMS do request via url, send coordinates and resolution etc..
    }
  });
  return r;
}
function arraysEqual(arr1, arr2) {
  if (arr1.length !== arr2.length) {
    return false;
  }
  for (var i = arr1.length; i--;) {
    if (arr1[i] !== arr2[i]) {
      return false;
    }
  }
  return true;
}

function shrink(names, ids, values, id) {
  var index = ids.indexOf(id);
  var nn = names.filter(function (e, i) {  return i !== index; });
  var ni = ids.filter(function (e, i) {  return i !== index; });
  var nv = values.filter(function (e, i) {  return i !== index; });
  return [nn, ni, nv];
}
function addTotal(names, values) {
  // console.log(names, values)
  var newNames = [];
  var newValues = [];
  for (var i = 0; i < names.length; i++) {
    if (newNames.indexOf(names[i]) === -1) {
      // console.log('create: ', (names[i]))
      newNames.push(names[i]);
      // console.log('create: ', values[i]);
      newValues.push(values[i]);
    } else {
      var nvi = newNames.indexOf(names[i]);
      // console.log(i, newNames, names[i], newNames.indexOf(names[i]), newValues[nvi])
      // console.log('add value', values[i]);
      newValues[nvi] += values[i];
    }
  }
  // console.log(newNames, newValues)
  return [newNames, newValues];
}

/**
 * TODO :: Write comments
 * [distribute description] This method distribtes what elements are selected;
 * @param {[type]} s [description]
 * @param {[type]} d [description]
 * @return {[type]} [description]
 */
function distribute(s, d) {
  var r = [];
  if (s.length === d.length || d.length > 0) {
    return [];
  } else if (d.length === 0 && s.length > 0) {
    s.forEach(function (se) {
      r.push(se);
    });
    return r;
  }  else {
    s.forEach(function(se) {
      se.forEach(function(sef) {
        var sf = sef.getId();
        d.forEach(function(de){
          var sub = [];
          de.forEach(function(def) {
            var df = def.getId();
            // TODO :: SORT CLICK SAME get Count
            if(sf !== df){
              console.log('adds to result: ', sef);
              sub.push(sef);
            } else {
              console.log('removes from result: ', sef);
            }
          });
          if (sub.length !== 0) {
            r.push(sub);
          }
        });
      });
    });
    return r;
  }
}
function toData(a) {
  var data = [];
  var names, values;
  a.forEach(function(e){
    names = []; values = [];
    e.forEach(function(i) {
      var name = i.getId().split('.')[0];
      names.push(name);
      var val = parseInt(i.get(ocharts.fieldNames[0]), 10);
      values.push(val);
    });
    data.push(names, values);
  });
  return data;
}

function addInteraction() {
  ocharts.selections.compare.selected = [];
  ocharts.selections.compare.deselected = [];
  ocharts.selections.compare.results = [];
  ocharts.selections.total.names = [];
  ocharts.selections.total.values = [];
  ocharts.names = [];
  ocharts.values = [];
  ocharts.ids = [];

  settings.map.removeInteraction(select.type.single.interaction);
  settings.map.removeInteraction(select.type.singleBox.interaction);
  settings.map.removeInteraction(select.type.box.interaction);

  if (select.tools.list[getIndex(select.tools.list, 'name', 'single')].active) {
    select.type.single.interaction = new ol.interaction.Select({
      condition: ol.events.condition.click,
      toggleCondition: ol.events.condition.shiftKeyOnly,
      multi: true,
      layers: getSelectableVisible(settings.map.getLayers(), false)
    });

    settings.map.addInteraction(select.type.single.interaction);
    select.selected.features = select.type.single.interaction.getFeatures();

    select.type.single.interaction.on('select', function (e) {
      if (e.selected.length > 0 && window.event.shiftKey) {
        ocharts.selections.compare.selected.splice(ocharts.selections.compare.selected.length, 0, e.selected);
      } else if (window.event.shiftKey) {
        ocharts.selections.compare.deselected.splice(ocharts.selections.compare.deselected.length, 0, e.deselected);
      }
      ocharts.selections.compare.results = distribute(ocharts.selections.compare.selected, ocharts.selections.compare.deselected);
      ocharts.selections.compare.data = toData(ocharts.selections.compare.results);
      if (ocharts.selections.compare.results.length === 0 && window.event.shiftKey) {
          ocharts.selections.compare.selected = [];
          ocharts.selections.compare.deselected = [];
          ocharts.selections.compare.data = [];
          select.selected.features.clear();
      }

      // console.log('compare selected: ', ocharts.selections.compare.selected);
      // console.log('compare deselected: ', ocharts.selections.compare.deselected);
      // console.log('compare results: ', ocharts.selections.compare.results);
      // console.log('compare data: ', ocharts.selections.compare.data);

      e.selected.forEach(function (f) {
        var name = f.getId().split('.')[0];
        var id = f.getId().split('.')[1];
        var val = parseInt(f.get(ocharts.fieldNames[0]), 10);
        ocharts.selections.total.names.push(name);
        ocharts.selections.total.values.push(val);
        ocharts.names.push(name);
        ocharts.ids.push(id);
        ocharts.values.push(val);
      });
      e.deselected.forEach(function (f) {
        var id = f.getId().split('.')[1];
        var res = shrink(ocharts.names, ocharts.ids, ocharts.values, id);
        ocharts.selections.total.names = res[0];
        ocharts.selections.total.values = res[2];
        ocharts.names = res[0];
        ocharts.ids = res[1];
        ocharts.values = res[2];
      });

      var total = addTotal(ocharts.selections.total.names, ocharts.selections.total.values);

      ocharts.selections.total.names = total[0];
      ocharts.selections.total.values = total[1];

      // console.log(ocharts.selections.total.names, ocharts.selections.total.values);
      // console.log(ocharts.selections.total.names, ocharts.selections.total.values);
      // console.log(ocharts.names, ocharts.ids, ocharts.values);
      // Add compare, store each selection in a seperate array.

    }, this);

    // testCharts("urval 1", names, values);
    //testCharts("urval 2", ocharts.names[1], ochart.values[1]);
  } else if (select.tools.list[getIndex(select.tools.list, 'name', 'box')].active) {
    ocharts.selections.compare.selected = [];
    ocharts.selections.compare.deselected = [];
    ocharts.selections.compare.results = [];
    ocharts.selections.total.names = [];
    ocharts.selections.total.values = [];
    ocharts.names = [];
    ocharts.values = [];
    ocharts.ids = [];

    select.type.singleBox.interaction = new ol.interaction.Select({
      condition: ol.events.condition.click,
      toggleCondition: ol.events.condition.shiftKeyOnly,
      multi: true,
      layers: getSelectableVisible(settings.map.getLayers(), false)
    });
    settings.map.addInteraction(select.type.singleBox.interaction);
    select.selected.features = select.type.singleBox.interaction.getFeatures();
    select.type.box.interaction = new ol.interaction.DragBox({
      condition: ol.events.condition.platformModifierKeyOnly
    });
    settings.map.addInteraction(select.type.box.interaction);


    select.type.box.interaction.on('boxend', function (e) {
      console.log(e.add)
      var extent = select.type.box.interaction.getGeometry().getExtent();
      select.layers.forEach(function (layer) {
        layer.getSource().forEachFeatureIntersectingExtent(extent, function (feature) {
          select.selected.features.push(feature);

          var name = feature.getId().split('.')[0];
          var id = feature.getId().split('.')[1];
          var val = parseInt(feature.get(ocharts.fieldNames[0]), 10);
          ocharts.selections.total.names.push(name);
          ocharts.selections.total.values.push(val);
          ocharts.names.push(name);
          ocharts.ids.push(id);
          ocharts.values.push(val);

        });
      });
      var total = addTotal(ocharts.selections.total.names, ocharts.selections.total.values);

      ocharts.selections.total.names = total[0];
      ocharts.selections.total.values = total[1];

      console.log(ocharts.selections.total.names, ocharts.selections.total.values);
    });

    select.selected.features.on(['remove'], function() {
        select.selected.features.clear();
        // console.log('removes all: ')
      });

  } else {
    settings.map.removeInteraction(select.type.single.interaction);
    settings.map.removeInteraction(select.type.singleBox.interaction);
    settings.map.removeInteraction(select.type.box.interaction);
  }
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
  addInteraction();
}

/** TODO :: Write comments
 * [initMapTool description]
 * @return {[type]} [description]
 */
function initMapTool() {
  settings.map = Viewer.getMap();
  // Add eventlistner on propertychange if layer is visible.
  settings.map.getLayers().forEach(function (l) {
    l.on('propertychange', function (e) {
      if (e.key === 'visible' && e.oldValue === false || e.oldValue === true) {
        if (select.selected.features) {
          select.selected.features.clear();
          ocharts.selections.total.names = [];
          ocharts.selections.total.values = [];
        }
      }
    });
  });

  settings.target.id.mapTools = inspect(settings.options, 'target', '#o-toolbar-maptools', settings.options.inspect.show.warn);
  select.layers = getSelectableVisible(settings.map.getLayers(), false);

  $(settings.target.class.map).on('enableInteraction', onEnableInteraction);
  // TODO :: Continue clean UP FIX:: ploygon, add Charts, add dynamic legend.
  render(settings.target.id.mapTools);
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

  ocharts.fieldNames = inspect(settings.options, 'fieldNames', ['total'], settings.options.inspect.show.warn);
  // TODO :: include more tools by default?
  charts = inspect(settings.options, 'charts', ['circle', 'bar'], settings.options.inspect.show.warn);
  // charts variable removed.
  line.enabled = charts.includes('line');
  bar.enabled = charts.includes('bar');
  radar.enabled = charts.includes('radar');
  pie.enabled = charts.includes('pie');
  polar.enabled = charts.includes('polar');
  bubble.enabled = charts.includes('bubble');

  if (hasEnabled(select.tools.list)) {
    initMapTool();
    $(settings.target.id.info).removeClass(settings.target.class.hidden);
  } else {
    throw Error('Cannot initialize stats tool because no tools are enabled.');
  }
};
