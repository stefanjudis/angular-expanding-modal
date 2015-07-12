/* global angular */

/*
 * @license
 * angular-expanding-modal v1.0.0
 * License: MIT
 */

;( function( window, ng ) {
  'use strict';

  function ExpandingModal( $compile, $rootScope, $controller, $q, $http, $templateCache ) {
    return {
      create : config => {
        if ( ! ( ! config.template ^ ! config.templateUrl ) ) {
          throw new Error('Expected modal to have exacly one of either `template` or `templateUrl`');
        }

        let template      = config.template;
        let container     = ng.element( config.container || document.body );
        let controller    = config.controller || null;
        let controllerAs  = config.controllerAs;
        let element       = null;
        let html
        let target;
        let scope;

        if ( config.template ) {
          html = $q.when( config.template );
        } else {
          html = $http.get( config.templateUrl, {
            cache : $templateCache
          } ).then( function ( response ) {
            return response.data;
          } );
        }

        function _setPrefixedProperty( element, prop, value ) {
          element.style[ prop ] = value;
          element.style[ '-webkit-' + prop ] = value;
        }

        function attach( html, targetElem, locals = {} ) {
          target = targetElem;

          element = ng.element( html );

          if ( element.length === 0 ) {
            throw new Error('The template contains no elements; you need to wrap text nodes');
          }
          scope = $rootScope.$new();

          if ( controller ) {
            locals.$scope = scope;

            var ctrl = $controller( controller, locals );

            if ( controllerAs ) {
              scope[ controllerAs ] = ctrl;
            }
          } else if ( locals ) {
            for ( let prop in locals ) {
              scope[ prop ] = locals[ prop ];
            }
          }


          $compile( element )( scope );

          element[ 0 ].style.opacity = 0;

          container.append( element[ 0 ] );

          let startRect = target.getBoundingClientRect();
          let endRect   = element[ 0 ].getBoundingClientRect();

          let startValues = {
            top  : ( startRect.top + window.scrollY ),
            left : startRect.left,

            height : startRect.height,
            width  : startRect.width
          };

          let endValues = {
            top  : ( endRect.top + window.scrollY ),
            left : endRect.left,

            height : endRect.height,
            width  : endRect.width
          };

          let transformDiff = {
            x : 0,
            y : 0
          };

          let computedStyle   = window.getComputedStyle( element[ 0 ], null )
          let transformStyles = computedStyle.getPropertyValue( 'transform' ) ||
                                window.getComputedStyle( element[ 0 ], null ).getPropertyValue( '-webkit-transform' );


          if ( transformStyles && transformStyles !== 'none' ) {
            let transformValues = transformStyles.replace( /(matrix\(|\))/g, '' ).split( ',' )

            transformDiff.x = +transformValues[ 4 ];
            transformDiff.y = +transformValues[ 5 ];
          }

          let scaleX = startValues.width / endValues.width;
          let scaleY = startValues.height / endValues.height;

          let transformRule = 'translate3d(' +
                                ( startValues.left - endValues.left + transformDiff.x ) + 'px, ' +
                                ( startValues.top - endValues.top + transformDiff.y ) + 'px,' +
                                '0 ) ' +
                              'scale(' + scaleX + ',' + scaleY + ')';

          var listenerFunc = function listener() {
            element[ 0 ].classList.remove( 'transitionOut' );
            element[ 0 ].classList.add( 'done' );
            _setPrefixedProperty( element[ 0 ], 'transform', '' )
            _setPrefixedProperty( element[ 0 ], 'transformOrigin', '' )
            element[ 0 ].style.opacity   = '';


            element[ 0 ].removeEventListener( 'transitionend', listenerFunc );
          };

          requestAnimationFrame( () => {

            _setPrefixedProperty( element[ 0 ], 'transform', transformRule );
            _setPrefixedProperty( element[ 0 ], 'transformOrigin', '0 0' );

            element[ 0 ].style.opacity         = 0.5;

            requestAnimationFrame( () => {

              element[ 0 ].addEventListener( 'transitionend', listenerFunc, false );

              element[ 0 ].classList.add( 'transitionOut' );

              _setPrefixedProperty( element[ 0 ], 'transform', '' )
              _setPrefixedProperty( element[ 0 ], 'transformOrigin', '.5 .5' )
              element[ 0 ].style.opacity   = 1;
            } );
          } );
        }

        function open( target, locals ) {
          return html.then( html => {
            if ( ! element ) {
              attach( html, target, locals );
            }
          } );
        }


        function close() {
          if ( ! element ) {
            return $q.when();
          }

          let startRect = element[ 0 ].getBoundingClientRect();
          let endRect   = target.getBoundingClientRect();

          let startValues = {
            top  : startRect.top,
            left : startRect.left,

            height : startRect.height,
            width  : startRect.width
          };

          let endValues = {
            top  : endRect.top,
            left : endRect.left,

            height : endRect.height,
            width  : endRect.width
          };

          let transformDiff = {
            x : 0,
            y : 0
          };

          let computedStyle   = window.getComputedStyle( element[ 0 ], null )
          let transformStyles = computedStyle.getPropertyValue( 'transform' ) ||
                                computedStyle.getPropertyValue( '-webkit-transform' );

          if ( transformStyles && transformStyles !== 'none' ) {
            let transformValues = transformStyles.replace( /(matrix\(|\))/g, '' ).split( ',' )

            transformDiff.x = +transformValues[ 4 ];
            transformDiff.y = +transformValues[ 5 ];
          }

          let transformRule = 'translate3d(' +
                                ( endValues.left - startValues.left + transformDiff.x ) + 'px , ' +
                                ( endValues.top - startValues.top +  transformDiff.y ) + 'px,' +
                                '0 )' +
                              'scale(' +
                                ( endValues.width / startValues.width ) + ',' +
                                ( endValues.height / startValues.height ) + ')';

          element[ 0 ].style.opacity = 1;

          let listenerFunc = function listener() {
            element[ 0 ].classList.remove( 'transitionIn' );
            element[ 0 ].classList.add( 'done' );
            element[ 0 ].style.opacity   = 0;

            element[ 0 ].removeEventListener( 'transitionend', listenerFunc, false );


            scope.$destroy();
            scope = null;

            element.remove();
            element = null;
            target  = null;
          };

          requestAnimationFrame( () => {
            element[ 0 ].classList.add( 'transitionIn' );
            element[ 0 ].classList.remove( 'done' );

            _setPrefixedProperty( element[ 0 ], 'transform', transformRule );
            _setPrefixedProperty( element[ 0 ], 'transformOrigin', '0 0 ' );

            element[ 0 ].style.opacity   = 0;

            element[ 0 ].addEventListener( 'transitionend', listenerFunc, false );
          } );
        }

        return {
          open  : open,
          close : close
        };
      }
    }
  }

  ng.module( 'sj.expandingModal', [] )
      .factory( 'ExpandingModal', [ '$compile', '$rootScope', '$controller', '$q', '$http', '$templateCache', ExpandingModal ] );
} )( window, window.angular );