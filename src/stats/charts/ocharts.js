'use strict';

module.exports = {
  defaults: function () {
    return  {
      'interactions': {
        'default': 'featureInfo',
        'tool': 'showStats'
      },
      'tools': {
        'names': [],
        'list': [
          {
            'name': 'charts',
            'active': false,
            'control': true,
            'default': false,
            'enabled': false,
            'icon': 'settings',
            'toolTip': 'Välj diagram',
            'tipPlace': 'east',
            'group': 'charts',
            'target': {
              'id': '#o-charts-button',
              'html': '#o-charts-button button',
              'visible': 'o-charts-button-true'
            },
            'events': {
              'click': function (e) {
                e.preventDefault();
              }
            }
          },
          {
            'name': 'linjar',
            'enabled': false,
            'active': false,
            'control': false,
            'default': false,
            'icon': 'linjar',
            'toolTip': 'Visa linjär',
            'tipPlace': 'north',
            'group': 'charts',
            'target': {
              'id': '#o-charts-linjar-button',
              'html': '#o-charts-linjar-button button',
              'visible': 'o-charts-linjar-button-true'
            },
            'events': {
              'click': function (e) {
                e.preventDefault();
              }
            }
          },
          {
            'name': 'bar',
            'enabled': false,
            'active': false,
            'control': false,
            'default': false,
            'icon': 'bar',
            'toolTip': 'Visa stapel',
            'tipPlace': 'north',
            'group': 'charts',
            'target': {
              'id': '#o-charts-bar-button',
              'html': '#o-charts-bar-button button',
              'visible': 'o-charts-bar-button-true'
            },
            'events': {
              'click': function (e) {
                e.preventDefault();
              }
            }
          },
          {
            'name': 'radar',
            'enabled': false,
            'active': false,
            'control': false,
            'default': false,
            'icon': 'radar',
            'toolTip': 'Visa radar',
            'tipPlace': 'north',
            'group': 'charts',
            'target': {
              'id': '#o-charts-radar-button',
              'html': '#o-charts-radar-button button',
              'visible': 'o-charts-radar-button-true'
            },
            'events': {
              'click': function (e) {
                e.preventDefault();
              }
            }
          },
          {
            'name': 'doughnut',
            'enabled': false,
            'active': false,
            'control': false,
            'default': false,
            'icon': 'doughnut',
            'toolTip': 'Visa doughnut',
            'tipPlace': 'north',
            'group': 'charts',
            'target': {
              'id': '#o-charts-doughnut-button',
              'html': '#o-charts-doughnut-button button',
              'visible': 'o-charts-doughnut-button-true'
            },
            'events': {
              'click': function (e) {
                e.preventDefault();
              }
            }
          },
          {
            'name': 'circle',
            'enabled': false,
            'active': false,
            'control': false,
            'default': false,
            'icon': 'circle',
            'toolTip': 'Visa cirkel',
            'tipPlace': 'north',
            'group': 'charts',
            'target': {
              'id': '#o-charts-circle-button',
              'html': '#o-charts-circle-button button',
              'visible': 'o-charts-circle-button-true'
            },
            'events': {
              'click': function (e) {
                e.preventDefault();
              }
            }
          },
          {
            'name': 'polar',
            'enabled': false,
            'active': false,
            'control': false,
            'default': false,
            'icon': 'polar',
            'toolTip': 'Visa polar area',
            'tipPlace': 'north',
            'group': 'charts',
            'target': {
              'id': '#o-charts-polar-button',
              'html': '#o-charts-polar-button button',
              'visible': 'o-charts-polar-button-true'
            },
            'events': {
              'click': function (e) {
                e.preventDefault();
              }
            }
          },
          {
            'name': 'bubble',
            'enabled': false,
            'active': false,
            'control': false,
            'default': false,
            'icon': 'bubble',
            'toolTip': 'Visa bubble',
            'tipPlace': 'north',
            'group': 'charts',
            'target': {
              'id': '#o-charts-bubble-button',
              'html': '#o-charts-bubble-button button',
              'visible': 'o-charts-bubble-button-true'
            },
            'events': {
              'click': function (e) {
                e.preventDefault();
              }
            }
          }
        ]
      },
      'fieldNames': [],
      'names': [],
      'ids': [],
      'values': [],
      'selections': {
        'total': {
          'names': [],
          'ids': [],
          'values': []
        },
        'compare': {
          'selected': [],
          'deselected': [],
          'results': [],
          'data': []
        }
      },
      'data': {
        'sum': 0,
        'average': 0.0,
        'stdDev': 0.0,
        'scale': 2,
        'precision': 7
        // https://derickbailey.com/2014/09/21/calculating-standard-deviation-with-array-map-and-array-reduce-in-javascript/
        // Precision 7, scale 2: 12345.67
        // Precision 6, scale 2:  1234.56
        // Precision 4, scale 2: 99.99
        // Precision 10, scale 0: 9999999999
        // Precision 8, scale 3: 99999.999
        // Precision 5, scale -3: 99999000
      }
    };
  }
};
