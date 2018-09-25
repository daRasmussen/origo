import 'babel-polyfill';
import isEmpty from './isEmpty';
import fling from './fling';
import getList from '../getList';

/**
 * Picks attributes from response based and returns a new fature.
 * If no attributes are specified it adds all attributes.
 * @param {ol.feature} feature
 * @param {json} response
 * @param {json} attributes
 */

const pick = function pick(feature, response, attributes) {
  if (isEmpty(attributes)) return feature.setProperties(response);
  attributes.forEach((attribute) => {
    const name = attribute.name;
    const title = attribute.title;
    const o = {};
    o[title] = response[name];
    feature.setProperties(o);
  });
  return feature;
};

/**
 * Takes sources and a feature and awauts fetched data from sources.
 * @param {*} feature
 * @param {*} sources
 */

const asyncReq = function asyncReq(feature, sources) {
  let temp = feature;
  sources.forEach((source) => {
    const config = source.config;
    const options = config.fetch;
    const attributes = config.attributes || {};
    const url = config.url;
    const value = feature.get(config.connect);
    const location = url + value;
    fling.request(location, options).then((responses) => {
      responses.forEach((response) => {
        temp = pick(feature, response, attributes);
      });
    }).catch(error => fling.fetchError(error));
  });
  return temp;
};

/**
 * Takes sources and a feature and fetches data from sources.
 * @param {*} feature
 * @param {*} sources
 */

const syncReq = function syncReq(feature, sources) {
  let temp = feature;
  sources.forEach((source) => {
    const config = source.config;
    const options = config.fetch;
    const attributes = config.attributes || {};
    const url = config.url;
    const value = feature.get(config.connect);
    const location = url + value;
    fling.get(location, options).then((responses) => {
      responses.forEach((response) => {
        temp = pick(feature, response, attributes);
      });
    });
  });
  return temp;
};

/**
 * Makes a async fetch, awaits response and adds new properties
 * else returns feature if sources is not defined.
 * @param {*} feature
 * @param {*} sources
 */

const update = function update(feature, sources) {
  if (isEmpty(sources)) return feature;
  return asyncReq(feature, sources);
};

/**
 * Makes a fetch and adds new properties
 * else returns a unchanged feature if sources is not defined.
 * @param {*} feature
 * @param {*} sources
 */

const find = function find(feature, sources) {
  if (isEmpty(sources)) return feature;
  return syncReq(feature, sources);
};

/**
 * Updates multiple results. 
 * @param {*} results 
 * @param {*} identifyTarget 
 * @param {*} coordinate 
 * @param {*} selectionLayer 
 * @param {*} identify 
 */
async function updateResults(results, identifyTarget, coordinate, selectionLayer, identify) {
  try {
    await results.forEach((result) => {
      const res = result;
      const feature = result.feature;
      const sources = feature.sources;
      sources.forEach((source) => {
        const attributes = source.config.attributes;
        const empty = {};
        fling.translate(feature, source).then((responses) => {
          responses.forEach((response) => {
            attributes.forEach((sourceAttribute) => {
              const name = sourceAttribute.name; 
              const title = sourceAttribute.title; 
              empty[title] = response[name];
              feature.setProperties(empty);
            });
          });
        });
        res.content = getList(feature);
        selectionLayer.clear();
        return res;
      });
      identify(results, identifyTarget, coordinate);
    });
  } catch (err) {
    alert('There was an error fetching the data: \n', err);
  }
}
/**
 * 
 * @param {*} result 
 * @param {*} identifyTarget 
 * @param {*} coordinate 
 * @param {*} selectionLayer 
 * @param {*} identify 
 */
async function updateResult(result, identifyTarget, coordinate, selectionLayer, identify) {
  const all = result;
  try {
    const feature = result[0].feature;
    const source = feature.sources[0];
    const attributes = source.config.attributes;
    const newAttributes = {};
    await fling.translate(feature, source).then((data) => {
      data.forEach((res) => {
        attributes.forEach((sourceAttribute) => {
          const sourceAttributeName = sourceAttribute.name;
          const souceAttributeTitle = sourceAttribute.title;
          if (!feature.get(souceAttributeTitle)) {
            newAttributes[souceAttributeTitle] = res[sourceAttributeName];
            feature.setProperties(newAttributes);
          }
        });
      });
      all[0].content = getList(feature);
      selectionLayer.clear();
      identify(all, identifyTarget, coordinate);
    });
  } catch (err) {
    alert('There was an error fetching the data: \n', err);
  }
}

const sources = {
  find,
  update,
  updateResult,
  updateResults
};

export default sources;