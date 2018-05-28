var featureinfo = require('./featureinfo');
var ol = require('openlayers')
var ll = {
  "selection": {
    "selected": {
      "feature": null,
      "features": []
    }
  }
}
function init() {
   ll.selection.selected.feature = featureinfo.getSelectedFeature();
   console.log('init', ll.selection.selected.feature);
}
function set(f) {
  ll.selection.selected.feature = f;
  console.log('set', ll.selection.selected.feature);
}
function push(f) {
  ll.selection.selected.features.push(f);
}
function update() {
  ll.selection.selected.feature = featureinfo.getSelectedFeature();
  console.log('update', ll.selection.selected.feature);
}
function getLL() {
  return ll;
}
function identifyObjects() {

}
function findObjects() {

}
function getAndamal() {

}
function getGeometries() {

}
function identify() {

}
function toArrenden(){

}
function show() {

}
function toObject () {

}
function digit() {

}
function digitizeStart() {

}
function digitizeEnd() {

}
function digitizeUpdate() {

}
function digitizeAbort() {

}
function search() {

}
function merge() {

}
function geometryUpdate() {

}
function getTrustees() {

}
function getObjects() {

}
function getObject() {

}
function goTo() {

}
module.exports.init = init;
module.exports.set = set;
module.exports.push = push;
module.exports.update = update;
module.exports.getLL = getLL;
module.exports.ideentifyObject = identifyObjects;
module.exports.findObjects = findObjects;
module.exports.getAndamal = getAndamal;
module.exports.getGeometries = getGeometries;
module.exports.identify = identify;
module.exports.toArrenden = toArrenden;
module.exports.show = show;
module.exports.toObject = toObject;
module.exports.digit = digit;
module.exports.digitizeStart = digitizeStart;
module.exports.digitizeEnd = digitizeEnd
module.exports.digitizeUpdate = digitizeUpdate;
module.exports.digitizeAbort = digitizeAbort;
module.exports.search = search;
module.exports.merge = merge;
module.exports.geometryUpdate = geometryUpdate;
module.exports.getTrustees = getTrustees;
module.exports.getObjects = getObjects;
module.exports.getObject = getObject;
module.exports.goTo = goTo;
