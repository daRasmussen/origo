<<<<<<< HEAD
"use strict";

var ol = require('openlayers');
var $ = require('jquery');
var template = require("./templates/viewer.handlebars");
var Modal = require('./modal');
var utils = require('./utils');
var isUrl = require('./utils/isurl');
var elQuery = require('./utils/elquery');
var featureinfo = require('./featureinfo');
var maputils = require('./maputils');
var style = require('./style')();
var layerCreator = require('./layercreator');

var map;
var template;
var settings = {
  projection: '',
  projectionCode: '',
  projectionExtent: '',
  extent: [],
  center: [0, 0],
  zoom: 0,
  resolutions: null,
  source: {},
  group: [],
  layers: [],
  styles: {},
  controls: [],
  featureInfoOverlay: undefined,
  editLayer: null
};
var urlParams;
var pageSettings;
var pageTemplate = {};

function init(el, mapOptions) {
  render(el, mapOptions);

  // Read and set projection
  if (mapOptions.hasOwnProperty('proj4Defs') && window.proj4) {
    var proj = mapOptions['proj4Defs'];

    //Register proj4 projection definitions
    for (var i = 0; i < proj.length; i++) {
      proj4.defs(proj[i].code, proj[i].projection);
      if (proj[i].hasOwnProperty('alias')) {
        proj4.defs(proj[i].alias, proj4.defs(proj[i].code));
      }
    }
  }
  settings.params = urlParams = mapOptions.params || {};
  settings.map = mapOptions.map;
  settings.url = mapOptions.url;
  settings.target = mapOptions.target;
  settings.baseUrl = mapOptions.baseUrl;
  settings.breakPoints = mapOptions.breakPoints;
  settings.extent = mapOptions.extent || undefined;
  settings.center = urlParams.center || mapOptions.center;
  settings.zoom = urlParams.zoom || mapOptions.zoom;
  mapOptions.tileGrid = mapOptions.tileGrid || {};
  settings.tileSize = mapOptions.tileGrid.tileSize ? [mapOptions.tileGrid.tileSize, mapOptions.tileGrid.tileSize] : [256, 256];
  settings.alignBottomLeft = mapOptions.tileGrid.alignBottomLeft;

  if (mapOptions.hasOwnProperty('proj4Defs') || mapOptions.projectionCode == "EPSG:3857" || mapOptions.projectionCode == "EPSG:4326") {
    // Projection to be used in map
    settings.projectionCode = mapOptions.projectionCode || undefined;
    settings.projectionExtent = mapOptions.projectionExtent;
    settings.projection = new ol.proj.Projection({
      code: settings.projectionCode,
      extent: settings.projectionExtent,
      units: getUnits(settings.projectionCode)
    });
    settings.resolutions = mapOptions.resolutions || undefined;
    settings.tileGrid = maputils.tileGrid(settings);
  }

  settings.source = mapOptions.source;
  settings.groups = mapOptions.groups;
  settings.editLayer = mapOptions.editLayer;
  settings.styles = mapOptions.styles;
  settings.clusterOptions = mapOptions.clusterOptions || {};
  style.init();
  settings.controls = mapOptions.controls;
  settings.consoleId = mapOptions.consoleId || 'o-console';
  settings.featureinfoOptions = mapOptions.featureinfoOptions || {};
  settings.enableRotation = mapOptions.enableRotation === false ? false : true;

  //If url arguments, parse this settings
  if (window.location.search) {
    parseArg();
  }

  loadMap();
  settings.layers = createLayers(mapOptions.layers, urlParams.layers);
  addLayers(settings.layers);

  elQuery(map, {
    breakPoints: mapOptions.breakPoints,
    breakPointsPrefix: mapOptions.breakPointsPrefix,
=======
import Collection from 'ol/Collection';
import Feature from 'ol/Feature';
import geom from 'ol/geom/Geometry';
import { Component } from './ui';
import Map from './map';
import proj from './projection';
import MapSize from './utils/mapsize';
import Featureinfo from './featureinfo';
import maputils from './maputils';
import Layer from './layer';
import Main from './components/main';
import Footer from './components/footer';
import flattenGroups from './utils/flattengroups';

const Viewer = function Viewer(targetOption, options = {}) {
  let map;
  let tileGrid;
  let featureinfo;

  let {
    projection
  } = options;

  const {
    baseUrl = '',
    breakPoints,
    breakPointsPrefix,
    clsOptions = '',
    consoleId = 'o-console',
    mapCls = 'o-map',
    controls = [],
    enableRotation = true,
    featureinfoOptions = {},
    groups: groupOptions = [],
    mapGrid = true,
    pageSettings = {},
    projectionCode,
    projectionExtent,
    extent = [],
    center: centerOption = [0, 0],
    zoom: zoomOption = 0,
    resolutions = null,
    layers: layerOptions = [],
    map: mapName,
    params: urlParams = {},
    proj4Defs,
    styles = {},
    source = {},
    clusterOptions = {},
    tileGridOptions = {},
    url
  } = options;

  const target = targetOption;
  const center = urlParams.center || centerOption;
  const zoom = urlParams.zoom || zoomOption;
  const groups = flattenGroups(groupOptions);
  const defaultTileGridOptions = {
    alignBottomLeft: true,
    extent,
    resolutions,
    tileSize: [256, 256]
  };
  const tileGridSettings = Object.assign({}, defaultTileGridOptions, tileGridOptions);
  const mapGridCls = mapGrid ? 'o-mapgrid' : '';
  const cls = `${clsOptions} ${mapGridCls} ${mapCls} o-ui`.trim();
  const footerData = pageSettings.footer || {};
  const main = Main();
  const footer = Footer({
    footerData
>>>>>>> origin
  });
  let mapSize;

  const addControl = function addControl(control) {
    if (control.onAdd && control.dispatch) {
      this.addComponent(control);
    } else {
      throw new Error('Valid control must have onAdd and dispatch methods');
    }
  };

  const addControls = function addControls() {
    controls.forEach((control) => {
      this.addControl(control);
    });
<<<<<<< HEAD
  } else if (urlParams.pageid) {
    settings.layers.forEach((layer) => {
      if (layer.get('type') === 'AGS_FEATURE' && layer.get('visible')) {
        var id = urlParams.pageid;
        var f = "PAGEID='" + urlParams.pageid + "'";
        layer.set('filter', f);
        var s = layer.getSource();
      }
    })
  }

  featureinfo.init(settings.featureinfoOptions);
}

function addLayers(layers) {
  layers.forEach(function (layer) {
    map.addLayer(layer);
  });
}

function createLayers(layerlist, savedLayers) {
  var layers = [];
  for (var i = layerlist.length - 1; i >= 0; i--) {
    var savedLayer = {};
    if (savedLayers) {
      savedLayer = savedLayers[layerlist[i].name.split(':').pop()] || {
        visible: false,
        legend: false
      };
      savedLayer.name = layerlist[i].name;
    }
    var layer = $.extend(layerlist[i], savedLayer);
    layers.push(layerCreator(layer));
  }
  return layers;
}

function loadMap() {
  map = new ol.Map({
    target: 'o-map',
    controls: [],
    view: new ol.View({
      extent: settings.extent || undefined,
      projection: settings.projection || undefined,
      center: settings.center,
      resolutions: settings.resolutions || undefined,
      zoom: settings.zoom,
      enableRotation: settings.enableRotation
    })
  });
}

function parseArg() {
  var str = window.location.search.substring(1);
  var elements = str.split("&");

  for (var i = 0; i < elements.length; i++) {

    //center coordinates
    if (i == 0) {
      var z = elements[i].split(",");
      settings.center[0] = parseInt(z[0]);
      settings.center[1] = parseInt(z[1]);
    } else if (i == 1) {
      settings.zoom = parseInt(elements[i]);
    } else if (i == 2) {
      var l = elements[i].split(";");
      var layers = settings.layers;
      var la, match;
      for (var j = 0; j < layers.length; j++) {
        match = 0;
        $.each(l, function (index, el) {
          la = el.split(",");
          if (layers[j].get('group')) {
            if ((layers[j].get('group') == 'background') && (la[0] == layers[j].get('name'))) {
              layers[j].setVisible(true);
              match = 1;
            } else if ((layers[j].get('group') == 'background') && (match == 0)) {
              layers[j].setVisible(false);
            } else if (la[0] == layers[j].get('name')) {
              if (la[1] == 1) {
                layers[j].set('legend', true);
                layers[j].setVisible(false);
              } else {
                layers[j].set('legend', true);
                layers[j].setVisible(true);
              }
            }
          }
        })
      }
    }
  }

}

function getSettings() {
  return settings;
}

function getExtent() {
  return settings.extent;
}

function getBaseUrl() {
  return settings.baseUrl;
}

function getBreakPoints(size) {
  return size && settings.breakPoints.hasOwnProperty(size) ? settings.breakPoints[size] : settings.breakPoints;
}

function getMapName() {
  return settings.map;
}

function getTileGrid() {
  return settings.tileGrid;
}

function getTileSize() {
  return settings.tileSize;
}

function getUrl() {
  return settings.url;
}

function getStyleSettings() {
  return settings.styles;
}

function getResolutions() {
  return settings.resolutions;
}

function getMapUrl() {
  var layerNames = '';
  var url;

  //delete search arguments if present
  if (window.location.search) {
    url = window.location.href.replace(window.location.search, '?');
  } else {
    url = window.location.href + '?';
  }
  var mapView = map.getView();
  var center = mapView.getCenter();
  for (var i = 0; i < 2; i++) {
    center[i] = parseInt(center[i]); //coordinates in integers
  }
  var zoom = mapView.getZoom();
  var layers = map.getLayers();

  //add layer if visible
  layers.forEach(function (el) {
    if (el.getVisible() == true) {
      layerNames += el.get('name') + ';';
    } else if (el.get('legend') == true) {
      layerNames += el.get('name') + ',1;';
    }
  })
  return url + center + '&' + zoom + '&' + layerNames.slice(0, layerNames.lastIndexOf(";"));
}

function getMap() {
  return map;
}

function getLayers() {
  return settings.layers;
}

function getLayersByProperty(key, val, byName) {
  var layers = map.getLayers().getArray().filter(function (layer) {
    if (layer.get(key)) {
      if (layer.get(key) === val) {
        return layer;
      }
    }
  });

  if (byName) {
    return layers.map(function (layer) {
      return layer.get('name');
=======
  };

  const getExtent = () => extent;

  const getBaseUrl = () => baseUrl;

  const getBreakPoints = function getBreakPoints(size) {
    return size && size in breakPoints ? breakPoints[size] : breakPoints;
  };

  const getFeatureinfo = () => featureinfo;

  const getMapName = () => mapName;

  const getTileGrid = () => tileGrid;

  const getTileGridSettings = () => tileGridSettings;

  const getTileSize = () => tileGridSettings.tileSize;

  const getUrl = () => url;

  const getStyle = (styleName) => {
    if (styleName in styles) {
      return styles[styleName];
    }
    return null;
  };

  const getStyles = () => styles;

  const getResolutions = () => resolutions;

  const getMapUrl = () => {
    let layerNames = '';
    let mapUrl;

    // delete search arguments if present
    if (window.location.search) {
      mapUrl = window.location.href.replace(window.location.search, '?');
    } else {
      mapUrl = `${window.location.href}?`;
    }
    const mapView = map.getView();
    const centerCoords = mapView.getCenter().map(coord => parseInt(coord, 10));
    const zoomLevel = mapView.getZoom();
    const layers = map.getLayers();

    // add layer if visible
    layers.forEach((el) => {
      if (el.getVisible() === true) {
        layerNames += `${el.get('name')};`;
      } else if (el.get('legend') === true) {
        layerNames += `${el.get('name')},1;`;
      }
>>>>>>> origin
    });
    return `${mapUrl}${centerCoords}&${zoomLevel}&${layerNames.slice(0, layerNames.lastIndexOf(';'))}`;
  };

<<<<<<< HEAD
function getLayer(layername) {
  var layer = $.grep(settings.layers, function (obj) {
    return (obj.get('name') == layername);
  });
  return layer[0];
}

function getQueryableLayers() {
  var queryableLayers = settings.layers.filter(function (layer) {
    if (layer.get('queryable') && layer.getVisible()) {
      return layer;
    }
  });
  return queryableLayers;
}

function getGroup(group) {
  var group = $.grep(settings.layers, function (obj) {
    return (obj.get('group') == group);
  });
  return group;
}

function getGroups(opt) {
  if (opt == 'top') {
    return settings.groups;
  } else if (opt == 'sub') {
    return getSubgroups();
  } else {
    return settings.groups.concat(getSubgroups());
  }
}

function getSubgroups() {
  var subgroups = [];

  function findSubgroups(groups, n) {
    if (n >= groups.length) {
      return;
=======
  const getMap = () => map;

  const getLayers = () => map.getLayers().getArray();

  const getLayersByProperty = function getLayersByProperty(key, val, byName) {
    const layers = map.getLayers().getArray().filter(layer => layer.get(key) && layer.get(key) === val);

    if (byName) {
      return layers.map(layer => layer.get('name'));
>>>>>>> origin
    }
    return layers;
  };

  const getLayer = layerName => getLayers().filter(layer => layer.get('name') === layerName)[0];

  const getQueryableLayers = function getQueryableLayers() {
    const queryableLayers = getLayers().filter(layer => layer.get('queryable') && layer.getVisible());
    return queryableLayers;
  };

  const getSearchableLayers = function getSearchableLayers(searchableDefault) {
    const searchableLayers = [];
    map.getLayers().forEach((layer) => {
      let searchable = layer.get('searchable');
      const visible = layer.getVisible();
      searchable = searchable === undefined ? searchableDefault : searchable;
      if (searchable === 'always' || (searchable && visible)) {
        searchableLayers.push(layer.get('name'));
      }
    });
    return searchableLayers;
  };

<<<<<<< HEAD
    if (groups[n].groups) {
      groups[n].groups.forEach(function (subgroup) {
        subgroups.push(subgroup);
      });
=======
  const getGroup = function getGroup(groupName) {
    return groups.find(group => group.name === groupName);
  };
>>>>>>> origin

  const getSource = function getSource(name) {
    if (name in source) {
      return source[name];
    }
    throw new Error(`There is no source with name: ${name}`);
  };

<<<<<<< HEAD
    findSubgroups(groups, n + 1);
  }
=======
  const getGroups = () => groups;
>>>>>>> origin

  const getProjectionCode = () => projectionCode;

  const getProjection = () => projection;

  const getMapSource = () => source;

  const getControlByName = function getControlByName(name) {
    const components = this.getComponents();
    const control = components.find(component => component.name === name);
    if (!control) {
      return null;
    }
    return control;
  };

<<<<<<< HEAD
function getControlNames() {
  var controlNames = settings.controls.map(function (obj) {
    return obj.name;
  });
  return controlNames;
}
=======
  const getSize = function getSize() {
    return mapSize.getSize();
  };
>>>>>>> origin

  const getTarget = () => target;

<<<<<<< HEAD
function getClusterOptions() {
  return settings.clusterOptions;
}
=======
  const getClusterOptions = () => clusterOptions;
>>>>>>> origin

  const getConsoleId = () => consoleId;

  const getInitialZoom = () => zoom;

  const getFooter = () => footer;

  const getMain = () => main;

  const mergeSavedLayerProps = (initialLayerProps, savedLayerProps) => {
    if (savedLayerProps) {
      const mergedLayerProps = initialLayerProps.reduce((acc, initialProps) => {
        const layerName = initialProps.name.split(':').pop();
        const savedProps = savedLayerProps[layerName] || {
          visible: false,
          legend: false
        };
        savedProps.name = initialProps.name;
        const mergedProps = Object.assign({}, initialProps, savedProps);
        acc.push(mergedProps);
        return acc;
      }, []);
      return mergedLayerProps;
    }
<<<<<<< HEAD
  }

  // Alter 4: no scale limit
  else {
    return true;
  }
}

function getConsoleId() {
  return settings.consoleId;
}

function getScale(resolution) {
  var dpi = 25.4 / 0.28;
  var mpu = settings.projection.getMetersPerUnit();
  var scale = resolution * mpu * 39.37 * dpi;
  scale = Math.round(scale);
  return scale;
}

function getUnits(proj) {
  var units;
  switch (proj) {
    case 'EPSG:3857':
      units = 'm';
      break;
    case 'EPSG:4326':
      units = 'degrees';
      break;
    default:
      units = proj4.defs(proj) ? proj4.defs(proj).units : undefined;
  }
  return units;
}

function autoPan() {
  /*Workaround to remove when autopan implemented for overlays */
  var el = $('.o-popup');
  var center = map.getView().getCenter();
  var popupOffset = $(el).offset();
  var mapOffset = $('#' + map.getTarget()).offset();
  var offsetY = popupOffset.top - mapOffset.top;
  var mapSize = map.getSize();
  var offsetX = (mapOffset.left + mapSize[0]) - (popupOffset.left + $(el).outerWidth(true));

  // Check if mapmenu widget is used and opened
  var menuSize = 0;
  if (settings.controls.hasOwnProperty('mapmenu')) {
    menuSize = settings.controls.mapmenu.getTarget().offset().left > 0 ? mapSize[0] - settings.controls.mapmenu.getTarget().offset().left : menuSize = 0;
  }
  if (offsetY < 0 || offsetX < 0 + menuSize || offsetX > (mapSize[0] - $(el).outerWidth(true))) {
    var dx = 0,
      dy = 0;
    if (offsetX < 0 + menuSize) {
      dx = (-offsetX + menuSize) * map.getView().getResolution();
=======
    return initialLayerProps;
  };

  const removeOverlays = function removeOverlays(overlays) {
    if (overlays) {
      if (overlays.constructor === Array || overlays instanceof Collection) {
        overlays.forEach((overlay) => {
          map.removeOverlay(overlay);
        });
      } else {
        map.removeOverlay(overlays);
      }
    } else {
      map.getOverlays().clear();
>>>>>>> origin
    }
  };

  const setMap = function setMap(newMap) {
    map = newMap;
  };

  const setProjection = function setProjection(newProjection) {
    projection = newProjection;
  };

  const zoomToExtent = function zoomToExtent(geometry, level) {
    const view = map.getView();
    const maxZoom = level;
    const geometryExtent = geometry.getExtent();
    if (geometryExtent) {
      view.fit(geometryExtent, {
        maxZoom
      });
      return geometryExtent;
    }
    return false;
  };

  const addLayer = function addLayer(layerProps) {
    const layer = Layer(layerProps, this);
    map.addLayer(layer);
    this.dispatch('addlayer', { layerName: layerProps.name });
  };

  const addLayers = function addLayers(layersProps) {
    layersProps.reverse().forEach((layerProps) => {
      this.addLayer(layerProps);
    });
  };

  const addGroup = function addGroup(groupProps) {
    const defaultProps = { type: 'group' };
    const groupDef = Object.assign({}, defaultProps, groupProps);
    const name = groupDef.name;
    if (!(groups.filter(group => group.name === name).length)) {
      groups.push(groupDef);
      this.dispatch('add:group', { group: groupDef });
    }
<<<<<<< HEAD
    map.getView().animate({
      center: ([center[0] + dx, center[1] + dy]),
      duration: 300
    });
  }
  /*End workaround*/
}

function removeOverlays(overlays) {
  if (overlays) {
    if (overlays.constructor === Array || overlays instanceof ol.Collection) {
      overlays.forEach(function (overlay) {
        map.removeOverlay(overlay);
      })
    } else {
      map.removeOverlay(overlays);
=======
  };

  const addGroups = function addGroups(groupsProps) {
    groupsProps.forEach((groupProps) => {
      this.addGroup(groupProps);
    });
  };

  // removes group and any depending subgroups and layers
  const removeGroup = function removeGroup(groupName) {
    const group = groups.find(item => item.name === groupName);
    if (group) {
      const layers = getLayersByProperty('group', groupName);
      layers.forEach((layer) => {
        map.removeLayer(layer);
      });
      const groupIndex = groups.indexOf(group);
      groups.splice(groupIndex, 1);
      this.dispatch('remove:group', { group });
>>>>>>> origin
    }
    const subgroups = groups.filter((item) => {
      if (item.parent) {
        return item.parent === groupName;
      }
      return false;
    });
    if (subgroups.length) {
      subgroups.forEach((subgroup) => {
        const name = subgroup.name;
        removeGroup(groups[name]);
      });
    }
  };

  const addSource = function addSource(sourceName, sourceProps) {
    if (!(sourceName in source)) {
      source[sourceName] = sourceProps;
    }
<<<<<<< HEAD
  }

  $(el).html(template(pageTemplate));
}

module.exports.init = init;
module.exports.createLayers = createLayers;
module.exports.getBaseUrl = getBaseUrl;
module.exports.getBreakPoints = getBreakPoints;
module.exports.getExtent = getExtent;
module.exports.getSettings = getSettings;
module.exports.getStyleSettings = getStyleSettings;
module.exports.getMapUrl = getMapUrl;
module.exports.getMap = getMap;
module.exports.getLayers = getLayers;
module.exports.getLayersByProperty = getLayersByProperty;
module.exports.getLayer = getLayer;
module.exports.getControlNames = getControlNames;
module.exports.getQueryableLayers = getQueryableLayers;
module.exports.getGroup = getGroup;
module.exports.getGroups = getGroups;
module.exports.getProjectionCode = getProjectionCode;
module.exports.getProjection = getProjection;
module.exports.getMapSource = getMapSource;
module.exports.getResolutions = getResolutions;
module.exports.getScale = getScale;
module.exports.getTarget = getTarget;
module.exports.getClusterOptions = getClusterOptions;
module.exports.getTileGrid = getTileGrid;
module.exports.getTileSize = getTileSize;
module.exports.autoPan = autoPan;
module.exports.removeOverlays = removeOverlays;
module.exports.checkScale = checkScale;
module.exports.getMapName = getMapName;
module.exports.getConsoleId = getConsoleId;
module.exports.getUrl = getUrl;
=======
  };

  const addStyle = function addStyle(styleName, styleProps) {
    if (!(styleName in styles)) {
      styles[styleName] = styleProps;
    }
  };

  return Component({
    onInit() {
      this.render();

      proj.registerProjections(proj4Defs);
      setProjection(proj.Projection({
        projectionCode,
        projectionExtent
      }));

      tileGrid = maputils.tileGrid(tileGridSettings);

      setMap(Map({
        extent,
        getFeatureinfo,
        projection,
        center,
        resolutions,
        zoom,
        enableRotation,
        target: this.getId()
      }));

      const layerProps = mergeSavedLayerProps(layerOptions, urlParams.layers);
      this.addLayers(layerProps);

      mapSize = MapSize(map, {
        breakPoints,
        breakPointsPrefix,
        mapId: this.getId()
      });

      if (urlParams.pin) {
        featureinfoOptions.savedPin = urlParams.pin;
      } else if (urlParams.selection) {
        // This needs further development for proper handling in permalink
        featureinfoOptions.savedSelection = new Feature({
          geometry: new geom[urlParams.selection.geometryType](urlParams.selection.coordinates)
        });
      }
      featureinfoOptions.viewer = this;
      featureinfo = Featureinfo(featureinfoOptions);
      this.addComponent(featureinfo);
      this.addControls();
    },
    render() {
      const htmlString = `<div id="${this.getId()}" class="${cls}">
                            <div class="transparent flex column height-full width-full absolute top-left no-margin z-index-low">
                              ${main.render()}
                              ${footer.render()}
                            </div>
                          </div>`;
      const el = document.querySelector(target);
      el.innerHTML = htmlString;
      this.dispatch('render');
    },
    addControl,
    addControls,
    addGroup,
    addGroups,
    addLayer,
    addLayers,
    addSource,
    addStyle,
    getBaseUrl,
    getBreakPoints,
    getClusterOptions,
    getConsoleId,
    getControlByName,
    getExtent,
    getFeatureinfo,
    getFooter,
    getInitialZoom,
    getTileGridSettings,
    getGroup,
    getGroups,
    getMain,
    getMapSource,
    getQueryableLayers,
    getResolutions,
    getSearchableLayers,
    getSize,
    getLayer,
    getLayers,
    getLayersByProperty,
    getMap,
    getMapName,
    getMapUrl,
    getProjection,
    getProjectionCode,
    getSource,
    getStyle,
    getStyles,
    getTarget,
    getTileGrid,
    getTileSize,
    getUrl,
    removeGroup,
    removeOverlays,
    zoomToExtent
  });
};

export default Viewer;
>>>>>>> origin
