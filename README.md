# Prolyfill

Polyfill Promises A+ spec with the JavaScript library of your choice.

## Table of content

* How to use it
  * as a final user
  * as a library writer
* Supported libraries
* API
* Options
* Examples
* Extend

## How to use it

### As a final user

You want to use `Prolyfill` in order to create a spec compliant Promise polyfill. The main difference with other polyfills is that this one does not comes with an implementation. Yep, by its own, it will not be able to do anything. You will have to provide the implementation you want to use to create the polyfill. It's a bit more verbose (but really not much) and it gives you total freedom. The following example use the Q library, but you can use nearly whatever lib you want.

~~~ javascript
// In the browser, creating a polyfill inside window.Promise if necessary
Prolyfill(window.Q);
// If you want the polyfill but without overriding window.Promise
var Promise = Prolyfill(window.Q, {global: false});
~~~

~~~ javascript
// In Node or using Browserify
var Promise = require('prolyfill')(require('q'));
~~~

### As a library / framework developer

**Important** Be sure to set `{global: false}` in options so your lib does not write anything inside the global object.

If your library needs to use promises but you know that native support isn't good enough right now and you don't want to impose an implementation to your final users, Prolyfill is exactly what your need! Just ask users what lib they want to use, prolyfill it, and write all your code using the spec syntax.

~~~ javascript
var Q = require('q'), prolyfill = require('prolyfill');
// Important: notice the option 'global' set to 'false'
// so that Prolyfill does not leak anything inside the global object
var Promise = prolyfill(Q, {global: false});
~~~

## Supported libraries

* [bluelbird](https://github.com/petkaantonov/bluebird)
* [Q](https://github.com/kriskowal/q)
* [when](https://github.com/cujojs/when)
* [RSVP](https://github.com/tildeio/rsvp.js)
* [vow](http://dfilatov.github.io/vow)
* [promise](https://github.com/then/promise#api)
* [lie](https://github.com/calvinmetcalf/lie)
* [deferred](https://github.com/medikoo/deferred)
* [davy](https://github.com/lvivski/davy)

Want to add another one? Just fill an issue asking for it or directly create a pull request.

## API



## Options

* **fallback** (default: `true`): if true, Prolyfill will try to use the native Promise if it seems valid enough, otherwise, it will return the polyfilled version of the lib. If false, it will always return the polyfilled version.
* **global** (default: `true`): if true, will write the polyfilled version of the lib inside the global object (ex: inside `window` for a browser) if there is not already a valid one in it. If you are using Prolyfill inside a library, you should set this option to `false` since you probably don't want to do anything outside of your scope.
* **override** (default: `false`): if true, Prolyfill will ignore all other options and write the polyfilled version of the lib inside the global object. The only use case for this option is if you want to write code with the Promise A+ spec syntax but not rely on native implementations yet (because bugs, performances, ...) or just want all users to use the same underlying implementation to prevent any surprise.
* **debug** (default: `false`): if true, will try to display a few messages in the console while creating the polyfill

## Examples

~~~ javascript
Prolyfill(window.Q);

var promise = new Promise(function (resolve, reject) {
  // You can write your code using the spec syntax
  // It will use native window.Promise if possible
  // Otherwise, it will fallback and use Q
});

promise
  .then(function (value) { /* All good! */ })
  .catch(functon (reason) { /* Looks like we failed... */ });
~~~

~~~ javascript
// Before
var Q = require('q');

module.exports = {
  doAwesome: function () {
    var deferred = Q.defer();
    setTimeout(function () {
      console.log('I am async dude!');
      deferred.resolve(true);
    }, 100);
    return deferred.promise;
  }
};

// After (a bit verbose, but that's backward compatibility for you)
var Q = require('q'), prolyfill = require('prolyfill');
// Important: notice the option 'global' set to 'false'
// so that Prolyfill does not leak anything inside the global object
var Promise = prolyfill(Q, {global: false});

function MyAwesomeLib(promiseLib) {
  Promise = prolyfill(promiseLib, {global: false});
}

MyAwesomeLib.doAwesome = function () {
  return new Promise(function (resolve, reject) {
    setTimeout(function () {
      console.log('I am async dude!');
      resolve(true);
    }, 100);
  });
}

module.exports = MyAwesomeLib;
~~~

And for the user, it will translate to the following:

~~~ javascript
// Before, when using your lib
var awesomeLib = require('awesomeLib');

// After
// Can still do as before and use the default promise lib (here, Q)
var awesomeLib = require('awesomeLib');
// Or impose a new promise lib
var bluebird = require('bluebird');
var awesomeLib = require('awesomeLib')(bluebird);
~~~

## Extend

Work in progress...
