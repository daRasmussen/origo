var viewer = require('./viewer');
var map = viewer.getMap();
function renderComplete(map){
  map.on('postrender', function(){
    console.log('Render Complete!');
  });
}
module.exports = renderComplete;
