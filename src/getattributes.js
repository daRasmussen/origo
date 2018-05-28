"use strict";
var featureinfotemplates = require('./featureinfotemplates');
var replacer = require('../src/utils/replacer');
var geom = require('./geom');
var ll = require('./landlord');

module.exports = function(feature, layer) {
    var content = '<div><ul>';
    var attribute, li = '', title, val;
    //If layer is configured with attributes
    if(layer.get('attributes')) {
          //If attributes is string then use template named with the string
          if(typeof layer.get('attributes') === 'string') {
              //Use attributes with the template
              li = featureinfotemplates(layer.get('attributes'),feature.getProperties());
          }
          else {
              for(var i=0; i<layer.get('attributes').length; i++) {
                attribute = layer.get('attributes')[i];
                title = '';
                val = '';
                if (attribute['name']) {
                  if(feature.get(attribute['name'])) {
                      val = feature.get(attribute['name']);
                      if (attribute['title']) {
                        title = '<b>' + attribute['title'] + '</b>';
                      }
                      if (attribute['url']) {
                        if(feature.get(attribute['url'])) {
                        var url = createUrl(attribute['urlPrefix'], attribute['urlSuffix'], replacer.replace(feature.get(attribute['url']), feature.getProperties()));
                        val = '<a href="' + url + '" target="_blank">' +
                              feature.get(attribute['name']) +
                              '</a>';
                        }
                      }
                  }
                }
                else if (attribute['url']) {
                    if(feature.get(attribute['url'])) {
                        var text = attribute['html'] || attribute['url'];
                        var url = createUrl(attribute['urlPrefix'], attribute['urlSuffix'], replacer.replace(feature.get(attribute['url']), feature.getProperties()));
                        val = '<a href="' + url + '" target="_blank">' +
                              text +
                              '</a>';
                    }
                }
                else if (attribute['img']) {
                    if(feature.get(attribute['img'])) {
                        var url = createUrl(attribute['urlPrefix'], attribute['urlSuffix'], replacer.replace(feature.get(attribute['img']), feature.getProperties()));
                        var attribution = attribute['attribution'] ? '<div class="o-image-attribution">' + attribute['attribution'] + '</div>' : '';
                        val = '<div class="o-image-container">' +
                                  '<img src="' + url + '">' + attribution +
                              '</div>';
                    }
                }
                else if (attribute['html']) {
                  val = replacer.replace(attribute['html'], feature.getProperties(), {
                    helper: geom,
                    helperArg: feature.getGeometry()
                  });
                } else if(attribute['LandLord']) {
                  var a = document.createElement("a");
                  var p = feature.getProperties();

                  ll.set(feature);

                  console.log(p)
                  console.log(ll.getLL().selection.selected.feature);

                  // console.log(getParams(feature.getProperties()))
                  // a.setAttribute("onclick", "openLandLord("+getParams(feature.getProperties())+")");
                  //console.log(typeof feature.getProperties());

                  a.setAttribute("onclick", "alert("+ll.getLL().selection.selected.feature.getProperties().OBJECTID+")");

                  var t = document.createTextNode("Visa i landlord");
                  a.appendChild(t);
                  val = a.outerHTML;
                }

                var cls = ' class="' + attribute['cls'] + '" ' || '';

                li += '<li' + cls +'>' + title + val + '</li>';
              }
        }
    }
    else {
      //Clean feature attributes from non-wanted properties
      var attributes = filterObject(feature.getProperties(), ['FID_', 'geometry']);
      //Use attributes with the template
      li = featureinfotemplates('default',attributes);
    }
    content += li + '</ul></div>';
    return content;
}
function getParams(o) {
  var all = [];
  for (var k in o) {
    if(!(o[k] instanceof Object)){
      all.push(isValid(o[k]));
    }
  }
  return all.join(',');
}
/**
 * [isValid description]
 * Is a function that returns a valid value, ret is return value that is set to -1 by default.
 * @param {[type]} value [description]
 * @param {[type]} ret   [description]
 * @return {Boolean} [description]
 */
function isValid(value, ret) {
  var r = ret !== undefined ? ret : -1;
  // console.log(typeof value, typeof value === "string", replaceD(value, '.', '_'))
  // console.log(replaceD(value, '.', '_'));
  return value === ' ' || value === null ? r : replaceD(value, '.', '') ;
}
function replaceD(v, f, t) {
  return typeof v === "string" ? v.split(f).join(t) : v;
}
function filterObject(obj, excludedKeys) {
    var result = {}, key;
    for (key in obj) {
        if(excludedKeys.indexOf(key) === -1) {
            result[key] = obj[key];
        }
    }
    return result;
}
function createUrl(prefix, suffix, url) {
    var p = prefix || '';
    var s = suffix || '';
    return p + url + s;
}
