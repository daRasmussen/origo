<<<<<<< HEAD
"use strict";
var $ = require('jquery');

module.exports = function (target) {
    render(target);
    bindUIActions();
    return {
        getEl: getEl,
        setVisibility: setVisibility,
        setTitle: setTitle,
        setContent: setContent,
        closePopup: closePopup
    }
}

function render(target) {
    var pop = '<div id="o-popup">' +
        '<div class="o-popup o-card">' +
        '<div class="o-close-button"><svg class="o-icon-fa-times"><use xlink:href="#fa-times"></use></svg></div>' +
        '<div class="o-card-title"></div>' +
        '<div class="o-card-content"></div>' +
        '</div>' +
        '</div>';
    $(target).append(pop);
}

function bindUIActions() {
    $('#o-popup .o-popup .o-close-button').on('click', function (evt) {
        closePopup();
        evt.preventDefault();
    });
}

=======
import $ from 'jquery';

function render(target) {
  const pop = `<div id="o-popup">
      <div class="o-popup o-card">
        <div class="flex row justify-end">
          <div id="o-card-title" class="justify-start margin-top-small margin-left text-weight-bold" style="width:100%;"></div>
          <button id="o-close-button" class="small round margin-top-small margin-right-small icon-smallest grey-lightest no-shrink">
            <span class="icon ">
              <svg>
                <use xlink:href="#ic_close_24px"></use>
              </svg>
            </span>
          </button>
        </div>
        <div class="o-card-content"></div>
      </div>
    </div>`;
  $(target).append(pop);
}

>>>>>>> origin
function getEl() {
  return $('#o-popup').get(0);
}

function setVisibility(visible) {
  if (visible) {
    $('#o-popup').css('display', 'block');
  } else {
    $('#o-popup').css('display', 'none');
  }
}

function setTitle(title) {
  $('#o-popup #o-card-title').html(title);
}

function setContent(config) {
<<<<<<< HEAD
    config.title ? $('#o-popup .o-popup .o-card-title').html(config.title) : $('#o-popup .o-popup .o-card-title').html('');
    config.content ? $('#o-popup .o-popup .o-card-content').html(config.content) : $('#o-popup .o-popup .o-card-content').html('');
}

function closePopup() {
    setVisibility(false);
}
=======
  if (config.title) {
    $('#o-popup .o-popup #o-card-title').html(config.title);
  } else {
    $('#o-popup .o-popup #o-card-title').html('');
  }
  if (config.content) {
    $('#o-popup .o-popup .o-card-content').html(config.content);
  } else {
    $('#o-popup .o-popup .o-card-content').html('');
  }
}

function closePopup() {
  setVisibility(false);
}

function bindUIActions() {
  $('#o-popup .o-popup #o-close-button').on('click', (evt) => {
    closePopup();
    evt.preventDefault();
  });
}

export default function (target) {
  render(target);
  bindUIActions();
  return {
    getEl,
    setVisibility,
    setTitle,
    setContent,
    closePopup
  };
}
>>>>>>> origin
