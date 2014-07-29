/*
 * Prolyfill - A simple way to convert most of promise libs to the standard definition
 *
 * Usage:
 * var Q = require('q');
 * require('prolyfill')(Q);
 * var p = new Promise(function (resolve, reject) {
 *   // Do your stuff and resolve or reject
 *   // It will use the native Promise if possible
 *   // otherwise, fallback to Q
 * });
 * p.then(function (value) {
 *   // Chaining and do async stuff
 * });
 *
 * Supported libs:
 * - bluelbird: https://github.com/petkaantonov/bluebird/blob/master/API.md
 * - Q: https://github.com/kriskowal/q/wiki/API-Reference
 * - when: https://github.com/cujojs/when/blob/master/docs/api.md
 * - RSVP: ???
 * - vow: http://dfilatov.github.io/vow/
 * - promise: https://github.com/then/promise#api
 * - lie: https://github.com/calvinmetcalf/lie#api
 * - deferred: https://github.com/medikoo/deferred
 * - davy: https://github.com/lvivski/davy#api
 */

(function (definition) {
  if (typeof exports === 'object') {
    module.exports = definition();
  }
  else if (typeof define === 'function' && define.amd){
    define([], definition);
  }
  else {
    window.Prolyfill = definition();
  }
})(function () {
  'use strict';

  // Copy/paste from Lodash
  function isFunction(value) {
    return typeof value === 'function' || false;
  }

  // The current context
  // Depends on if we are running on a browser, or Node, or something else
  var context;

  if (typeof global !== 'undefined') {
    context = global;
  } else if (typeof window !== 'undefined' && window.document) {
    context = window;
  } else {
    context = self;
  }

  // Test if a value can potentially be a valid constructor for a new Promise
  function isValidPromiseConstructor(promise) {
    return promise &&
      (function () {
        var resolve, reject;
        new promise(function (success, error) {
          resolve = success;
          reject = error:
        });
        return isFunction(resolve) && isFunction(reject);
      })();
  }

  // Test if a value match the full spec of Promises A+
  function isValidPromise(promise) {
    return isValidPromiseConstructor(promise)
      promise.resolve &&
      promise.reject &&
      promise.all &&
      promise.race;
  }

  // Test if the current context natively supports Promises A+
  var hasNativePromise = isValidPromise(context.Promise);

  // The result be a function with two arguments
  // - the lib to normalize
  // - some options
  //   - override (default: false): will override the native promise if true
  //   - fallback (default: true): if set to true, will try to return the
  //     native promise if possible, otherwise, will normalize lib
  var Prolyfill = function (lib, opts) {
    // Default options
    opts = opts || {};
    if (opts.override === undefined) {
      opts.override = Prolyfill.defaults.override;
    }
    if (opts.fallback === undefined) {
      opts.fallback = Prolyfill.defaults.fallback;
    }
    if (opts.global === undefined) {
      opts.global = Prolyfill.defaults.global;
    }

    if (!lib) {
      // If there is no lib, it just means that we will only use the native implementation
      return context.Promise;
    } else if (opts.fallback && !opts.override && hasNativePromise) {
      // If we only want to fallback in case the native implementation is missing
      // and we don't want to override it
      // and it's there, let's just return it
      return context.Promise;
    } else {
      // Otherwise, let's start working

      // First is the constructor
      var PromiseResult =
        // Q, RSVP, vow
        lib.Promise ||
        // when, Q <= 0.9.7
        lib.promise ||
        // promise, lie, davy
        (isValidPromiseConstructor(lib) && lib) ||
        // Too bad, the lib does not offer a way to support the standard API out of the box
        // Things are starting to become dirty
        (function () {
          function Promise(resolver) {
            if (!isFunction(resolver)) {
              throw new TypeError('You must pass a resolver function as the first argument to the promise constructor');
            }

            // Try to create a deferred
            if (lib.defer) {
              // kew
              this._deferred = lib.defer();
            } else {
              // deferred
              this._deferred = lib();
            }

            if (deferred && deferred.promise) {
              this._promise = this._deferred.promise;
            }

            function resolve(value) {
              if (this._deferred && this._deferred.resolve) {
                this._deferred.resolve(value);
              }
            }

            function reject(reason) {
              if (this._deferred && this._deferred.reject) {
                this._deferred.reject(reason);
              }
            }

            try {
              resolver(resolve, reject);
            } catch(e) {
              reject(e);
            }
          }

          Promise.prototype = {
            constructor: Promise,

            then: function (onFulfilled, onRejected) {
              if (this._promise && this._promise.then) {
                return this._promise.then(onFulfilled, onRejected);
              }
            },

            'catch': function (onRejected) {
              if (this._promise && this._promise['catch']) {
                return this._promise['catch'](onRejected);
              } else if (this._promise && this._promise.then) {
                return this._promise.then(null, onRejected);
              }
            }
          }

          return Promise;
        })();

      // Next is the static API
      // vow, davy
      if (!PromiseResult.all) {
        PromiseResult.all =
          // bluebird, Q, when, RSVP
          lib.all;
      }

      // vow, davy
      if (!PromiseResult.race) {
        PromiseResult.race =
          // bluebird
          lib.race ||
          // when, vow
          lib.any;
          // Q??? RSVP???
      }

      // vow, davy
      if (!PromiseResult.resolve) {
        PromiseResult.resolve =
          // bluebird, when
          lib.resolve ||
          // Q
          lib.when;
      }

      // vow, davy
      if (!PromiseResult.reject) {
        PromiseResult.reject =
          // bluebird, Q, when
          lib.reject;
      }

      // Let's tag our result to override it if necessary
      PromiseResult.prolyfilled = true;

      if (opts.override ||
        (opts. global && (!hasNativePromise || context.Promise.prolyfilled))) {
        context.Promise = PromiseResult;
      }

      return PromiseResult;
    }
  };

  Prolyfill.defaults = {
    override: false,
    fallback: true,
    global: true
  };

  return Prolyfill;
});
