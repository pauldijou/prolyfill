# Prolyfill

Polyfill Promises A+ spec with the JavaScript library of your choice.

## Table of content

* [Installation](#installation)
* [How to use it](#how-to-use-it)
  * [as a final user](#as-a-final-user)
  * [as a library / framework developer](#as-a-library--framework-developer)
* [Supported libraries](#supported-libraries)
* [API](#api)
* [Options](#options)
* [Examples](#examples)
* [Extend](#extend)
* [Tests](#tests)

## Installation

### Using Bower

~~~ shell
bower install prolyfill
~~~

### Using NPM

~~~ shell
npm install prolyfill
~~~

### Using a CDN

Coming soon...

### Using script

~~~ markup
<script src="https://rawgit.com/pauldijou/prolyfill/master/prolyfill.js"></script>
~~~

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

If your library needs to use promises but you know that [native support isn't good enough](http://caniuse.com/#feat=promises) right now and you don't want to impose an implementation to your final users, Prolyfill is exactly what your need! Just ask users what lib they want to use, prolyfill it, and write all your code using the spec syntax.

~~~ javascript
var Prolyfill = require('prolyfill');

// We are exposing the library as a function accepting at least one attribute
// which is the promise implementation chosen by the final user
return function (lib) {
  // Important: notice the option 'global' set to 'false'
  // so that Prolyfill does not leak anything inside the global object
  // Also, we will use Q as a fallback if no lib is provided
  // assure backward compatibility
  var Promise = prolyfill(lib || require('q'), {global: false});
  // Do your stuff...
};
~~~

## Supported libraries

* [bluebird](https://github.com/petkaantonov/bluebird)
* [Q](https://github.com/kriskowal/q)
* [when](https://github.com/cujojs/when)
* [RSVP](https://github.com/tildeio/rsvp.js)
* [vow](http://dfilatov.github.io/vow)
* [promise](https://github.com/then/promise#api)
* [lie](https://github.com/calvinmetcalf/lie)
* [deferred](https://github.com/medikoo/deferred)
* [davy](https://github.com/lvivski/davy)

Want to add another one? Just fill [an issue](https://github.com/pauldijou/prolyfill/issues) asking for it or directly create a [pull request](https://github.com/pauldijou/prolyfill/pulls).

## API

`Prolifyll` is a function which takes 2 attributes:

* the library you want to use as the polyfill in case the native Promise implementation isn't present.
* some options, as an object, allowing you to customize how you want to render the polyfill. See the following section for more informations about options.

~~~ javascript
// Really super simple example
Prolyfill(window.RSVP, {fallback: true});
~~~

You can override `Prolyfill` default options by using `Prolyfill.defaults`.

~~~ javascript
// Now, you will no override window.Promise by default
Prolyfill.defaults.global = false;
~~~

You can extend the returned polyfill by using `Prolyfill.extend`. See the [extend](#extend) section for more informations about it.

## Options

* **fallback** (default: `true`): if true, Prolyfill will try to use the native Promise if it seems valid enough, otherwise, it will return the polyfilled version of the lib. If false, it will always return the polyfilled version.
* **global** (default: `true`): if true, will write the polyfilled version of the lib inside the global object (ex: inside `window` for a browser) if there is not already a valid one in it. If you are using Prolyfill inside a library, you should set this option to `false` since you probably don't want to do anything outside of your scope.
* **override** (default: `false`): if true, Prolyfill will ignore all other options and write the polyfilled version of the lib inside the global object. The only use case for this option is if you want to write code with the Promise A+ spec syntax but not rely on native implementations yet (because bugs, performances, ...) or just want all users to use the same underlying implementation to prevent any surprise.
* **debug** (default: `false`): if true, will try to display a few messages in the console while creating the polyfill

## Examples

### Simple use-case inside a browser

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

### Refactor NPM module

This is a super powerful that display a `console.log` and resolve a promise after 100ms. At first, it was using Q as promise implementation, but now it will go under a huge refactoring to support any lib and use it to polyfill Promise (meaning it will also try to use the native implementation). The refactoring is fully backward-compatible.

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
var Q = require('q'), Prolyfill = require('prolyfill');
// Important: notice the option 'global' set to 'false'
// so that Prolyfill does not leak anything inside the global object
var Promise = Prolyfill(Q, {global: false});

function MyAwesomeLib(promiseLib) {
  Promise = Prolyfill(promiseLib, {global: false});
  return MyAwesomeLib;
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

And for the final user, it will translate to the following:

~~~ javascript
// Before, when using the lib
require('awesomeLib').doAwesome().then(...);

// After
// Can still do as before and use the default promise lib (here, Q)
require('awesomeLib').doAwesome().then(...);
// Or impose a new promise lib
var bluebird = require('bluebird');
require('awesomeLib')(bluebird).doAwesome().then(...);
~~~

## Extend

Work in progress...

## Tests

### Manual testing

Setup a local environment

~~~ shell
npm install
bower install
gulp build:test
~~~

Start the test server

~~~ shell
gulp serve
~~~

Browse the tests at [http://localhost:8000/test/build](http://localhost:8000/test/build), pick a library and then choose an HTML file to run a set of test based on a particular configuration. Naming convention is `[test name]-[configuration name].html`.

* [http://localhost:8000/test/build/bluebird/basic-override.html](http://localhost:8000/test/build/bluebird/basic-override.html) will prolyfill **bluebird** and run the **basic** tests (from [here](https://github.com/pauldijou/prolyfill/blob/master/test/basic.js)) using the **override** configuration.
* [http://localhost:8000/test/build/rsvp/promiseAplus-none.html](http://localhost:8000/test/build/rsvp/promiseAplus-none.html) will prolyfill **RSVP** and run all **Promise A+** test (from [here](https://github.com/promises-aplus/promises-tests)) using the **none** configuration.

### Automated testing

Coming soon...
