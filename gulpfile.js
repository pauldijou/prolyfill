var gulp         = require('gulp');
var _            = require('lodash');
var path         = require('path');
var fs           = require('fs');
var browserify   = require('browserify');
var watchify     = require('watchify');
var source       = require('vinyl-source-stream');
var karma        = require('karma').server;
var $            = require('gulp-load-plugins')();

var libs = {
  'bluebird': {
    global: 'window.bluebird',
    url: ['/bower_components/bluebird/js/browser/bluebird.js']
  },
  'q': {
    global: 'window.Q',
    url: ['/bower_components/q/q.js']
  },
  'rsvp': {
    global: 'window.RSVP',
    url: ['/bower_components/rsvp/rsvp.js']
  },
  'when': {
    global: 'window.When',
    browserify: ['./test/when.js']
  },
  'vow': {
    global: 'global.vow',
    url: ['/bower_components/vow/lib/vow.js']
  },
  'promise': {
    global: 'window.PromiseLib',
    browserify: ['./test/promise.js']
  },
  'lie': {
    global: 'window.Lie',
    url: ['/bower_components/lie/dist/lie.noConflict.js']
  },
  'deferred': {
    global: 'window.Deferred',
    browserify: ['./test/deferred.js']
  },
  'davy': {
    global: 'window.Davy',
    url: ['/bower_components/subsequent/subsequent.js', '/bower_components/davy/davy.js']
  }
};

var configurations = {
  none: undefined,
  empty: {},
  override: {override: true}
};

var tests = {
  promiseAplus: {
    url: '/test/build/promises-aplus.js'
  },
  basic: {
    url: '/test/basic.js'
  }
};

var buildTasks = [];

// Build tests
buildTasks.push('build:test:promiseAplus');
gulp.task('build:test:promiseAplus', function () {
  var bundler = browserify({
    cache: {},
    packageCache: {},
    fullPaths: true
  });

  var testsDir = path.resolve(__dirname, 'node_modules/promises-aplus-tests/lib/tests');
  var testFileNames = fs.readdirSync(testsDir);
  testFileNames.forEach(function (testFileName) {
    if (path.extname(testFileName) === '.js') {
      var testFilePath = path.resolve(testsDir, testFileName);
      bundler.add(testFilePath);
    }
  });

  return bundler
    .bundle()
    .pipe(source('promises-aplus.js'))
    .pipe(gulp.dest('./test/build/'));
});

// Build libs, for each conf, for each test
_.forEach(libs, function (lib, libName) {
  var tasks = [];

  if (lib.browserify) {
    var browserifyTaskName = 'build:test:' + libName + ':browserify';
    tasks.push(browserifyTaskName);
    lib.url = ['/test/build/' + libName + '/' + libName + '.js'];
    gulp.task(browserifyTaskName, function () {
      var bundler = browserify({
        entries: lib.browserify,
        cache: {},
        packageCache: {},
        fullPaths: true
      });

      return bundler
        .bundle()
        .pipe(source(libName + '.js'))
        .pipe(gulp.dest('./test/build/'+ libName +'/'));
    });
  }

  var scripts = '';
  _.forEach(lib.url, function (url) {
    scripts += '<script src="'+url+'"></script>\n';
  });

  _.forEach(configurations, function (config, configName) {
    _.forEach(tests, function (test, testName) {
      var taskName = 'build:test:' + libName + ':' + configName + ':' + testName;
      tasks.push(taskName);
      gulp.task(taskName, function () {
        return gulp.src(['./test/index-template.html'])
          .pipe($.replace('%SCRIPTS%', scripts))
          .pipe($.replace('%LIBRARY_GLOBAL%', lib.global))
          .pipe($.replace('%CONFIGURATION%', JSON.stringify(config)))
          .pipe($.replace('%TEST_URL%', test.url))
          .pipe($.rename(testName + '-' + configName + '.html'))
          .pipe(gulp.dest('test/build/'+ libName +'/'));
      });
    });
  });

  gulp.task('build:test:' + libName,  tasks);
  buildTasks.push('build:test:' + libName);
});

gulp.task('build:test', buildTasks);

// var karmaCommonConf = {
//   browsers: ['Chrome'],
//   frameworks: ['mocha'],
//   files: [
//     './prolyfill.js',
//     './test/bundle/bluebird.js',
//     './test/bundle/promise-tests.js'
//   ]
// };
//
//   gulp.task('karma:' + b, function (done) {
//     karma.start(_.assign({}, karmaCommonConf, {singleRun: true}), done);
//   });
// });

_.forEach(libs, function (libName) {
  gulp.task('test:' + libName, function () {
    return gulp.src(['./test/' + libName + '.js'])
      .pipe($.jasmine());
  });
});

gulp.task('test', $.shell.task(_.map(libs, function (libName) {
  return 'gulp test:' + libName;
})));


gulp.task('serve', function () {
  gulp.src('.')
    .pipe($.webserver({
      livereload: false,
      directoryListing: true
    }));
});


// gulp.task('watch', function () {
// 	gulp.watch(['./test/bundle/bluebird.js'], ['karma:bluebird']);
// });

// gulp.task('default', ['browserify:promise-tests', 'browserify:bluebird', 'watch']);
