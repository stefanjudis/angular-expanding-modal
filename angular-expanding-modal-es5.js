/* global window, requestAnimationFrame */

/*
 * @license
 * angular-expanding-modal v1.0.0
 * License: MIT
 */

'use strict';

var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i['return']) _i['return'](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError('Invalid attempt to destructure non-iterable instance'); } }; })();

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

(function (window, ng) {
  'use strict';

  function ExpandingModal($compile, $rootScope, $document, $controller, $q, $http, $templateCache) {

    return (function () {
      function Modal() {
        var _this = this;

        var config = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

        _classCallCheck(this, Modal);

        if (!(!config.template ^ !config.templateUrl)) {
          throw new Error('Expected modal to have exacly one of either `template` or `templateUrl`');
        }

        config.container = ng.element(config.container || $document[0].body);

        this._config = config;

        this.close = function () {
          if (!_this._element) {
            return $q.when();
          }

          return Modal.detach(_this._target, _this._element).then(function () {
            return Modal.cleanup(_this);
          });
        };
      }

      _createClass(Modal, [{
        key: 'open',
        value: function open(target, locals) {
          var _this2 = this;

          return $q.when(Modal.html(this._config)).then(function (html) {
            return Modal.attach(_this2, html, target, locals);
          });
        }
      }, {
        key: 'close',
        value: function close() {
          console.log('nothing to close!');
        }
      }], [{
        key: 'html',

        /**
         * Evlaluate config and check if html-string
         * is included and if not fetch html string
         * via $http
         *
         * @param  {Object}  config config object
         * @return {Promise}        promise resolving with
         *                                 html string
         */
        value: function html() {
          var _ref = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

          var template = _ref.template;
          var templateUrl = _ref.templateUrl;

          if (template) {
            return template;
          }

          return $http.get(templateUrl, {
            cache: $templateCache
          }).then(function (_ref2) {
            var data = _ref2.data;
            return data;
          });
        }
      }, {
        key: 'attach',
        value: function attach(modal, html, target, locals) {
          if (modal._element) {
            return $q.when(modal._element);
          }

          modal._target = target;

          return Modal.element(html).then(function (element) {
            return Modal.compile(modal, element, locals);
          }).then(function (element) {
            return Modal.append(modal, target, element);
          }).then(function (element) {
            return modal._element = element;
          });
        }
      }, {
        key: 'element',
        value: function element(html) {
          var element = ng.element(html);

          if (element.length === 0) {
            throw new Error('The template contains no elements; you need to wrap text nodes');
          }

          return $q.when(element);
        }
      }, {
        key: 'compile',
        value: function compile(modal, element) {
          var locals = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

          var scope = $rootScope.$new();
          var _modal$_config = modal._config;
          var controller = _modal$_config.controller;
          var controllerAs = _modal$_config.controllerAs;

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

          modal._scope = scope;

          console.log(scope);

          return $compile(element)(scope);
        }
      }, {
        key: 'append',
        value: function append(modal, target, element) {
          var deferred = $q.defer();

          element[0].style.opacity = 0;

          modal._config.container.append(element[0]);

          var startRect = Modal.getBoundingClientRect(target);
          var endRect = Modal.getBoundingClientRect(element[0]);

          startRect.top += window.scrollY;
          endRect.top += window.scrollY;

          var transformRule = Modal.getTransformRule(element[0], startRect, endRect);

          var listenerFunc = function listenerFunc() {
            element[0].removeEventListener('transitionend', listenerFunc);

            element[0].classList.remove('transitionOut');
            element[0].classList.add('done');

            element[0].style.opacity = '';
            Modal.setPrefixedProperty(element[0], 'transform', '');
            Modal.setPrefixedProperty(element[0], 'transformOrigin', '');

            deferred.resolve(element);
          };

          requestAnimationFrame(function () {
            Modal.setPrefixedProperty(element[0], 'transform', transformRule);
            Modal.setPrefixedProperty(element[0], 'transformOrigin', '0 0');

            element[0].style.opacity = 0.25;

            requestAnimationFrame(function () {
              element[0].addEventListener('transitionend', listenerFunc, false);

              element[0].classList.add('transitionOut');

              element[0].style.opacity = 1;
              Modal.setPrefixedProperty(element[0], 'transform', '');
              Modal.setPrefixedProperty(element[0], 'transformOrigin', '.5 .5');
            });
          });

          return deferred.promise;
        }
      }, {
        key: 'detach',
        value: function detach(target, element) {
          var deferred = $q.defer();

          var endRect = Modal.getBoundingClientRect(element[0]);
          var startRect = Modal.getBoundingClientRect(target);

          var transformRule = Modal.getTransformRule(element[0], startRect, endRect);

          element[0].style.opacity = 1;

          var listenerFunc = function listenerFunc() {
            element[0].removeEventListener('transitionend', listenerFunc, false);

            element[0].classList.remove('transitionIn');
            element[0].classList.add('done');

            element[0].style.opacity = 0;

            deferred.resolve(element);
          };

          requestAnimationFrame(function () {
            element[0].addEventListener('transitionend', listenerFunc, false);

            element[0].classList.add('transitionIn');
            element[0].classList.remove('done');

            element[0].style.opacity = 0;
            Modal.setPrefixedProperty(element[0], 'transform', transformRule);
            Modal.setPrefixedProperty(element[0], 'transformOrigin', '0 0 ');
          });

          return deferred.promise;
        }
      }, {
        key: 'cleanup',
        value: function cleanup(modal) {
          modal._scope.$destroy();
          modal._scope = null;

          modal._element.remove();
          modal._element = null;

          modal._target = null;

          return true;
        }
      }, {
        key: 'getBoundingClientRect',
        value: function getBoundingClientRect(element) {
          var box = element.getBoundingClientRect();

          return {
            top: box.top,
            left: box.left,
            width: box.width,
            height: box.height
          };
        }
      }, {
        key: 'setPrefixedProperty',
        value: function setPrefixedProperty(element, prop, value) {
          element.style[prop] = value;
          element.style['-webkit-' + prop] = value;
        }
      }, {
        key: 'getTransformRule',
        value: function getTransformRule(element, startRect, endRect) {
          var transformDiff = {
            x: 0,
            y: 0
          };

          var computedStyle = window.getComputedStyle(element, null);
          var transformStyles = computedStyle.getPropertyValue('transform') || computedStyle.getPropertyValue('-webkit-transform');

          if (transformStyles && transformStyles !== 'none') {
            var _transformStyles$replace$split = transformStyles.replace(/(matrix\(|\))/g, '').split(',');

            var _transformStyles$replace$split2 = _slicedToArray(_transformStyles$replace$split, 6);

            var x = _transformStyles$replace$split2[4];
            var y = _transformStyles$replace$split2[5];

            transformDiff.x = +x;
            transformDiff.y = +y;
          }

          var scale = {
            x: startRect.width / endRect.width,
            y: startRect.height / endRect.height
          };

          var translate = {
            x: startRect.left - endRect.left + transformDiff.x,
            y: startRect.top - endRect.top + transformDiff.y
          };

          return 'translate3d( ' + translate.x + 'px,' + translate.y + 'px,0 ) scale( ' + scale.x + ',' + scale.y + ' )';
        }
      }]);

      return Modal;
    })();
  }

  ng.module('sj.expandingModal', []).factory('ExpandingModal', ['$compile', '$rootScope', '$document', '$controller', '$q', '$http', '$templateCache', ExpandingModal]);
})(window, window.angular);

//# sourceMappingURL=angular-expanding-modal-es5.js.map