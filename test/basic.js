// Aliases
var expect = chai.expect;
var should = chai.should;

// Util functions
function doIn(delay, value, fn) {
  setTimeout(function () {
    fn(value);
  }, delay);
};

function test(done, fn) {
  try {
    fn();
  } catch(e) {
    done(e);
  }
  done();
}

function testResolve(done, promise, value) {
  promise.then(function (v) {
    test(done, function () {
      expect(v).to.deep.equal(value);
    });
  }, function (reason) {
    done(new Error('onRejected called with: ' + reason));
  });
}

function testReject(done, promise, reason) {
  promise.then(function (value) {
    done(new Error('onFulfilled called with: ' + value));
  }, function (r) {
    test(done, function () {
      expect(r).to.deep.equal(reason);
    });
  });
}

function testCatch(done, promise, reason) {
  promise.catch(function (r) {
    test(done, function () {
      expect(r).to.deep.equal(reason);
    });
  });
}

// Actual tests
describe('window.Promise', function () {
  it('should exist', function () {
    expect(window.Promise).not.to.be.undefined;
  });
});

describe('Promise.resolve', function () {
  it('should exist', function () {
    expect(window.Promise.resolve).not.to.be.undefined;
  });

  it('should always resolve', function (done) {
    testResolve(done, Promise.resolve(1), 1);
  });
});

describe('Promise.reject', function () {
  it('should exist', function () {
    expect(window.Promise.reject).not.to.be.undefined;
  });

  it('should always reject', function (done) {
    testReject(done, Promise.reject(1), 1);
  });
});

describe('Promise.all', function () {
  it('should exist', function () {
    expect(window.Promise.all).not.to.be.undefined;
  });

  it('should complete when all fullfiled', function (done) {
    var p1 = new Promise(function (res) { doIn(200, 1, res); });
    var p2 = new Promise(function (res) { doIn(100, 2, res); });
    var p3 = new Promise(function (res) { doIn(150, 3, res); });
    testResolve(done, Promise.all([p1, p2, p3]), [1, 2, 3]);
  });

  it('should fail with the first failure', function (done) {
    var p1 = new Promise(function (res) { doIn(100, 1, res); });
    var p2 = new Promise(function (a, rej) { doIn(150, 2, rej); });
    var p3 = new Promise(function (a, rej) { doIn(200, 3, rej); });
    testReject(done, Promise.all([p1, p2, p3]), 2);
  });
});

describe('Promise.race', function () {
  it('should exist', function () {
    expect(window.Promise.race).not.to.be.undefined;
  });

  it('should complete with the first fullfiled', function (done) {
    var p1 = new Promise(function (res) { doIn(200, 1, res); });
    var p2 = new Promise(function (res) { doIn(100, 2, res); });
    var p3 = new Promise(function (res) { doIn(150, 3, res); });
    testResolve(done, Promise.race([p1, p2, p3]), 2);
  });

  it('should fail with the first failure', function (done) {
    var p1 = new Promise(function (res) { doIn(200, 1, res); });
    var p2 = new Promise(function (a, rej) { doIn(100, 2, rej); });
    var p3 = new Promise(function (a, rej) { doIn(150, 3, rej); });
    testReject(done, Promise.race([p1, p2, p3]), 2);
  });
});

describe('Promise instance', function () {
  var success, failure;
  beforeEach(function () {
    success = Promise.resolve(1);
    failure = Promise.reject(2);
  });

  it('should be thenable', function () {
    expect(success.then).not.to.be.undefined;
    expect(failure.then).not.to.be.undefined;
    expect(success.then).to.be.instanceOf(Function);
    expect(failure.then).to.be.instanceOf(Function);
  });

  it('should be catchable', function () {
    expect(success.catch).not.to.be.undefined;
    expect(failure.catch).not.to.be.undefined;
    expect(success.catch).to.be.instanceOf(Function);
    expect(failure.catch).to.be.instanceOf(Function);
  });

  it('should then on 1st arg if fulfilled', function (done) {
    testResolve(done, success, 1);
  });

  it('should then on 2nd arg if rejected', function (done) {
    testReject(done, failure, 2);
  });

  it('should catch on 1st arg if rejected', function (done) {
    testCatch(done, failure, 2);
  });
});

describe('Promise chaining', function () {
  function inc(value) { return ++value; }
  function asyncInc(value) { return Promise.resolve(++value); }
  function error(value) { throw new Error(value); }
  function reject(value) { return Promise.reject(value) }

  var success, failure;
  beforeEach(function () {
    success = Promise.resolve(1);
    failure = Promise.reject(10);
  });

  it('should resolve |> inc', function (done) {
    testResolve(done, success.then(inc), 2);
  });

  it('should resolve |> asyncInc', function (done) {
    testResolve(done, success.then(asyncInc), 2);
  });

  it('should resolve |> inc |> inc', function (done) {
    testResolve(done, success.then(inc).then(inc), 3);
  });

  it('should resolve |> asyncInc |> inc', function (done) {
    testResolve(done, success.then(asyncInc).then(inc), 3);
  });

  it('should resolve |> inc |> asyncInc', function (done) {
    testResolve(done, success.then(inc).then(asyncInc), 3);
  });

  it('should resolve |> asyncInc |> asyncInc', function (done) {
    testResolve(done, success.then(asyncInc).then(asyncInc), 3);
  });

  it('should resolve |> reject', function (done) {
    testReject(done, success.then(reject), 1);
  });

  it('should resolve |> inc |> asyncInc |> reject', function (done) {
    testReject(done, success.then(inc).then(asyncInc).then(reject), 3);
  });

  it('should resolve |> inc |> reject |> asyncInc', function (done) {
    testReject(done, success.then(inc).then(reject).then(asyncInc), 2);
  });

  it('should resolve |> inc |> reject ||> asyncInc', function (done) {
    testResolve(done, success.then(inc).then(reject).then(null, asyncInc), 3);
  });
});
