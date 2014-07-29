# Prolyfill

Polyfill Promises A+ spec with the JavaScript library of your choice.

## Table of content

Coming soon

## How to use it

### As a final user

This example use que Q library, but you can use nearly whatever lib you want.

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

### As a library writer

If your library needs to use promises but you know that native support isn't good enough right now and you don't want to impose an implementation to your final users, Prolyfill is exactly what your need! Just ask users what lib they want to use, prolyfill it, and write all your code using the spec syntax.

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
prolyfill(Q); // now, you have window.Promise using either native or Q

function MyAwesomeLib(promiseLib) {
  prolyfill(promiseLib); // override the current prolyfill with a new one
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
