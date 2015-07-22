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
      }

      open( target, locals ) {
        return $q.when( Modal.html( this.config ) )
          .then( ( html ) => Modal.attach( this, html, target, locals ) );
      }

      close () {
        if ( ! this._element ) {
          return $q.when();
        }

        return Modal.detach( this._target, this._element )
          .then( () => Modal.cleanup( this ) );
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
      static html( { template, templateUrl } ) {
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
          return modal._element;
        }

        modal._target = target;

        modal._element = Modal.createElement( html )
          .then( ( element ) => Modal.compile( modal, element, locals ) )
          .then( ( element ) => Modal.append( target, element ) );
      }

      static createElement( html ) {
        const element = ng.element( html );

        if ( element.length === 0 ) {
          throw new Error(
            'The template contains no elements; you need to wrap text nodes'
          );
        }

        return element;
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

        return $compile( element )( scope );
      }

      static append( target, [ element ] ) {
        const deferred = $q.defer();

        const startRect = target.getBoundingClientRect();
        const endRect   = element.getBoundingClientRect();

        startRect.top += window.scrollY;
        endRect.top   += window.scrollY;

        const transformRule = Modal.getTransformRule( element, startRect, endRect );

        const listenerFunc = function () {
          element.classList.remove( 'transitionOut' );
          element.classList.add( 'done' );
          Modal.setPrefixedProperty( element, 'transform', '' );
          Modal.setPrefixedProperty( element, 'transformOrigin', '' );
          element.style.opacity   = '';

          element.removeEventListener( 'transitionend', listenerFunc );

          deferred.resolve( arguments[ 1 ] );
        };

        requestAnimationFrame( function () {
          Modal.setPrefixedProperty( element, 'transform', transformRule );
          Modal.setPrefixedProperty( element, 'transformOrigin', '0 0' );

          element.style.opacity         = 0.25;

          requestAnimationFrame( function () {
            element.addEventListener( 'transitionend', listenerFunc, false );

            element.classList.add( 'transitionOut' );

            Modal.setPrefixedProperty( element, 'transform', '' );
            Modal.setPrefixedProperty( element, 'transformOrigin', '.5 .5' );
            element.style.opacity   = 1;
          } );
        } );
      }

      static detach( target, [ element ] ) {
        const deferred = $q.defer();

        const startRect = element.getBoundingClientRect();
        const endRect   = target.getBoundingClientRect();

        const transformRule = Modal.getTransformRule( element, startRect, endRect );

        element.style.opacity = 1;

        const listenerFunc = function listener() {
          element.classList.remove( 'transitionIn' );
          element.classList.add( 'done' );
          element.style.opacity = 0;

          element.removeEventListener( 'transitionend', listenerFunc, false );

          deferred.resolve();
        };

        requestAnimationFrame( () => {
          element.classList.add( 'transitionIn' );
          element.classList.remove( 'done' );

          Modal.setPrefixedProperty( element, 'transform', transformRule );
          Modal.setPrefixedProperty( element, 'transformOrigin', '0 0 ' );

          element.style.opacity   = 0;

          element.addEventListener( 'transitionend', listenerFunc, false );
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
