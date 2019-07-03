import { Component } from '../ui';

export default function Footer(options = {}) {
  const {
    footerData
  } = options;
  const {
    cls = '',
      data = footerData,
  } = options;

  return Component({
    render: function render() {
      let middleContent = '';
      if (data.img && !data.url && !data.urlText) {
        middleContent = `<img src="${data.img}">`;
      } else if (data.img && data.url && !data.urlText) {
        middleContent = `<img src="${data.img}"><a href="${data.url}"></a>`;
      } else if (data.img && !data.url && data.urlText) {
        middleContent = `<img src="${data.img}">${data.urlText}`;
      } else if (data.img && data.url && data.urlText) {
        middleContent = `<img src="${data.img}"><a href="${data.url}">${data.urlText}</a>`;
      } else if (data.img) {
        middleContent = `<img src="${data.img}">`;
      } else if (data.url && data.urlText) {
        middleContent = `<a href="${data.url}">${data.urlText}</a>`;
      } else if (data.text) {
        middleContent = `<p>${data.text}</p>`;
      }

      return `<div id=${this.getId()} class="o-footer relative ${cls}">
                <div id="o-console" class="o-footer-left">&nbsp;</div>
                <div class="o-footer-middle">
                  <div class="o-footer-middle-content">
                    ${middleContent}
                  </div>
                </div>
                <div class="o-footer-right"></div>
              </div>`;
    }
  });
}
