<<<<<<< HEAD
"use strict";

var ol = require('openlayers');
var $ = require('jquery');
var Viewer = require('./viewer');
var Popup = require('./popup');
var sidebar = require('./sidebar');
var maputils = require('./maputils');
var featurelayer = require('./featurelayer');
var style = require('./style')();
var styleTypes = require('./style/styletypes');
var getFeatureInfo = require('./getfeatureinfo');
var owlCarousel = require('../externs/owlcarousel-browserify');
owlCarousel.loadjQueryPlugin();

var selectionLayer = undefined;
var savedPin = undefined;
var options;
var map;
var pinning;
var pinStyle;
var selectionStyles;
var showOverlay;
var identifyTarget;
var clusterFeatureinfoLevel;
var overlay;
var hitTolerance;

function init(opt_options) {
  map = Viewer.getMap();

  options = opt_options || {};

  pinning = options.hasOwnProperty('pinning') ? options.pinning : true;
  var pinStyleOptions = options.hasOwnProperty('pinStyle') ? options.pinStyle : styleTypes.getStyle('pin');
  pinStyle = style.createStyleRule(pinStyleOptions)[0];
  savedPin = options.savedPin ? maputils.createPointFeature(opt_options.savedPin, pinStyle) : undefined;

  selectionStyles = style.createEditStyle();

  var savedSelection = options.savedSelection || undefined;
  var savedFeature = savedPin || savedSelection || undefined;
  selectionLayer = featurelayer(savedFeature, map);

  showOverlay = options.hasOwnProperty('overlay') ? options.overlay : true;
=======
import 'owl.carousel';
import Overlay from 'ol/Overlay';
import $ from 'jquery';
import { Component } from './ui';
import Popup from './popup';
import sidebar from './sidebar';
import maputils from './maputils';
import featurelayer from './featurelayer';
import Style from './style';
import StyleTypes from './style/styletypes';
import getFeatureInfo from './getfeatureinfo';
import replacer from '../src/utils/replacer';

const styleTypes = StyleTypes();

const Featureinfo = function Featureinfo(options = {}) {
  const {
    clickEvent = 'click',
    clusterFeatureinfoLevel = 1,
    hitTolerance = 0,
    pinning = true,
    pinsStyle: pinStyleOptions = styleTypes.getStyle('pin'),
    savedPin: savedPinOptions,
    savedSelection,
    selectionStyles: selectionStylesOptions,
    showOverlay = true
  } = options;

  let identifyTarget;
  let overlay;
  let items;
  let popup;
  let selectionLayer;
  let viewer;

  const pinStyle = Style.createStyleRule(pinStyleOptions)[0];
  const selectionStyles = selectionStylesOptions ? Style.createGeometryStyle(selectionStylesOptions) : Style.createEditStyle();
  let savedPin = savedPinOptions ? maputils.createPointFeature(savedPinOptions, pinStyle) : undefined;
  const savedFeature = savedPin || savedSelection || undefined;
>>>>>>> origin

  if (showOverlay) {
    identifyTarget = 'overlay';
  } else {
    sidebar.init();
    identifyTarget = 'sidebar';
  }

<<<<<<< HEAD
  clusterFeatureinfoLevel = options.hasOwnProperty('clusterFeatureinfoLevel') ? options.clusterFeatureinfoLevel : 1;

  hitTolerance = options.hasOwnProperty('hitTolerance') ? options.hitTolerance : 0;

  map.on('click', onClick);
  $(document).on('enableInteraction', onEnableInteraction);

}

function getSelectionLayer() {
  return selectionLayer.getFeatureLayer();
}

function getSelection() {
  var selection = {};
  selection.geometryType = selectionLayer.getFeatures()[0].getGeometry().getType();
  selection.coordinates = selectionLayer.getFeatures()[0].getGeometry().getCoordinates();
  return selection;
}

function getPin() {
  return savedPin;
}

function getHitTolerance() {
  return hitTolerance;
}

function identify(items, target, coordinate) {
  clear();
  var content = items.map(function (i) {
    return i.content;
  }).join('');
  content = '<div id="o-identify"><div id="o-identify-carousel" class="owl-carousel owl-theme">' + content + '</div></div>';
  switch (target) {
    case 'overlay':
      var popup = Popup('#o-map');
      overlay = new ol.Overlay({
        element: popup.getEl()
      });
      map.addOverlay(overlay);
      var geometry = items[0].feature.getGeometry();
      var coord;
      geometry.getType() == 'Point' ? coord = geometry.getCoordinates() : coord = coordinate;
      overlay.setPosition(coord);
      popup.setContent({
        content: content,
        title: items[0].title
      });
      popup.setVisibility(true);
      var owl = initCarousel('#o-identify-carousel', undefined, function () {
        var currentItem = this.owl.currentItem;
        selectionLayer.clearAndAdd(items[currentItem].feature.clone(), selectionStyles[items[currentItem].feature.getGeometry().getType()]);
        popup.setTitle(items[currentItem].title);
      });
      Viewer.autoPan();
      break;
    case 'sidebar':
      sidebar.setContent({
        content: content,
        title: items[0].title
      });
      sidebar.setVisibility(true);
      var owl = initCarousel('#o-identify-carousel', undefined, function () {
        var currentItem = this.owl.currentItem;
        selectionLayer.clearAndAdd(items[currentItem].feature.clone(), selectionStyles[items[currentItem].feature.getGeometry().getType()]);
        sidebar.setTitle(items[currentItem].title);
      });
      break;
  }
}

function onClick(evt) {
  savedPin = undefined;
  //Featurinfo in two steps. Concat serverside and clientside when serverside is finished
  var clientResult = getFeatureInfo.getFeaturesAtPixel(evt, clusterFeatureinfoLevel);
  //Abort if clientResult is false
  if (clientResult !== false) {
    getFeatureInfo.getFeaturesFromRemote(evt)
      .done(function (data) {
        var serverResult = data || [];
        var result = serverResult.concat(clientResult);
        if (result.length > 0) {
          selectionLayer.clear();
          identify(result, identifyTarget, evt.coordinate)
        } else if (selectionLayer.getFeatures().length > 0) {
          clear();
        } else if (pinning) {
          sidebar.setVisibility(false);
          var resolution = map.getView().getResolution();
          setTimeout(function () {
            if (!maputils.checkZoomChange(resolution, map.getView().getResolution())) {
              savedPin = maputils.createPointFeature(evt.coordinate, pinStyle);
              selectionLayer.addFeature(savedPin);
            }
          }, 250);
        } else {
          console.log('No features identified');
        }
      });
  }
}

function setActive(state) {
  if (state === true) {
    map.on('click', onClick);
  } else {
    clear();
    map.un('click', onClick);
  }
}

function clear() {
  selectionLayer.clear();
  sidebar.setVisibility(false);
  if (overlay) {
    Viewer.removeOverlays(overlay);
  }
  console.log("Clearing selection");
}

function onEnableInteraction(e) {
  if (e.interaction === 'featureInfo') {
    setActive(true);
  } else {
    setActive(false);
  }
}

function initCarousel(id, options, cb) {
  var carouselOptions = options || {
    navigation: true, // Show next and prev buttons
    slideSpeed: 300,
    paginationSpeed: 400,
    singleItem: true,
    rewindSpeed: 200,
    navigationText: ['<svg class="o-icon-fa-chevron-left"><use xlink:href="#fa-chevron-left"></use></svg>', '<svg class="o-icon-fa-chevron-right"><use xlink:href="#fa-chevron-right"></use></svg>'],
    afterAction: cb
  };
  return $(id).owlCarousel(carouselOptions);
}

module.exports.init = init;
module.exports.clear = clear;
module.exports.getSelectionLayer = getSelectionLayer;
module.exports.getSelection = getSelection;
module.exports.getPin = getPin;
module.exports.getHitTolerance = getHitTolerance;
module.exports.identify = identify;
=======
  const clear = function clear() {
    selectionLayer.clear();
    sidebar.setVisibility(false);
    if (overlay) {
      viewer.removeOverlays(overlay);
    }
  }

  const callback = function callback(evt) {
    const currentItem = evt.item.index;
    if (currentItem !== null) {
      const clone = items[currentItem].feature.clone();
      clone.setId(items[currentItem].feature.getId());
      selectionLayer.clearAndAdd(
        clone,
        selectionStyles[items[currentItem].feature.getGeometry().getType()]
      );
      let featureinfoTitle;
      let title;
      let layer;
      if (items[currentItem].layer) {
        if (typeof items[currentItem].layer === 'string') {
          layer = viewer.getLayer(items[currentItem].layer);
        }
        else {
          layer = viewer.getLayer(items[currentItem].layer.get('name'));
        }
    }
      if (layer) {
        featureinfoTitle = layer.getProperties().featureinfoTitle;
      }

      if (featureinfoTitle) {
        const featureProps = items[currentItem].feature.getProperties();
        title = replacer.replace(featureinfoTitle, featureProps);
        if (!title) {
          title = items[currentItem].title ? items[currentItem].title : items[currentItem].name;
        }
      } else {
        title = items[currentItem].title ? items[currentItem].title : items[currentItem].name;
      }
      selectionLayer.setSourceLayer(items[currentItem].layer);
      if (identifyTarget === 'overlay') {
        popup.setTitle(title);
      } else {
        sidebar.setTitle(title);
      }
    }
  };

  const initCarousel = function initCarousel(id, opt) {
    const carouselOptions = opt || {
      onChanged: callback,
      items: 1,
      nav: true,
      navText: ['<svg class="o-icon-fa-chevron-left"><use xlink:href="#fa-chevron-left"></use></svg>',
        '<svg class="o-icon-fa-chevron-right"><use xlink:href="#fa-chevron-right"></use></svg>'
      ]
    };
    if (identifyTarget === 'overlay') {
      const popupHeight = $('.o-popup').outerHeight() + 20;
      $('#o-popup').height(popupHeight);
    }

    return $(id).owlCarousel(carouselOptions);
  }

  function getSelectionLayer() {
    return selectionLayer.getFeatureLayer();
  }

  function getSelection() {
    const selection = {};
    if (selectionLayer.getFeatures()[0]) {
      selection.geometryType = selectionLayer.getFeatures()[0].getGeometry().getType();
      selection.coordinates = selectionLayer.getFeatures()[0].getGeometry().getCoordinates();
      selection.id = selectionLayer.getFeatures()[0].getId();
      selection.type = selectionLayer.getSourceLayer().get('type');

      if (selection.type === 'WFS') {
        selection.id = selectionLayer.getFeatures()[0].getId();
      } else {
        selection.id = `${selectionLayer.getSourceLayer().get('name')}.${selectionLayer.getFeatures()[0].getId()}`;
      }
    }
    return selection;
  }

  const getSelectionLayer = function getSelectionLayer() {
    return selectionLayer.getFeatureLayer();
  };

  const getSelection = function getSelection() {
    const selection = {};
    selection.geometryType = selectionLayer.getFeatures()[0].getGeometry().getType();
    selection.coordinates = selectionLayer.getFeatures()[0].getGeometry().getCoordinates();
    return selection;
  };

  const getPin = function getPin() {
    return savedPin;
  };

  const getHitTolerance = function getHitTolerance() {
    return hitTolerance;
  };

  const render = function render(identifyItems, target, coordinate) {
    const map = viewer.getMap();
    items = identifyItems;
    clear();
    let content = items.map(i => i.content).join('');
    content = `<div id="o-identify"><div id="o-identify-carousel" class="owl-carousel owl-theme">${content}</div></div>`;
    switch (target) {
      case 'overlay':
      {
        popup = Popup(`#${viewer.getId()}`);
        popup.setContent({
          content,
          title: items[0].title
        });
        popup.setVisibility(true);
        initCarousel('#o-identify-carousel');
        const popupHeight = $('.o-popup').outerHeight() + 20;
        $('#o-popup').height(popupHeight);
        overlay = new Overlay({
          element: popup.getEl(),
          autoPan: true,
          autoPanAnimation: {
            duration: 500
          },
          autoPanMargin: 40,
          positioning: 'bottom-center'
        });
        const geometry = items[0].feature.getGeometry();
        const coord = geometry.getType() === 'Point' ? geometry.getCoordinates() : coordinate;
        map.addOverlay(overlay);
        overlay.setPosition(coord);
        break;
      }
      case 'sidebar': {
        sidebar.setContent({
          content,
          title: items[0].title
        });
        sidebar.setVisibility(true);
        initCarousel('#o-identify-carousel');
        break;
      }
      default: {
        break;
      }
    }
  };

  const onClick = function onClick(evt) {
    savedPin = undefined;
    // Featurinfo in two steps. Concat serverside and clientside when serverside is finished
    const pixel = evt.pixel;
    const map = viewer.getMap();
    const coordinate = evt.coordinate;
    const layers = viewer.getQueryableLayers();
    const clientResult = getFeatureInfo.getFeaturesAtPixel({
      coordinate,
      clusterFeatureinfoLevel,
      hitTolerance,
      map,
      pixel
    }, viewer);
    // Abort if clientResult is false
    if (clientResult !== false) {
      getFeatureInfo.getFeaturesFromRemote({
        coordinate,
        layers,
        map,
        pixel
      }, viewer)
        .done((data) => {
          const serverResult = data || [];
          const result = serverResult.concat(clientResult);
          if (result.length > 0) {
            selectionLayer.clear();
            render(result, identifyTarget, evt.coordinate);
          } else if (selectionLayer.getFeatures().length > 0) {
            clear();
          } else if (pinning) {
            const resolution = map.getView().getResolution();
            sidebar.setVisibility(false);
            setTimeout(() => {
              if (!maputils.checkZoomChange(resolution, map.getView().getResolution())) {
                savedPin = maputils.createPointFeature(evt.coordinate, pinStyle);
                selectionLayer.addFeature(savedPin);
              }
            }, 250);
          }
        });
    }
  };

  const setActive = function setActive(state) {
    const map = viewer.getMap();
    if (state) {
      map.on(clickEvent, onClick);
    } else {
      clear();
      map.un(clickEvent, onClick);
    }
  };

  // jQuery Events
  const onEnableInteraction = function onEnableInteraction(e) {
    if (e.interaction === 'featureInfo') {
      setActive(true);
    } else {
      setActive(false);
    }
  };

  // ES6 Events
  const onToggleInteraction = function onToggleInteraction(e) {
    if (e.detail === 'featureInfo') {
      setActive(true);
    } else {
      setActive(false);
    }
  };

  return Component({
    name: 'featureInfo',
    clear,
    getHitTolerance,
    getPin,
    getSelectionLayer,
    getSelection,
    onAdd(e) {
      viewer = e.target;
      const map = viewer.getMap();
      selectionLayer = featurelayer(savedFeature, map);
      map.on(clickEvent, onClick);
      $(document).on('enableInteraction', onEnableInteraction);
      document.addEventListener('toggleInteraction', onToggleInteraction);
    },
    render
  });
};

export default Featureinfo;
>>>>>>> origin
