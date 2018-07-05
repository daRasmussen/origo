'use strict';
var viewer = require('../../viewer');
var ol = require('openlayers');
var core = core || {};
core.util = core.util || {};
core.util.DRS = (function () {
  var makeDRS = function (pane, handle, opt) {
    var options = opt || {};
    // Minimum resizable area
    var minWidth 			= 60;
    var minHeight			= 40;

    // Thresholds
    var SNAP_MARGINS 		    = -(options.snapEdge || 5);
    var SNAP_FS_MARGINS 	  = -(options.snapFull || 100);
    var RESIZE_MARGIN_INNER = options.resizeOuterM || 5;
    var RESIZE_MARGIN_OUTER = options.resizeOuterM || 5;

    // End of what's configurable.
    var map = viewer.getMap();
    var onRightEdge;
    var onBottomEdge;
    var onLeftEdge;
    var onTopEdge;
    var rightScreenEdge;
    var bottomScreenEdge;
    var topScreenEdge;
    var leftScreenEdge;
    var e;
    var b;
    var x;
    var y;
    var inLR;
    var inTB;
    var preSnap;
    var clicked 			= null;
    var redraw 				= false;
    var _usePercent 	= false;  // Sets the init state of pane bounds type "%" of screen or fixed "px"

    // make sure pane has some required styles
    pane.style.boxSizing = 'border-box'; // includes border in w&h

    var parent = document.getElementById(pane.id).parentNode;

    // create ghostpane
    var ghostpane = document.createElement('div');
    ghostpane.id = 'DRSghost';
    parent.appendChild(ghostpane);

    // Setup drag handles
    var handles = handle instanceof Array ?  handle : [handle];
    var onHTMLhandle; 		// Holds result of event listeners for HTML handles

    function createHandleObjects() {
      b = b || pane.getBoundingClientRect();

      // Grab handles from dom if none are supplied
      if (!hasHTMLElement(handles)) {
        handles = handles.concat(
          [].slice.call(
            pane.getElementsByClassName('drag-area')));
      }

      // precess handles
      for (var i in handles) {
        // html
        if (handles[i] instanceof HTMLElement) {
          bindEvents(handles[i], 'mousedown touchstart', handleDown);
          bindEvents(handles[i], 'mouseup touchend', handleUp);
          handles[i] = {ele: handles[i], type: 'html'};

          // bounds object
        } else if (handles[i] instanceof Object) {
          handles[i] = {type: 'custom', coords: handles[i]};
          drawDragHandle(handles[i]);

          // preset strings
        } else {
          handles[i] = {type: handles[i]};
          drawDragHandle(handles[i]);
        }
      }
    }

    window.addEventListener('load', createHandleObjects());

    function handleDown() {onHTMLhandle = true;}

    function handleUp() {onHTMLhandle = false;}

    // core functions
    function setBounds(element, xx, yy, ww, hh) {
      var w = ww;
      var h = hh;
      if (xx === void 0) {
        b = b || pane.getBoundingClientRect();
        x = b.left;
        y = b.top;
        w = b.width;
        h = b.height;
      }
      var wh = convertUnits(w, h);
      element.style.left = xx + 'px';
      element.style.top = yy + 'px';
      element.style.width = wh[0];
      element.style.height = wh[1];
    }

    function getBounds() {
      var winW = window.innerWidth;
      var winH = window.innerHeight;
      var bounds = [];
      if (b.top < SNAP_FS_MARGINS || b.left < SNAP_FS_MARGINS ||
			b.right > winW - SNAP_FS_MARGINS || b.bottom > winH - SNAP_FS_MARGINS) {
        bounds = [0, 0, winW, winH];
      } else if (leftScreenEdge) {
        bounds = [0, 0, winW / 2, winH];
      } else if (rightScreenEdge) {
        bounds = [winW / 2, 0, winW / 2, winH];
      } else if (topScreenEdge) {
        bounds = [0, 0, winW, winH / 2];
      } else if (bottomScreenEdge) {
        bounds = [0, winH / 2, winW, winH / 2];
      }
      return bounds;
    }

    function convertUnits(w, h) {
      if (!_usePercent) {return [w + 'px', h + 'px'];}
      var pH;
      var pW;
      // use docWidth to take scroll bars into account!
      var docWidth = document.documentElement.clientWidth || document.body.clientWidth;
      pH = h / window.innerHeight * 100;
      pW = w / docWidth * 100;

      var r = [pW + '\%', pH + '\%'];
      return r;
    }

    function togglePercent(state) {
      _usePercent = state !== void 0 ? state : !_usePercent;
      setBounds(pane);
    }

    function snapFullScreen() {
      preSnap = {width: b.width, height: b.height, top: b.top, left: b.left};
      preSnap.to = [pane, 0, 0, window.innerWidth, window.innerHeight];
      setBounds.apply(this, preSnap.to);
    }

    function restorePreSnap() {
      if (!preSnap) return;
      var p = preSnap;
      setBounds(pane, p.left, p.top, p.width, p.height);
    }

    function hintHide() {
      setBounds(ghostpane, b.left, b.top, b.width, b.height);
      ghostpane.style.opacity = 0;
    }

    // Mouse events
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);

    // Touch events
    document.addEventListener('touchstart', onTouchDown);
    document.addEventListener('touchmove', onTouchMove);
    document.addEventListener('touchend', onTouchEnd);

    function onTouchDown() {
      onDown(e.touches[0]);
    }

    function onTouchMove() {
      onMove(e.touches[0]);
      if (clicked && (clicked.isMoving || clicked.isResizing)) {
        e.preventDefault();
        e.stopPropagation();
      }
    }

    function onTouchEnd() {
      if (e.touches.length === 0) onUp(e.changedTouches[0]);
    }

    function onMouseDown() {
      onDown(e);
    }

    function onDown() {
      calc(e);
      var isResizing = onRightEdge || onBottomEdge || onTopEdge || onLeftEdge;

      clicked = {
        x: x,
        y: y,
        cx: e.clientX,
        cy: e.clientY,
        w: b.width,
        h: b.height,
        isResizing: isResizing,
        isMoving: !isResizing && canMove(),
        onTopEdge: onTopEdge,
        onLeftEdge: onLeftEdge,
        onRightEdge: onRightEdge,
        onBottomEdge: onBottomEdge
      };
    }

    function canMove() {
      for (var i in handles) {
        if (handles[i]) {
          var h = drawDragHandle(handles[i]);
          var c = h.coords;
          var r = {};
          var yb = b.height - y;
          var xr = b.width - x;

          // determine bounds of click area coordinates
          if (c.bottom !== null && c.bottom !== void 0) { r.bottom = yb < c.height || (!c.height && y > c.top) && yb > c.bottom && inLR; }
          if (c.top !== null && c.top !== void 0) { r.top = y < c.height || (!c.height && yb > c.bottom) && y > c.top && inLR; }
          if (c.right !== null && c.right !== void 0) { r.right = xr < c.width || (!c.width && x > c.left) && xr > c.right && inTB; }
          if (c.left !== null && c.left !== void 0) { r.left = x < c.width || (!c.width && xr > c.right) && x > c.left && inTB; }

          var result = ((r.bottom || r.top) && r.left && r.right) ||
            ((r.left || r.right) && r.bottom && r.top);

          if (c.invert && !result || onHTMLhandle) return true;
          else if (result || onHTMLhandle) return true;
        }
      }
      return false;
    }

    function drawDragHandle(h) {
      var c = getHandleCoords(h);
      if (h.type === 'html') return h;
      if (h.coords.hide) return h;
      if (!h.drawn) {
        e = document.createElement('div');
        e.className = 'drag-area';
        e.style.position = 'absolute';
        e.style.pointerEvents = 'all';
        e.style.overflow = 'hidden';
        pane.appendChild(e);
        h.drawn = true;
        h.ele = e;
      }

      if ( c.bottom !== null )	h.ele.style.bottom  = 	c.bottom 	+ 'px';
      if ( c.right  !== null )	h.ele.style.right 	= 	c.right 	+ 'px';
      if ( c.top		!== null )	h.ele.style.top 	  = 	c.top 		+ 'px';
      if ( c.left 	!== null )	h.ele.style.left 	  = 	c.left 		+ 'px';
      if ( c.height !== null )	h.ele.style.height 	= 	c.height	+ 'px';
      if ( c.width 	!== null )	h.ele.style.width 	= 	c.width		+ 'px';
      return h;
    }

    function getHandleCoords(h) {
      var DO = 30;
      var types = {
        top: {top: 0, 	bottom: null,	left: 0, 	right: 0, 	width: null, height: DO, 		invert: false},
        bottom: {top: null, 	bottom: 0, 		left: 0, 	right: 0, 	width: null, height: DO, 		invert: false},
        left: {top: 0, 	bottom: 0, 		left: 0, 	right: null, width: DO, 	height: null, 	invert: false},
        right: {top: 0, 	bottom: 0, 		left: null, 	right: 0, 	width: DO, 	height: null, 	invert: false},
        full: {top: 0, 	bottom: 0, 		left: 0, 	right: 0, 	width: null, height: null, 	invert: false},
        20: {top: 20, 	bottom: 20, 		left: 20, 	right: 20, 	width: null, height: null, 	invert: false},
        none:	{top: null, 	bottom: null,	left: null, 	right: null, width: null, height: null, 	invert: false}
      };
      if (h.type instanceof Array) {h.coords = h.type;} else if (h.type === 'html') {h.coords = h.ele.getBoundingClientRect();} else if (!h.type) {h.type = 'full';}
      if (!h.coords) {
        h.coords = types[h.type.split(' ')[0]];
        h.coords.invert = h.type.indexOf('invert') + 1;
        h.coords.hide = h.type.indexOf('hide') + 1;
      }
      return h.coords;
    }
    function setDragPan(active) {
      map.getInteractions().forEach(function (interaction) {
        if (interaction instanceof ol.interaction.DragPan) {
          interaction.setActive(active);
        }
      }, this);
    }
    function calc(ed) {
      b = pane.getBoundingClientRect();
      x = ed.clientX - b.left;
      y = ed.clientY - b.top;

      // define inner and outer margins
      var dMi = RESIZE_MARGIN_INNER;
      var dMo = -RESIZE_MARGIN_OUTER;
      var rMi = b.width - RESIZE_MARGIN_INNER;
      var rMo = b.width + RESIZE_MARGIN_OUTER;
      var bMi = b.height - RESIZE_MARGIN_INNER;
      var bMo = b.height + RESIZE_MARGIN_OUTER;
      inLR = x > dMo && x < rMo;
      inTB = y > dMo && y < bMo;

      onTopEdge 		= y <= dMi 	&& y > dMo && inLR;
      onLeftEdge 		= x <= dMi 	&& x > dMo && inTB;
      onBottomEdge 	= y >= bMi 	&& y < bMo && inLR;
      onRightEdge 	= x >= rMi	&& x < rMo && inTB;

      rightScreenEdge 	= b.right > window.innerWidth - SNAP_MARGINS;
      bottomScreenEdge 	= b.bottom > window.innerHeight - SNAP_MARGINS;
      topScreenEdge 		= b.top < SNAP_MARGINS;
      leftScreenEdge 		= b.left < SNAP_MARGINS;
    }

    function onMove(ee) {
      calc(ee);
      e = ee;
      redraw = true;
    }

    function animate() {
      requestAnimationFrame(animate);

      if (!redraw) return;

      redraw = false;
      setDragPan(true);

      // resizeing
      if (clicked && clicked.isResizing) {
        setDragPan(false);
        if (clicked.onRightEdge) {pane.style.width = Math.max(x, minWidth) + 'px';}
        if (clicked.onBottomEdge) {pane.style.height = Math.max(y, minHeight) + 'px';}
        if (clicked.onLeftEdge) {
          var currentWidth = Math.max(clicked.cx - e.clientX + clicked.w, minWidth);
          if (currentWidth > minWidth) {
            pane.style.width = currentWidth + 'px';
            pane.style.left = e.clientX + 'px';
          }
        }
        if (clicked.onTopEdge) {
          var currentHeight = Math.max(clicked.cy - e.clientY + clicked.h, minHeight);
          if (currentHeight > minHeight) {
            pane.style.height = currentHeight + 'px';
            pane.style.top = e.clientY + 'px';
          }
        }

        hintHide();
        return;
      }

      if (clicked && clicked.isMoving) {
        var bounds = getBounds();

        // Set bounds of ghost pane
        if (bounds.length) {
          bounds.unshift(ghostpane);
          setBounds.apply(this, bounds);
          ghostpane.style.opacity = 0.2;
        } else {
          hintHide();
        }

        // Unsnap with drag, set bounds to preSnap bounds
        if (preSnap) {
          preSnap.draged = true;
          setBounds(pane,
            e.clientX - preSnap.width / 2,
            e.clientY - Math.min(clicked.y, preSnap.height),
            preSnap.width,
            preSnap.height
          );
          return;
        }

        // moving
        pane.style.top = (e.clientY - clicked.y) + 'px';
        pane.style.left = (e.clientX - clicked.x) + 'px';

        return;
      }

      // This code executes when mouse moves without clicking

      // style cursor
      var db = document.documentElement || document.body;
      if (onRightEdge && onBottomEdge || onLeftEdge && onTopEdge) {
        db.style.cursor = 'nwse-resize';
      } else if (onRightEdge && onTopEdge || onBottomEdge && onLeftEdge) {
        db.body.style.cursor = 'nesw-resize';
      } else if (onRightEdge || onLeftEdge) {
        db.style.cursor = 'ew-resize';
      } else if (onBottomEdge || onTopEdge) {
        db.style.cursor = 'ns-resize';
      } else if (canMove()) {
        db.style.cursor = 'move';
      } else {
        db.style.cursor = 'default';
      }
    }

    animate();

    function onUp(ed) {
      calc(ed);

      if (clicked && clicked.isMoving) {
        // Check for Snap
        var bounds = getBounds();
        // Snap to bounds
        if (bounds.length) {
          // new snap: save preSnap size & bounds then set bounds
          preSnap = {width: b.width, height: b.height};
          bounds.unshift(pane);
          preSnap.to = bounds;
          setBounds.apply(this, preSnap.to);

          // Clicked: reduce size and destroy the preSnap state
        } else if (preSnap && !preSnap.draged) {
          var o = RESIZE_MARGIN_INNER;
          preSnap.to[1] += o;
          preSnap.to[2] += o;
          preSnap.to[3] -= o * 2;
          preSnap.to[4] -= o * 2;
          setBounds.apply(this, preSnap.to);
          preSnap = null;

          // Was dragged: just destroy the preSnap state
        } else {
          preSnap = null;
        }
        hintHide();
      } else if (clicked && clicked.isResizing) {
        // set bounds after resize to make sure they are % as required
        setBounds(pane);
      }

      clicked = null;
    }

    // Tripple click to center (comes in handy!)
    var clicks = [0, 0, 0];

    pane.addEventListener('click', trippleClick);

    function trippleClick(v) {
      clicks[2] = clicks[0] && clicks[1] && !clicks[2] ? e.timeStamp : clicks[2];
      clicks[1] = clicks[0] && !clicks[1] ? e.timeStamp : clicks[1];
      clicks[0] = !clicks[0] ? e.timeStamp : clicks[0];

      var dif = clicks[2] - clicks[0];
      if (clicks[2] && dif < 400) {center();}
      if (!clicks[2] && !clicks[3]) {
        setTimeout(function () {
          clicks = [0, 0, 0];
        }, 500);
      }
      v.preventDefault();
      v.stopPropagation();
      return false;
    }

    function center() {
      var w = window;
      var pw = w.innerWidth * 0.75;
      var ph = w.innerHeight * 0.75;
      setBounds(pane, (w.innerWidth / 2) - (pw / 2), (w.innerHeight / 2) - (ph / 2), pw, ph);
    }

    // utility functions
    function hasHTMLElement(a) {
      var instanceofHTML = false;
      for (var i in a) {
        if (i instanceof HTMLElement) {
          instanceofHTML = true;
        }
      }
      return instanceofHTML;
    }

    function bindEvents(ele, events, callback) {
      var evts = events.split(' ');
      for (var v in evts) {
        if (evts[v]) {
          ele.addEventListener(evts[v], callback);
        }
      }
    }

    return {
      togglePercent: togglePercent,
      snapFullScreen: snapFullScreen,
      restorePreSnap: restorePreSnap,
      center: center
    };
  };
  return {makeDRS: makeDRS};
}());

module.exports.init = function (o) {
  var t = o.target;
  // create drsw
  var nPanea = document.createElement('div');
  nPanea.id = 'panea';
  nPanea.className  = 'pane';
  var nContent = document.createElement('div');
  nContent.className  = 'content';
  var nChartContainer = document.createElement('div');
  nChartContainer.className  = 'chart-container';
  var nChartCanvas = document.createElement('canvas');
  nChartCanvas.id = 'chart';
  nChartCanvas.innerHTML = ' ';
  nChartContainer.appendChild(nChartCanvas);
  nContent.appendChild(nChartContainer);
  nPanea.appendChild(nContent);
  t.appendChild(nPanea);

  var panea = document.getElementById('panea');
  // console.log(panea)
  core.util.DRS.makeDRS(panea, 'top');
};
