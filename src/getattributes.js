import featureinfotemplates from './featureinfotemplates';
import replacer from '../src/utils/replacer';
import geom from './geom';

<<<<<<< HEAD
module.exports = function (feature, layer) {
  var content = '<div><ul>';
  var attribute, li = '',
    title, val;
  //If layer is configured with attributes
  if (layer.get('attributes')) {
    //If attributes is string then use template named with the string
    if (typeof layer.get('attributes') === 'string') {
      //Use attributes with the template
      li = featureinfotemplates(layer.get('attributes'), feature.getProperties());
    } else {
      for (var i = 0; i < layer.get('attributes').length; i++) {
        attribute = layer.get('attributes')[i];
        title = '';
        val = '';
        if (attribute['name']) {
          if (feature.get(attribute['name'])) {
            val = feature.get(attribute['name']);
            if (attribute['title']) {
              title = '<b>' + attribute['title'] + '</b>';
            }
            if (attribute['url']) {
              if (feature.get(attribute['url'])) {
                var url = createUrl(attribute['urlPrefix'], attribute['urlSuffix'], replacer.replace(feature.get(attribute['url']), feature.getProperties()));
                val = '<a href="' + url + '" target="_blank">' +
                  feature.get(attribute['name']) +
                  '</a>';
              }
            }
          }
        } else if (attribute['url']) {
          if (feature.get(attribute['url'])) {
            var text = attribute['html'] || attribute['url'];
            var url = createUrl(attribute['urlPrefix'], attribute['urlSuffix'], replacer.replace(feature.get(attribute['url']), feature.getProperties()));
            val = '<a href="' + url + '" target="_blank">' +
              text +
              '</a>';
          }
        } else if (attribute['img']) {
          if (feature.get(attribute['img'])) {
            var url = createUrl(attribute['urlPrefix'], attribute['urlSuffix'], replacer.replace(feature.get(attribute['img']), feature.getProperties()));
            var attribution = attribute['attribution'] ? '<div class="o-image-attribution">' + attribute['attribution'] + '</div>' : '';
            val = '<div class="o-image-container">' +
              '<img src="' + url + '">' + attribution +
              '</div>';
          }
        } else if (attribute['html']) {
          val = replacer.replace(attribute['html'], feature.getProperties(), {
            helper: geom,
            helperArg: feature.getGeometry()
          });
        }
        var cls = ' class="' + attribute['cls'] + '" ' || '';
        // Reacting to isVisible handler.
        if (attribute['cls'] === undefined && attribute['isVisible'] === undefined) {
          cls = ' class="" ';
        } else if (attribute['cls'] === undefined && !attribute['isVisible']) {
          cls = ' class="o-hidden" ' || '';
        }
        li += '<li' + cls + '>' + title + val + '</li>';
      }
    }
  } else {
    //Clean feature attributes from non-wanted properties
    var attributes = filterObject(feature.getProperties(), ['FID_', 'geometry']);
    //Use attributes with the template
    li = featureinfotemplates('default', attributes);
  }
  content += li + '</ul></div>';
  return content;
}

function filterObject(obj, excludedKeys) {
  var result = {},
    key;
  for (key in obj) {
    if (excludedKeys.indexOf(key) === -1) {
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
=======
function createUrl(prefix, suffix, url) {
  const p = prefix || '';
  const s = suffix || '';
  return p + url + s;
}

export default function (feature, layer, map) {
  const attributes = feature.getProperties();
  const geometryName = feature.getGeometryName();
  delete attributes[geometryName];
  let content = '<div class="o-identify-content"><ul>';
  let attribute;
  let li = '';
  let title;
  let val;
  // If layer is configured with attributes
  if (layer.get('attributes')) {
    // If attributes is string then use template named with the string
    if (typeof layer.get('attributes') === 'string') {
      // Use attributes with the template
      li = featureinfotemplates(layer.get('attributes'), attributes);
    } else {
      for (let i = 0; i < layer.get('attributes').length; i += 1) {
        attribute = layer.get('attributes')[i];
        title = '';
        val = '';
        if (attribute.name) {
          if (feature.get(attribute.name)) {
            val = feature.get(attribute.name);
            if (attribute.title) {
              title = `<b>${attribute.title}</b>`;
            }
            if (attribute.url) {
              if (feature.get(attribute.url)) {
                const url = createUrl(attribute.urlPrefix, attribute.urlSuffix, replacer.replace(feature.get(attribute.url), feature.getProperties(), null, map));
                val = `<a href="${url}" target="_blank">
                  ${feature.get(attribute.name)}
                  </a>`;
              }
            }
          }
        } else if (attribute.url) {
          if (feature.get(attribute.url)) {
            const text = attribute.html || attribute.url;
            const url = createUrl(attribute.urlPrefix, attribute.urlSuffix, replacer.replace(feature.get(attribute.url), attributes, null, map));
            val = `<a href="${url}" target="_blank">
              ${text}
              </a>`;
          }
        } else if (attribute.img) {
          if (feature.get(attribute.img)) {
            const url = createUrl(attribute.urlPrefix, attribute.urlSuffix, replacer.replace(feature.get(attribute.img), attributes, null, map));
            const attribution = attribute.attribution ? `<div class="o-image-attribution">${attribute.attribution}</div>` : '';
            val = `<div class="o-image-container">
              <img src="${url}">${attribution}
              </div>`;
          }
        } else if (attribute.html) {
          val = replacer.replace(attribute.html, attributes, {
            helper: geom,
            helperArg: feature.getGeometry()
          }, map);
        }

        const cls = ` class="${attribute.cls}" ` || '';

        li += `<li${cls}>${title}${val}</li>`;
      }
    }
  } else {
    // Use attributes with the template
    li = featureinfotemplates('default', attributes);
  }
  content += `${li}</ul></div>`;
  return content;
}
>>>>>>> origin
