var prolyfill = require('../prolyfill'),
    _ = require('lodash'),
    promisesAplusTests = require('promises-aplus-tests');

var configurations = {
  none: undefined,
  empty: {}
};

var adapter = function (PromiseImpl) {
  return {
    deferred: function () {
      var deferred = {};
      deferred.promise = new PromiseImpl(function (resolve, reject) {
        deferred.resolve = resolve;
        deferred.reject = reject;
      });
      return deferred;
    },
    resolved: PromiseImpl.resolve.bind(PromiseImpl),
    rejected: PromiseImpl.reject.bind(PromiseImpl)
  };
};

module.exports.test = function (libName, configName) {
  console.log('TESTING', libName, configName);
  jasmine.DEFAULT_TIMEOUT_INTERVAL = 20000;

  it ('should support config ' + configName, function (done) {
    console.log(libName + ' - config', name);
    var Promise = prolyfill(require(libName), configurations[configName]);
    var adapt = adapter(Promise);
    promisesAplusTests(adapt, {reporter: 'progress'}, function (err) {
      console.log(libName + ' - config', name, 'done');
      if (err) {
        // We failed...
        expect(1).toBe(2);
        console.log(err);
      }
      done();
    });
  });
};
