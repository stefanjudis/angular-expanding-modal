/* global window, requestAnimationFrame */

/*
 * @license
 * angular-expanding-modal v1.0.0
 * License: MIT
 */

( function( window, ng ) {
  'use strict';

  function ExpandingModal( $compile, $rootScope, $document, $controller, $q, $http, $templateCache ) {

    return class Modal {
      constructor( config = {} ) {
        if ( ! ( ! config.template ^ ! config.templateUrl ) ) {
          throw new Error(
            'Expected modal to have exacly one of either `template` or `templateUrl`'
          );
        }

        config.container = ng.element( config.container || $document[ 0 ].body );

        this._config = config;

        this.close = () => {
          if ( ! this._element ) {
            return $q.when();
          }

          return Modal.detach( this._target, this._element )
            .then( () => Modal.cleanup( this ) );
        };
      }

      open( target, locals ) {

        return $q.when( Modal.html( this._config ) )
          .then( ( html ) => Modal.attach( this, html, target, locals ) );
      }

      close () {
        console.log( 'nothing to close!' );
      }


      /**
       * Evlaluate config and check if html-string
       * is included and if not fetch html string
       * via $http
       *
       * @param  {Object}  config config object
       * @return {Promise}        promise resolving with
       *                                 html string
       */
      static html( { template, templateUrl } = {} ) {
        if ( template ) {
          return template;
        }

        return $http.get( templateUrl, {
          cache : $templateCache
        } )
          .then( ( { data } ) => data );
      }

      static attach( modal, html, target, locals ) {
        if ( modal._element ) {
          return $q.when( modal._element );
        }

        modal._target = target;

        return Modal.element( html )
          .then( ( element ) => Modal.compile( modal, element, locals ) )
          .then( ( element ) => Modal.append( modal, target, element ) )
          .then( ( element ) => modal._element = element );
      }

      static element( html ) {
        const element = ng.element( html );

        if ( element.length === 0 ) {
          throw new Error(
            'The template contains no elements; you need to wrap text nodes'
          );
        }

        return $q.when( element );
      }

      static compile( modal, element, locals = {} ) {
        const scope = $rootScope.$new();
        const { controller, controllerAs } = modal._config;

        if ( controller ) {
          locals.$scope = scope;

          const ctrl = $controller( controller, locals );

          if ( controllerAs ) {
            scope[ controllerAs ] = ctrl;
          }
        } else if ( locals ) {
          for ( let prop in locals ) {
            scope[ prop ] = locals[ prop ];
          }
        }

        modal._scope = scope;

        console.log( scope );

        return $compile( element )( scope );
      }

      static append( modal, target, element ) {
        const deferred = $q.defer();

        element[ 0 ].style.opacity = 0;

        modal._config.container.append( element[ 0 ] );

        const startRect = Modal.getBoundingClientRect( target );
        const endRect   = Modal.getBoundingClientRect( element[ 0 ] );

        startRect.top += window.scrollY;
        endRect.top   += window.scrollY;

        const transformRule = Modal.getTransformRule( element[ 0 ], startRect, endRect );

        const listenerFunc = () => {
          element[ 0 ].removeEventListener( 'transitionend', listenerFunc );

          element[ 0 ].classList.remove( 'transitionOut' );
          element[ 0 ].classList.add( 'done' );

          element[ 0 ].style.opacity   = '';
          Modal.setPrefixedProperty( element[ 0 ], 'transform', '' );
          Modal.setPrefixedProperty( element[ 0 ], 'transformOrigin', '' );

          deferred.resolve( element );
        };

        requestAnimationFrame( () => {
          Modal.setPrefixedProperty( element[ 0 ], 'transform', transformRule );
          Modal.setPrefixedProperty( element[ 0 ], 'transformOrigin', '0 0' );

          element[ 0 ].style.opacity         = 0.25;

          requestAnimationFrame( function () {
            element[ 0 ].addEventListener( 'transitionend', listenerFunc, false );

            element[ 0 ].classList.add( 'transitionOut' );

            element[ 0 ].style.opacity = 1;
            Modal.setPrefixedProperty( element[ 0 ], 'transform', '' );
            Modal.setPrefixedProperty( element[ 0 ], 'transformOrigin', '.5 .5' );
          } );
        } );

        return deferred.promise;
      }

      static detach( target, element ) {
        const deferred = $q.defer();

        const endRect = Modal.getBoundingClientRect( element[ 0 ] );
        const startRect   = Modal.getBoundingClientRect( target );

        const transformRule = Modal.getTransformRule( element[ 0 ], startRect, endRect );

        element[ 0 ].style.opacity = 1;

        const listenerFunc = () => {
          element[ 0 ].removeEventListener( 'transitionend', listenerFunc, false );

          element[ 0 ].classList.remove( 'transitionIn' );
          element[ 0 ].classList.add( 'done' );

          element[ 0 ].style.opacity = 0;

          deferred.resolve( element );
        };

        requestAnimationFrame( () => {
          element[ 0 ].addEventListener( 'transitionend', listenerFunc, false );

          element[ 0 ].classList.add( 'transitionIn' );
          element[ 0 ].classList.remove( 'done' );

          element[ 0 ].style.opacity = 0;
          Modal.setPrefixedProperty( element[ 0 ], 'transform', transformRule );
          Modal.setPrefixedProperty( element[ 0 ], 'transformOrigin', '0 0 ' );
        } );

        return deferred.promise;
      }

      static cleanup( modal ) {
        modal._scope.$destroy();
        modal._scope = null;

        modal._element.remove();
        modal._element = null;

        modal._target  = null;

        return true;
      }

      static getBoundingClientRect( element ) {
        const box = element.getBoundingClientRect();

        return {
          top    : box.top,
          left   : box.left,
          width  : box.width,
          height : box.height
        };
      }

      static setPrefixedProperty( element, prop, value ) {
        element.style[ prop ] = value;
        element.style[ '-webkit-' + prop ] = value;
      }

      static getTransformRule( element, startRect, endRect ) {
        const transformDiff = {
          x : 0,
          y : 0
        };

        const computedStyle   = window.getComputedStyle( element, null );
        const transformStyles = computedStyle.getPropertyValue( 'transform' ) ||
                                computedStyle.getPropertyValue( '-webkit-transform' );

        if ( transformStyles && transformStyles !== 'none' ) {
          const [,,,, x, y ] = transformStyles.replace( /(matrix\(|\))/g, '' ).split( ',' );

          transformDiff.x = + x;
          transformDiff.y = + y;
        }

        const scale = {
          x : startRect.width / endRect.width,
          y : startRect.height / endRect.height
        };

        const translate = {
          x : startRect.left - endRect.left + transformDiff.x,
          y : startRect.top - endRect.top + transformDiff.y
        };

        return `translate3d( ${translate.x}px,${translate.y}px,0 ) scale( ${scale.x},${scale.y} )`;
      }
    };
  }

  ng.module( 'sj.expandingModal', [] )
      .factory( 'ExpandingModal', [ '$compile', '$rootScope', '$document', '$controller', '$q', '$http', '$templateCache', ExpandingModal ] );
} )( window, window.angular );
