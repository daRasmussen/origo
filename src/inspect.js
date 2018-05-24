/**
 * Returns an object as a String representation.
 * @param {[Object]} v Object name.
 * @return {[String]} Object as string.
 */
function objectToString(v) {
  return String('[' + v + ']');
}
/**
 * Checks property and returns default values.
 * @param {Object} o Target object.
 * @param {String} p Target property.
 * @param {String} v Target value.
 * @return {Boolean} is property set true or false.
 */
function hasNameWarning(o, p, v) {
  return o.hasOwnProperty('name') ? console.warn('The ' + o.name + ' property ' + p + ' is unset. A default value has been set to ' + objectToString(v) + '.') : console.warn('The property ' + p + ' is unset. A default value has been set to ' + objectToString(v) + '.');
}
/**
 * Sets the parameter value and detects if inspection is enabled and warns user with a prompt.
 * @param {Object} obj  Target object.
 * @param {String} prop Target property.
 * @param {String} val  Target value.
 * @param {Boolean} warn should user be prompted?
 * @returns {Object} object with the new value.
 */
module.exports = function (obj, prop, val, warn) {
  if (!obj.hasOwnProperty(prop)) {
    if (warn) {
      hasNameWarning(obj, prop, val);
    }
    return val;
  }
  return obj[prop];
};
