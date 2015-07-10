/* global angular */

/*
 * @license
 * angular-expanding-modal v1.0.0
 * License: MIT
 */

;( function( window, ng ) {
  'use strict';

  class ExpandingModal {
    constructor( $compile, $rootScope, $controller, $q, $http, $templateCache ) {
      return function( config ) {
        if ( ! ( ! config.template ^ ! config.templateUrl ) ) {
          throw new Error('Expected modal to have exacly one of either `template` or `templateUrl`');
        }

        var template      = config.template,
            container     = ng.element(config.container || document.body),
            controller    = config.controller || null,
            controllerAs  = config.controllerAs,
            element       = null,
            target,
            html,
            scope;

        if (config.template) {
          html = $q.when(config.template);
        } else {
          html = $http.get(config.templateUrl, {
            cache: $templateCache
          }).
          then(function (response) {
            return response.data;
          });
        }

        function activate ( target, locals) {
          return html.then(function (html) {
            if ( ! element ) {
              attach( html, target, locals );
            }
          });
        }


        function attach ( html, targetElem, locals ) {
          target = targetElem;

          element = ng.element( html );
          if ( element.length === 0 ) {
            throw new Error('The template contains no elements; you need to wrap text nodes');
          }
          scope = $rootScope.$new();
          if (controller) {
            if (!locals) {
              locals = {};
            }
            locals.$scope = scope;
            var ctrl = $controller(controller, locals);
            if (controllerAs) {
              scope[controllerAs] = ctrl;
            }
          } else if (locals) {
            // for (var prop in locals) {
            //   scope[prop] = locals[prop];
            // }
          }

          $compile(element)(scope);

          element[ 0 ].style.opacity = 0;

          container.append( element[ 0 ] );

          var startRect  = target.getBoundingClientRect();
          var endRect = element[ 0 ].getBoundingClientRect();

          var startValues = {
            top  : ( startRect.top + window.scrollY ),
            left : startRect.left,

            height : startRect.height,
            width  : startRect.width
          };

          var endValues = {
            top  : ( endRect.top + window.scrollY ),
            left : endRect.left,

            height : endRect.height,
            width  : endRect.width
          };

          var transformDiff = {
            x : 0,
            y : 0
          };

          var transformStyles = window.getComputedStyle( element[ 0 ], null ).getPropertyValue( 'transform' );

          if ( transformStyles && transformStyles !== 'none' ) {
            let transformValues = transformStyles.replace( /(matrix\(|\))/g, '' ).split( ',' )

            transformDiff.x = +transformValues[ 4 ];
            transformDiff.y = +transformValues[ 5 ];
          }

          var scaleX = startValues.width / endValues.width;
          var scaleY = startValues.height / endValues.height;

          var transformRule = 'translate3d(' +
                                ( startValues.left - endValues.left + transformDiff.x ) + 'px, ' +
                                ( startValues.top - endValues.top + transformDiff.y ) + 'px,' +
                                '0 ) ' +
                              'scale(' + scaleX + ',' + scaleY + ')';

          var listenerFunc = function listener() {
            if ( element ) {
              element[ 0 ].classList.remove( 'transitionOut' );

              element[ 0 ].removeEventListener( 'transitionEnd', listenerFunc );
            }
          };

          requestAnimationFrame( () => {
            element[ 0 ].style.transform       = transformRule;
            element[ 0 ].style.transformOrigin = '0 0'
            element[ 0 ].style.opacity         = 0.5;

            requestAnimationFrame( () => {
              element[ 0 ].classList.add( 'transitionOut' );
              element[ 0 ].style.transformOrigin = '.5 .5'
              element[ 0 ].style.transform = '';
              element[ 0 ].style.opacity   = 1;
            } );
          } );
        }

        function deactivate () {
          if (!element) {
            return $q.when();
          }

          var startRect = element[ 0 ].getBoundingClientRect();
          var endRect   = target.getBoundingClientRect();

          var startValues = {
            top  : startRect.top,
            left : startRect.left,

            height : startRect.height,
            width  : startRect.width
          };

          var endValues = {
            top  : endRect.top,
            left : endRect.left,

            height : endRect.height,
            width  : endRect.width
          };

          var transformDiff = {
            x : 0,
            y : 0
          };

          var transformStyles = window.getComputedStyle( element[ 0 ], null ).getPropertyValue( 'transform' );

          if ( transformStyles && transformStyles !== 'none' ) {
            let transformValues = transformStyles.replace( /(matrix\(|\))/g, '' ).split( ',' )

            transformDiff.x = +transformValues[ 4 ];
            transformDiff.y = +transformValues[ 5 ];
          }

          var transformRule = 'translate3d(' +
                              ( endValues.left - startValues.left + transformDiff.x ) + 'px , ' +
                              ( endValues.top - startValues.top +  transformDiff.y ) + 'px,' +
                              '0 )' +
                            'scale(' +
                              ( endValues.width / startValues.width ) + ',' +
                              ( endValues.height / startValues.height ) + ')';

          element[ 0 ].style.opacity   = 1;

          var listenerFunc = function listener() {
            if ( element ) {
              element[ 0 ].classList.remove( 'transitionIt' );
              element[ 0 ].style.opacity   = 0;

              element[ 0 ].removeEventListener( 'transitionEnd', listenerFunc, false );

              scope.$destroy();
              scope = null;
              element.remove();
              element = null;
            }
          };

          requestAnimationFrame( () => {
            element[ 0 ].classList.add( 'transitionIt' );
            element[ 0 ].style.transform = transformRule;
            element[ 0 ].style.opacity   = 0;

            element[ 0 ].addEventListener( 'transitionend', listenerFunc, false );
          } );
        }

        function active () {
          return !!element;
        }

        return {
          activate: activate,
          deactivate: deactivate,
          active: active
        };
      }
    }
  }

  ng.module( 'sj.expandingModal', [] )
      .service( 'ExpandingModal', [ '$compile', '$rootScope', '$controller', '$q', '$http', '$templateCache', ExpandingModal ] );
} )( window, window.angular );
