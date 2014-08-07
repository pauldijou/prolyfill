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
 * - RSVP: https://github.com/tildeio/rsvp.js
 * - vow: http://dfilatov.github.io/vow/
 * - promise: https://github.com/then/promise#api
 * - lie: https://github.com/calvinmetcalf/lie#api
 * - deferred: https://github.com/medikoo/deferred
 * - davy: https://github.com/lvivski/davy#api
 *
 * Unsupported libs:
 * - kew: does not work in a browser
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

  var debugEnabled = false;

  function debug() {
    if (debugEnabled) {
      if (console && console.debug) {
        console.debug.apply(console, arguments);
      } else if (console && console.log) {
        console.log.apply(console, arguments);
      }
    }
  }

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
    context = this;
  }

  // Test if a value can potentially be a valid constructor for a new Promise
  function isValidPromiseConstructor(promise) {
    return promise &&
      (function () {
        var resolve, reject;
        new promise(function (success, error) {
          resolve = success;
          reject = error;
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

  // Registered extensions
  var extensions = [];

  // The result be a function with two arguments
  // - the lib to normalize
  // - some options
  //   - override (default: false): will override the native promise if true
  //   - fallback (default: true): if set to true, will try to return the
  //     native promise if possible, otherwise, will normalize lib
  function Prolyfill(lib, opts) {
    opts = opts || {};

    // Default options
    for (var field in Prolyfill.defaults) {
      if (opts[field] === undefined) {
        opts[field] = Prolyfill.defaults[field];
      }
    }

    if (opts.debug) {
      debugEnabled = true;
      debug('Debug enabled');
    }

    // Before doing anything,
    // mostly because of bluebird overriding the native Promise
    // we will try to revert that
    if (context.Promise && isFunction(context.Promise.noConflict)) {
      lib = context.Promise.noConflict();
    }

    if (!lib) {
      // If there is no lib, it just means that we will only use the native implementation
      debug('No lib provided, returning native implementation.')
      return context.Promise;
    } else if (opts.fallback && !opts.override && hasNativePromise) {
      // If we only want to fallback in case the native implementation is missing
      // and we don't want to override it
      // and it's there, let's just return it
      debug('Valid native implementation found, with fallback and no override, returning it.')
      return context.Promise;
    } else {
      // Otherwise, let's start working
      debug('Starting creating a Promise polyfill based on the 1st argument lib...');

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
            var deferred;
            if (lib.defer) {
              // Anyone?
              deferred = lib.defer();
            } else {
              // deferred
              deferred = lib();
            }

            if (deferred && deferred.promise) {
              if (isFunction(deferred.promise)) {
                this._promise = deferred.promise();
              } else {
                this._promise = deferred.promise;
              }
            } else {
              debug('⚠ Could not find a [promise] from the deferred');
            }

            function resolve(value) {
              if (deferred && deferred.resolve) {
                deferred.resolve(value);
              } else {
                debug('⚠ Could not [resolve] the promise');
              }
            }

            function reject(reason) {
              if (deferred && deferred.reject) {
                deferred.reject(reason);
              } else {
                debug('⚠ Could not [reject] the promise');
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
              } else {
                debug('⚠ The deferred promise does not have a [then] method.');
              }
            },

            'catch': function (onRejected) {
              if (this._promise && this._promise['catch']) {
                return this._promise['catch'](onRejected);
              } else if (this._promise && this._promise.then) {
                return this._promise.then(null, onRejected);
              } else {
                debug('⚠ The deferred promise does not have a [catch] method nor a [then] one.');
              }
            }
          }

          return Promise;
        })();

      // Next is the static API

      // promise, vow, davy, lie
      if (!PromiseResult.resolve) {
        debug('No default [Promise.resolve], adding one.');
        PromiseResult.resolve =
          // bluebird, RSVP, when
          lib.resolve ||
          // Q
          lib.when ||
          // deferred
          function (value) {
            return new PromiseResult(function (resolve, reject) {
              resolve(value);
            });
          };
      }

      // promise, vow, davy, lie
      if (!PromiseResult.reject) {
        debug('No default [Promise.reject], adding one.');
        PromiseResult.reject =
          // bluebird, Q, RSVP, when
          lib.reject ||
          // deferred
          function (reason) {
            return new PromiseResult(function (resolve, reject) {
              reject(reason);
            });
          };
      }

      // promise, vow, davy, lie
      if (!PromiseResult.all) {
        debug('No default [Promise.all], adding one.');
        PromiseResult.all =
          // bluebird, Q, when, RSVP
          lib.all ||
          // deferred
          function (promises) {
            if (!promises.length) return PromiseResult.resolve([]);

            var results = [],
                finished = false,
                counter = promises.length;

            return new PromiseResult(function (resolve, reject) {
              for (var i = 0, l = promises.length; i < l; ++i) {
                (function (index) {
                  PromiseResult.resolve(promises[index]).then(function (value) {
                    results[index] = value;
                    --counter;
                    if (!finished && counter === 0) {
                      finished = true;
                      resolve(results);
                    }
                  }, function (reason) {
                    if (!finished) {
                      finished = true;
                      reject(reason);
                    }
                  });
                })(i);
              }
            });
          };
      }

      // promise, vow, davy
      if (!PromiseResult.race) {
        debug('No default [Promise.race], adding one.');
        PromiseResult.race =
          // bluebird, Q, RSVP
          lib.race ||
          // when, vow
          lib.any ||
          // lie, deferred
          function (arr) {
            return new PromiseResult(function (resolve, reject) {
              for (var i = 0, l = arr.length; i < l; ++i) {
                PromiseResult.resolve(arr[i]).then(resolve, reject);
              }
            });
          };
      }
      // Let's tag our result to override it if necessary
      debug('Tagging the result as [prolyfilled]');
      PromiseResult.prolyfilled = true;

      if (opts.override ||
        (opts. global && (!hasNativePromise || context.Promise.prolyfilled))) {
        debug('Assigning the result to the global context.');
        context.Promise = PromiseResult;
      }

      // Out of the box, Prolyfill supports a few handful extensions
      // WARNING: all the following extensions are NOT part of the spec
      // they might be super useful but, again, NOT in the spec

      // Promise.prototype.done
      // Just a [then], but you cannot chain anymore on this promise
      // and if any exception was triggered during promise execution,
      // it will pop up.
      if (opts.extensions && opts.extensions.done) {
        Prolyfill.extend(function (Promise, lib, options) {
          if (!Promise.prototype.done) {
            Promise.prototype.done = function (onFulfilled, onRejected) {
              if (this._promise && this._promise.done) {
                return this._promise.done(onFulfilled, onRejected);
              } else if (this._promise && this._promise.then) {
                debug('Could not find a [done] function, using [then] as a fallback.')
                return this._promise.then(onFulfilled, onRejected);
              } else {
                debug('⚠ The deferred promise does not have a [done] method nor a [then] one.');
              }
            };
          }
        });
      }

      // Promise.settle
      // Input: array of promises
      // Output: when all input promises have been either fulfilled or rejected,
      // returns an array of object containing:
      // - status [string]: 'fulfilled' or 'rejected'
      // - fulfilled [boolean]: true if fulfilled
      // - rejected [boolean]: true if rejected
      // - value [any, optional]: the resolved value when the promise was fulfilled
      // - reason [any, optional]: the reason why the promise was rejected
      if (opts.extensions && opts.extensions.settle) {
        Prolyfill.extend(function (Promise, lib, options) {
          if (!Promise.settle) {
            Promise.settle = function (promises) {
              var settledPromises = [];
              for (var i = 0, l = promises.length; i < l; ++i) {
                settledPromises.push(Promise.resolve(promises[i]).then(function (value) {
                  return {
                    status: 'fulfilled',
                    fulfilled: true,
                    rejected: false,
                    value: value
                  };
                }, function (reason) {
                  return {
                    status: 'rejected',
                    fulfilled: false,
                    rejected: true,
                    reason: reason
                  };
                }));
              }
              return Promise.all(settledPromises);
            };
          }
        });
      }

      // Extend Promise with non spec features
      for (var i = 0, l = extensions.length; i < l; ++i) {
        extensions[i].call(Profyfill, PromiseResult, lib, opts);
      }

      return PromiseResult;
    }
  };

  // Default options
  Prolyfill.defaults = {
    override: false,
    fallback: true,
    global: true,
    // Warning: those are no spec standards
    extensions: {
      done: false,
      settle: false
    }
  };

  // A util method to extend the Promise object
  // Called with an 'extension' function that should accept 3 attributes
  // - the Promise object
  // - the current lib used to polyfill
  // - the Prolyfill options
  Prolyfill.extend = function (extension) {
    extensions.push(extension);
  };

  return Prolyfill;
});
