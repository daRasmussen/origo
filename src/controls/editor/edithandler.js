<<<<<<< HEAD:src/editor/edithandler.js
"use strict";

var ol = require('openlayers');
var $ = require('jquery');
var viewer = require('../viewer');
var modal = require('../modal');
var featureInfo = require('../featureinfo');
var editsStore = require('./editsstore')();
var generateUUID = require('../utils/generateuuid');
var transactionHandler = require('./transactionhandler');
var dispatcher = require('./editdispatcher');
var editForm = require('./editform');
var imageresizer = require('../utils/imageresizer');
var getImageOrientation = require('../utils/getimageorientation');
var shapes = require('./shapes');

var editLayers = {};
var autoSave = undefined;
var autoForm = undefined;
var editSource = undefined;
var geometryType = undefined;
var geometryName = undefined;
var map = undefined;
var currentLayer = undefined;
var editableLayers = undefined;
var attributes = undefined;
var title = undefined;
var draw = undefined;
var hasDraw = undefined;
var hasAttribute = undefined;
var hasSnap = undefined;
var select = undefined;
var modify = undefined;
var snap = undefined;
var tools = undefined;

module.exports = function (options) {
  map = viewer.getMap();
  currentLayer = options.currentLayer;
  editableLayers = options.editableLayers;
  tools = options.drawTools || [];

  //set edit properties for editable layers
  editLayers = setEditProps(options);
  editableLayers.forEach(function (layerName) {
    var layer = viewer.getLayer(layerName);
    verifyLayer(layerName);
    if (layerName === currentLayer && options.isActive) {
      dispatcher.emitEnableInteraction();
      setEditLayer(layerName);
    }
=======
import Draw from 'ol/interaction/Draw';
import Select from 'ol/interaction/Select';
import Modify from 'ol/interaction/Modify';
import Snap from 'ol/interaction/Snap';
import Collection from 'ol/Collection';
import Feature from 'ol/Feature';
import $ from 'jquery';
import { Modal } from '../../ui';
import store from './editsstore';
import generateUUID from '../../utils/generateuuid';
import transactionHandler from './transactionhandler';
import dispatcher from './editdispatcher';
import editForm from './editform';
import imageresizer from '../../utils/imageresizer';
import getImageOrientation from '../../utils/getimageorientation';
import shapes from './shapes';

const editsStore = store();
let editLayers = {};
let autoSave;
let autoForm;
let editSource;
let map;
let currentLayer;
let editableLayers;
let attributes;
let title;
let draw;
let hasDraw;
let hasAttribute;
let hasSnap;
let select;
let modify;
let snap;
let viewer;
let featureInfo;
let modal;

function isActive() {
  if (modify === undefined || select === undefined) {
    return false;
  }
  return true;
}

function setActive(editType) {
  switch (editType) {
    case 'modify':
      draw.setActive(false);
      modify.setActive(true);
      select.setActive(true);
      break;
    case 'draw':
      draw.setActive(true);
      modify.setActive(true);
      select.setActive(false);
      break;
    default:
      draw.setActive(false);
      hasDraw = false;
      modify.setActive(true);
      select.setActive(true);
      break;
  }
}

function getFeaturesByIds(type, layer, ids) {
  const source = layer.getSource();
  const features = [];
  if (type === 'delete') {
    ids.forEach((id) => {
      const dummy = new Feature();
      dummy.setId(id);
      features.push(dummy);
    });
  } else {
    ids.forEach((id) => {
      let feature;
      if (source.getFeatureById(id)) {
        feature = source.getFeatureById(id);
        feature.unset('bbox');
        features.push(feature);
      }
    });
  }

  return features;
}

function getDefaultValues(attrs) {
  return attrs.filter(attribute => attribute.name && attribute.defaultValue)
    .reduce((prev, curr) => {
      const previous = prev;
      previous[curr.name] = curr.defaultValue;
      return previous;
    }, {});
}

function getSnapSources(layers) {
  return layers.map(layer => viewer.getLayer(layer).getSource());
}

function saveFeatures() {
  const edits = editsStore.getEdits();
  const layerNames = Object.getOwnPropertyNames(edits);
  layerNames.forEach((layerName) => {
    const transaction = {
      insert: null,
      delete: null,
      update: null
    };
    const editTypes = Object.getOwnPropertyNames(edits[layerName]);
    editTypes.forEach((editType) => {
      const layer = viewer.getLayer(layerName);
      const ids = edits[layerName][editType];
      const features = getFeaturesByIds(editType, layer, ids);
      if (features.length) {
        transaction[editType] = features;
      }
    });

    transactionHandler(transaction, layerName, viewer);
>>>>>>> origin:src/controls/editor/edithandler.js
  });
}

function saveFeature(change) {
  dispatcher.emitChangeFeature(change);
  if (autoSave) {
    saveFeatures(change);
  }
}

function onModifyEnd(evt) {
  const feature = evt.features.item(0);
  saveFeature({
    feature,
    layerName: currentLayer,
    action: 'update'
  });
}

function onDrawEnd(evt) {
  const feature = evt.feature;
  const layer = viewer.getLayer(currentLayer);
  const defaultAttributes = getDefaultValues(layer.get('attributes'));
  feature.setProperties(defaultAttributes);
  feature.setId(generateUUID());
  editSource.addFeature(feature);
  setActive();
  hasDraw = false;
  saveFeature({
    feature,
    layerName: currentLayer,
    action: 'insert'
  });
  dispatcher.emitChangeEdit('draw', false);
  if (autoForm) {
    editAttributes(feature);
  }
}

function addSnapInteraction(sources) {
  const snapInteractions = [];
  sources.forEach((source) => {
    const interaction = new Snap({
      source
    });
    snapInteractions.push(interaction);
    map.addInteraction(interaction);
  });
  return snapInteractions;
}

function removeInteractions() {
  if (isActive()) {
    map.removeInteraction(modify);
    map.removeInteraction(select);
    map.removeInteraction(draw);
    if (snap) {
      snap.forEach((snapInteraction) => {
        map.removeInteraction(snapInteraction);
      });
    }

    modify = null;
    select = null;
    draw = null;
    snap = null;
  }
}

function setInteractions(drawType) {
  const editLayer = editLayers[currentLayer];
  editSource = editLayer.getSource();
  attributes = editLayer.get('attributes');
  title = editLayer.get('title') || 'Information';
  const drawOptions = {
    source: editSource,
    type: editLayer.get('geometryType'),
    geometryName: editLayer.get('geometryName')
  };
  if (drawType) {
    $.extend(drawOptions, shapes(drawType));
  }
  removeInteractions();
  draw = new Draw(drawOptions);
  hasDraw = false;
  hasAttribute = false;
  select = new Select({
    layers: [editLayer]
  });
  modify = new Modify({
    features: select.getFeatures()
  });
  map.addInteraction(select);
  map.addInteraction(modify);
  map.addInteraction(draw);
  modify.on('modifyend', onModifyEnd, this);
  draw.on('drawend', onDrawEnd, this);
  setActive();

  // If snap should be active then add snap internactions for all snap layers
  hasSnap = editLayer.get('snap');
  if (hasSnap) {
    const selectionSource = featureInfo.getSelectionLayer().getSource();
    const snapSources = editLayer.get('snapLayers') ? getSnapSources(editLayer.get('snapLayers')) : [editLayer.get('source')];
    snapSources.push(selectionSource);
    snap = addSnapInteraction(snapSources);
  }
}

function setEditLayer(layerName) {
  currentLayer = layerName;
  setInteractions();
}

function setGeometryProps(layer) {
  const layerName = layer.get('name');
  editLayers[layerName].set('geometryType', layer.getSource().getFeatures()[0].getGeometry().getType());
  if (layerName === currentLayer) {
    setEditLayer(layerName);
  }
}

function addFeatureAddListener(layerName) {
<<<<<<< HEAD:src/editor/edithandler.js
  var layer = viewer.getLayer(layerName);
  layer.getSource().once('addfeature', function (e) {
=======
  const layer = viewer.getLayer(layerName);
  layer.getSource().once('addfeature', () => {
>>>>>>> origin:src/controls/editor/edithandler.js
    setGeometryProps(layer);
  });
}

function verifyLayer(layerName) {
  if (!(editLayers[layerName].get('geometryType'))) {
    addFeatureAddListener(layerName);
  }
}

function setEditProps(options) {
<<<<<<< HEAD:src/editor/edithandler.js
  var initialValue = {};
  var result = editableLayers.reduce(function (layerProps, layerName) {
    var layer = viewer.getLayer(layerName);
    var snap = options.hasOwnProperty('snap') ? options.snap : true;
    var snapLayers = options.snapLayers || editableLayers;
=======
  const initialValue = {};
  const result = editableLayers.reduce((layerProps, layerName) => {
    const layer = viewer.getLayer(layerName);
    const layerProperties = layerProps;
    const snapLayers = options.snapLayers || editableLayers;
    snap = 'snap' in options ? options.snap : true;
>>>>>>> origin:src/controls/editor/edithandler.js
    layer.set('snap', snap);
    layer.set('snapLayers', snapLayers);
    layerProperties[layerName] = layer;
    return layerProps;
  }, initialValue);
  return result;
}

function onDeleteSelected() {
  const features = select.getFeatures();

  // Make sure all features are loaded in the source
  editSource = editLayers[currentLayer].getSource();
  if (features.getLength() === 1) {
    const feature = features.item(0);
    const r = confirm('Är du säker på att du vill ta bort det här objektet?');
    if (r === true) {
      saveFeature({
        feature,
        layerName: currentLayer,
        action: 'delete'
      });
      select.getFeatures().clear();
      editSource.removeFeature(editSource.getFeatureById(feature.getId()));
    }
  }
}

function startDraw() {
  if (hasDraw !== true && isActive()) {
    setActive('draw');
    hasDraw = true;
    dispatcher.emitChangeEdit('draw', true);
  }
}

function cancelDraw() {
  setActive();
  hasDraw = false;
  dispatcher.emitChangeEdit('draw', false);
}

function onChangeShape(e) {
  setInteractions(e.shape);
  startDraw();
}

function cancelAttribute() {
  modal.closeModal();
  dispatcher.emitChangeEdit('attribute', false);
}

<<<<<<< HEAD:src/editor/edithandler.js
function onAttributesSave(feature, attributes) {
  $('#o-save-button').on('click', function (e) {
    var editEl = {};
    var fileReader;
    var imageData;
    var input;
    var file;
    var orientation;

    //Read values from form
    attributes.forEach(function (attribute) {
=======
function attributesSaveHandler(feature, formEl) {
  // get DOM values and set attribute values to feature
  attributes.forEach((attribute) => {
    if (Object.prototype.hasOwnProperty.call(formEl, attribute.name)) {
      feature.set(attribute.name, formEl[attribute.name]);
    }
  });
  saveFeature({
    feature,
    layerName: currentLayer,
    action: 'update'
  });
}

function onAttributesSave(feature, attrs) {
  $('#o-save-button').on('click', (e) => {
    const editEl = {};
    let fileReader;
    let input;
    let file;
>>>>>>> origin:src/controls/editor/edithandler.js

    // Read values from form
    attrs.forEach((attribute) => {
      // Get the input container class
      const containerClass = `.${attribute.elId.slice(1)}`;

      // If hidden element it should be excluded
      if ($(containerClass).hasClass('o-hidden') === false) {
        // Check if checkbox. If checkbox read state.
        if ($(attribute.elId).attr('type') === 'checkbox') {
          editEl[attribute.name] = $(attribute.elId).is(':checked') ? 1 : 0;
        } else { // Read value from input text, textarea or select
          editEl[attribute.name] = $(attribute.elId).val();
        }
      }
      // Check if file. If file, read and trigger resize
      if ($(attribute.elId).attr('type') === 'file') {
        input = $(attribute.elId)[0];
        file = input.files[0];

        if (file) {
          fileReader = new FileReader();
<<<<<<< HEAD:src/editor/edithandler.js
          fileReader.onload = function () {
            getImageOrientation(file, function (orientation) {
              imageresizer(fileReader.result, attribute, orientation, function (resized) {
=======
          fileReader.onload = () => {
            getImageOrientation(file, (orientation) => {
              imageresizer(fileReader.result, attribute, orientation, (resized) => {
>>>>>>> origin:src/controls/editor/edithandler.js
                editEl[attribute.name] = resized;
                $(document).trigger('imageresized');
              });
            });
          };

          fileReader.readAsDataURL(file);
        } else {
          editEl[attribute.name] = $(attribute.elId).attr('value');
        }
      }
    });

<<<<<<< HEAD:src/editor/edithandler.js
    if (fileReader && fileReader.readyState == 1) {
      $(document).on('imageresized', function () {
=======
    if (fileReader && fileReader.readyState === 1) {
      $(document).on('imageresized', () => {
>>>>>>> origin:src/controls/editor/edithandler.js
        attributesSaveHandler(feature, editEl);
      });
    } else {
      attributesSaveHandler(feature, editEl);
    }

    modal.closeModal();
    $('#o-save-button').blur();
    e.preventDefault();
  });
}

<<<<<<< HEAD:src/editor/edithandler.js
function attributesSaveHandler(feature, formEl) {

  //get DOM values and set attribute values to feature
  attributes.forEach(function (attribute) {
    if (formEl.hasOwnProperty(attribute.name)) {
      feature.set(attribute.name, formEl[attribute.name]);
    }
  });
  saveFeature({
    feature: feature,
    layerName: currentLayer,
    action: 'update'
  });
}

function removeInteractions() {
  if (isActive()) {
    map.removeInteraction(modify);
    map.removeInteraction(select);
    map.removeInteraction(draw);
    if (snap) {
      snap.forEach(function (snapInteraction) {
        map.removeInteraction(snapInteraction);
      });
    }

    modify = undefined;
    select = undefined;
    draw = undefined;
    snap = undefined;
  }
}

function startDraw() {
  if (hasDraw !== true && isActive()) {
    setActive('draw');
    hasDraw = true;
    dispatcher.emitChangeEdit('draw', true);
  }
}

function addListener() {
  var fn = function (obj) {
    $(obj.elDependencyId).on(obj.eventType, function (e) {
      var containerClass = '.' + obj.elId.slice(1);
      if ($(obj.elDependencyId + (' option:selected')).text() === obj.requiredVal) {
=======
function addListener() {
  const fn = (obj) => {
    $(obj.elDependencyId).on(obj.eventType, () => {
      const containerClass = `.${obj.elId.slice(1)}`;
      if ($(`${obj.elDependencyId} option:selected`).text() === obj.requiredVal) {
>>>>>>> origin:src/controls/editor/edithandler.js
        $(containerClass).removeClass('o-hidden');
      } else {
        $(containerClass).addClass('o-hidden');
      }
    });
  };

  return fn;
}

function addImageListener() {
<<<<<<< HEAD:src/editor/edithandler.js
  var fn = function (obj) {
    var fileReader = new FileReader();
    var containerClass = '.' + obj.elId.slice(1);
    $(obj.elId).on('change', function (e) {
      $(containerClass + ' img').removeClass('o-hidden');
      $(containerClass + ' input[type=button]').removeClass('o-hidden');
=======
  const fn = (obj) => {
    const fileReader = new FileReader();
    const containerClass = `.${obj.elId.slice(1)}`;
    $(obj.elId).on('change', () => {
      $(`${containerClass} img`).removeClass('o-hidden');
      $(`${containerClass} input[type=button]`).removeClass('o-hidden');
>>>>>>> origin:src/controls/editor/edithandler.js

      if (this.files && this.files[0]) {
        fileReader.onload = (e) => {
          $(`${containerClass} img`).attr('src', e.target.result);
        };

        fileReader.readAsDataURL(this.files[0]);
      }
    });

<<<<<<< HEAD:src/editor/edithandler.js
    $(containerClass + ' input[type=button]').on('click', function (e) {
=======
    $(`${containerClass} input[type=button]`).on('click', () => {
>>>>>>> origin:src/controls/editor/edithandler.js
      $(obj.elId).attr('value', '');
      $(`${containerClass} img`).addClass('o-hidden');
      $(this).addClass('o-hidden');
    });
  };

  return fn;
}

<<<<<<< HEAD:src/editor/edithandler.js
function onToggleEdit(e) {
  e.stopPropagation();
  if (e.tool === 'draw') {
    if (hasDraw === false) {
      setInteractions();
      startDraw();
    } else {
      cancelDraw();
    }
  } else if (e.tool === 'attribute') {
    if (hasAttribute === false) {
      editAttributes();
    } else {
      cancelAttribute();
    }
  } else if (e.tool === 'delete') {
    onDeleteSelected();
  } else if (e.tool === 'edit') {
    setEditLayer(e.currentLayer);
  } else if (e.tool === 'cancel') {
    removeInteractions();
  } else if (e.tool === 'save') {
    saveFeatures();
  }
}

function onChangeEdit(e) {
  if (e.tool !== 'draw' && e.active) {
    cancelDraw();
  }
}

function getSnapSources(layers) {
  var sources = layers.map(function (layer) {
    return viewer.getLayer(layer).getSource();
  });

  return sources;
}

function addSnapInteraction(sources) {
  var snapInteractions = [];
  sources.forEach(function (source) {
    var interaction = new ol.interaction.Snap({
      source: source
    });
    snapInteractions.push(interaction);
    map.addInteraction(interaction);
  });
  return snapInteractions;
}

function setActive(editType) {
  switch (editType) {
    case 'modify':
      draw.setActive(false);
      modify.setActive(true);
      select.setActive(true);
      break;
    case 'draw':
      draw.setActive(true);
      modify.setActive(true);
      select.setActive(false);
      break;
    default:
      draw.setActive(false);
      hasDraw = false;
      modify.setActive(true);
      select.setActive(true);
      break;
  }
}

function editAttributes(feature) {
  var attributeObjects;
  var features;
=======
function editAttributes(feat) {
  let feature = feat;
  let attributeObjects;
  let features;
>>>>>>> origin:src/controls/editor/edithandler.js

  // Get attributes from the created, or the selected, feature and fill DOM elements with the values
  if (feature) {
    features = new Collection();
    features.push(feature);
  } else {
    features = select.getFeatures();
  }
  if (features.getLength() === 1) {
    dispatcher.emitChangeEdit('attribute', true);
    feature = features.item(0);
    if (attributes.length > 0) {
<<<<<<< HEAD:src/editor/edithandler.js

      //Create an array of defined attributes and corresponding values from selected feature
      attributeObjects = attributes.map(function (attributeObject) {
        var obj = {};
=======
      // Create an array of defined attributes and corresponding values from selected feature
      attributeObjects = attributes.map((attributeObject) => {
        const obj = {};
>>>>>>> origin:src/controls/editor/edithandler.js
        $.extend(obj, attributeObject);
        obj.val = feature.get(obj.name) || '';
        if ('constraint' in obj) {
          const constraintProps = obj.constraint.split(':');
          if (constraintProps.length === 3) {
            obj.eventType = constraintProps[0];
            obj.dependencyVal = feature.get(constraintProps[1]);
            obj.requiredVal = constraintProps[2];
            obj.isVisible = obj.dependencyVal === obj.requiredVal;
            obj.addListener = addListener();
            obj.elId = `#input-${obj.name}-${obj.requiredVal}`;
            obj.elDependencyId = `#input-${constraintProps[1]}`;
          } else {
            alert('Villkor verkar inte vara rätt formulerat. Villkor formuleras enligt principen change:attribute:value');
          }
        } else if (obj.type === 'image') {
          obj.isVisible = true;
          obj.elId = `#input-${obj.name}`;
          obj.addListener = addImageListener();
        } else if (obj.type === 'pageid') {
          obj.elId = '#input-' + obj.name;
        } else {
          obj.isVisible = true;
          obj.elId = `#input-${obj.name}`;
        }

        obj.formElement = editForm(obj);
        return obj;
      });
    }
<<<<<<< HEAD:src/editor/edithandler.js
    var formElement = attributeObjects.reduce(function (prev, next) {
      return prev + next.formElement;
    }, '');
    var form = '<form>' + formElement + '<br><div class="o-form-save"><input id="o-save-button" type="button" value="Ok"></input></div></form>';
    modal.createModal('#o-map', {
      title: title,
=======

    const formElement = attributeObjects.reduce((prev, next) => prev + next.formElement, '');
    const form = `<form>${formElement}<br><div class="o-form-save"><input id="o-save-button" type="button" value="Ok"></input></div></form>`;

    modal = Modal({
      title,
>>>>>>> origin:src/controls/editor/edithandler.js
      content: form,
      static: true,
      target: viewer.getId()
    });

<<<<<<< HEAD:src/editor/edithandler.js
    attributeObjects.forEach(function (obj) {
      if (obj.hasOwnProperty('addListener')) {
=======
    attributeObjects.forEach((obj) => {
      if ('addListener' in obj) {
>>>>>>> origin:src/controls/editor/edithandler.js
        obj.addListener(obj);
      }
    });

    onAttributesSave(feature, attributeObjects);
  }
}

function onToggleEdit(e) {
  e.stopPropagation();
  if (e.tool === 'draw') {
    if (hasDraw === false) {
      setInteractions();
      startDraw();
    } else {
      cancelDraw();
    }
  } else if (e.tool === 'attribute') {
    if (hasAttribute === false) {
      editAttributes();
    } else {
      cancelAttribute();
    }
  } else if (e.tool === 'delete') {
    onDeleteSelected();
  } else if (e.tool === 'edit') {
    setEditLayer(e.currentLayer);
  } else if (e.tool === 'cancel') {
    removeInteractions();
  } else if (e.tool === 'save') {
    saveFeatures();
  }
}

<<<<<<< HEAD:src/editor/edithandler.js
function saveFeatures() {
  var edits = editsStore.getEdits();
  var layerNames = Object.getOwnPropertyNames(edits);
  layerNames.forEach(function (layerName) {
    var transaction = {
      insert: null,
      delete: null,
      update: null
    };
    var editTypes = Object.getOwnPropertyNames(edits[layerName]);
    editTypes.forEach(function (editType) {
      var layer = viewer.getLayer(layerName);
      var ids = edits[layerName][editType];
      var features;
      features = getFeaturesByIds(editType, layer, ids);
      if (features.length) {
        transaction[editType] = features;
      }
    });

    transactionHandler(transaction, layerName);
  });
}

function getFeaturesByIds(type, layer, ids) {
  var source = layer.getSource();
  var features = [];
  if (type === 'delete') {
    ids.forEach(function (id) {
      var dummy = new ol.Feature();
      dummy.setId(id);
      features.push(dummy);
    });
  } else {
    ids.forEach(function (id) {
      var feature;
      if (source.getFeatureById(id)) {
        feature = source.getFeatureById(id);
        feature.unset('bbox');
        features.push(feature);
      }
    });
  }
=======
function onChangeEdit(e) {
  if (e.tool !== 'draw' && e.active) {
    cancelDraw();
  }
}

export default function editHandler(options, v) {
  viewer = v;
  featureInfo = viewer.getControlByName('featureInfo');
  map = viewer.getMap();
  currentLayer = options.currentLayer;
  editableLayers = options.editableLayers;
>>>>>>> origin:src/controls/editor/edithandler.js

  // set edit properties for editable layers
  editLayers = setEditProps(options);
  editableLayers.forEach((layerName) => {
    verifyLayer(layerName);
    if (layerName === currentLayer && options.isActive) {
      dispatcher.emitEnableInteraction();
      setEditLayer(layerName);
    }
  });

<<<<<<< HEAD:src/editor/edithandler.js
function getDefaultValues(attributes) {
  return attributes.filter(function (attribute) {
      if (attribute.name && attribute.defaultValue) {
        return attribute;
      }
    })
    .reduce(function (prev, curr) {
      prev[curr.name] = curr.defaultValue
      return prev;
    }, {});
}
=======
  autoSave = options.autoSave;
  autoForm = options.autoForm;
  $(document).on('toggleEdit', onToggleEdit);
  $(document).on('changeEdit', onChangeEdit);
  $(document).on('editorShapes', onChangeShape);
}
>>>>>>> origin:src/controls/editor/edithandler.js
