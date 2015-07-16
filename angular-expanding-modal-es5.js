/* global window, requestAnimationFrame */

/*
 * @license
 * angular-expanding-modal v1.0.0
 * License: MIT
 */

'use strict';

(function (window, ng) {
  'use strict';

  function ExpandingModal($compile, $rootScope, $document, $controller, $q, $http, $templateCache) {
    return {
      /**
       * Factory function to create new modal instance
       *
       * @param  {Object} config config
       * @return {Object}        modal
       */
      create: function create(config) {
        if (!(!config.template ^ !config.templateUrl)) {
          throw new Error('Expected modal to have exacly one of either `template` or `templateUrl`');
        }

        var container = ng.element(config.container || $document[0].body);
        var controller = config.controller || null;
        var controllerAs = config.controllerAs;
        var element = null;
        var html = _getHtmlString(config);
        var target = undefined;
        var scope = undefined;

        /**
         * Evlaluate config and check if html-string
         * is included and if not fetch html string
         * via $http
         *
         * @param  {Object}         config config
         * @return {String|Promise}        promise resolving with
         *                                 html string
         */
        function _getHtmlString(config) {
          if (config.template) {
            html = $q.when(config.template);
          } else {
            html = $http.get(config.templateUrl, {
              cache: $templateCache
            }).then(function (response) {
              return response.data;
            });
          }

          return html;
        }

        /**
         * Helper function to set property with
         * vendor prefixes to elemnets
         *
         * @param {Object} element DOM element
         * @param {Sring}  prop    property name
         * @param {String} value   property value
         */
        function _setPrefixedProperty(element, prop, value) {
          element.style[prop] = value;
          element.style['-webkit-' + prop] = value;
        }

        /**
         * Attach the modal to the DOM
         *
         * @param  {String} html       html
         * @param  {Object} targetElem target element
         * @param  {Object} locals     locals
         */
        function attach(html, targetElem) {
          var locals = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

          target = targetElem;

          element = ng.element(html);

          if (element.length === 0) {
            throw new Error('The template contains no elements; you need to wrap text nodes');
          }
          scope = $rootScope.$new();

          if (controller) {
            locals.$scope = scope;

            var ctrl = $controller(controller, locals);

            if (controllerAs) {
              scope[controllerAs] = ctrl;
            }
          } else if (locals) {
            for (var prop in locals) {
              scope[prop] = locals[prop];
            }
          }

          $compile(element)(scope);

          element[0].style.opacity = 0;

          container.append(element[0]);

          var startRect = target.getBoundingClientRect();
          var endRect = element[0].getBoundingClientRect();

          var startValues = {
            top: startRect.top + window.scrollY,
            left: startRect.left,

            height: startRect.height,
            width: startRect.width
          };

          var endValues = {
            top: endRect.top + window.scrollY,
            left: endRect.left,

            height: endRect.height,
            width: endRect.width
          };

          var transformDiff = {
            x: 0,
            y: 0
          };

          var computedStyle = window.getComputedStyle(element[0], null);
          var transformStyles = computedStyle.getPropertyValue('transform') || window.getComputedStyle(element[0], null).getPropertyValue('-webkit-transform');

          if (transformStyles && transformStyles !== 'none') {
            var transformValues = transformStyles.replace(/(matrix\(|\))/g, '').split(',');

            transformDiff.x = +transformValues[4];
            transformDiff.y = +transformValues[5];
          }

          var scaleX = startValues.width / endValues.width;
          var scaleY = startValues.height / endValues.height;

          var transformRule = 'translate3d(' + (startValues.left - endValues.left + transformDiff.x) + 'px, ' + (startValues.top - endValues.top + transformDiff.y) + 'px,' + '0 ) ' + 'scale(' + scaleX + ',' + scaleY + ')';

          var listenerFunc = function listener() {
            element[0].classList.remove('transitionOut');
            element[0].classList.add('done');
            _setPrefixedProperty(element[0], 'transform', '');
            _setPrefixedProperty(element[0], 'transformOrigin', '');
            element[0].style.opacity = '';

            element[0].removeEventListener('transitionend', listenerFunc);
          };

          requestAnimationFrame(function () {
            _setPrefixedProperty(element[0], 'transform', transformRule);
            _setPrefixedProperty(element[0], 'transformOrigin', '0 0');

            element[0].style.opacity = 0.25;

            requestAnimationFrame(function () {

              element[0].addEventListener('transitionend', listenerFunc, false);

              element[0].classList.add('transitionOut');

              _setPrefixedProperty(element[0], 'transform', '');
              _setPrefixedProperty(element[0], 'transformOrigin', '.5 .5');
              element[0].style.opacity = 1;
            });
          });
        }

        /**
         * Open the modal
         *
         * @param  {Object} target target element
         * @param  {Object} locals locals
         */
        function open(target, locals) {
          return html.then(function (html) {
            if (!element) {
              attach(html, target, locals);
            }
          });
        }

        /**
         * Close the modals and remove it from the DOM
         */
        function close() {
          if (!element) {
            return $q.when();
          }

          var startRect = element[0].getBoundingClientRect();
          var endRect = target.getBoundingClientRect();

          var startValues = {
            top: startRect.top,
            left: startRect.left,

            height: startRect.height,
            width: startRect.width
          };

          var endValues = {
            top: endRect.top,
            left: endRect.left,

            height: endRect.height,
            width: endRect.width
          };

          var transformDiff = {
            x: 0,
            y: 0
          };

          var computedStyle = window.getComputedStyle(element[0], null);
          var transformStyles = computedStyle.getPropertyValue('transform') || computedStyle.getPropertyValue('-webkit-transform');

          if (transformStyles && transformStyles !== 'none') {
            var transformValues = transformStyles.replace(/(matrix\(|\))/g, '').split(',');

            transformDiff.x = +transformValues[4];
            transformDiff.y = +transformValues[5];
          }

          var transformRule = 'translate3d(' + (endValues.left - startValues.left + transformDiff.x) + 'px , ' + (endValues.top - startValues.top + transformDiff.y) + 'px,' + '0 )' + 'scale(' + endValues.width / startValues.width + ',' + endValues.height / startValues.height + ')';

          element[0].style.opacity = 1;

          var listenerFunc = function listener() {
            element[0].classList.remove('transitionIn');
            element[0].classList.add('done');
            element[0].style.opacity = 0;

            element[0].removeEventListener('transitionend', listenerFunc, false);

            scope.$destroy();
            scope = null;

            element.remove();
            element = null;
            target = null;
          };

          requestAnimationFrame(function () {
            element[0].classList.add('transitionIn');
            element[0].classList.remove('done');

            _setPrefixedProperty(element[0], 'transform', transformRule);
            _setPrefixedProperty(element[0], 'transformOrigin', '0 0 ');

            element[0].style.opacity = 0;

            element[0].addEventListener('transitionend', listenerFunc, false);
          });
        }

        return {
          open: open,
          close: close
        };
      }
    };
  }

  ng.module('sj.expandingModal', []).factory('ExpandingModal', ['$compile', '$rootScope', '$document', '$controller', '$q', '$http', '$templateCache', ExpandingModal]);
})(window, window.angular);

//# sourceMappingURL=angular-expanding-modal-es5.js.map