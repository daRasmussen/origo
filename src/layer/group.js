import layerGroup from 'ol/layer/Group';
import $ from 'jquery';

const group = function group(layerOptions) {
  const groupDefault = {
    layerType: 'group',
    styleName: 'default'
  };
  const groupOptions = $.extend(groupDefault, layerOptions);
  return new layerGroup(groupOptions);
};

export default group;
