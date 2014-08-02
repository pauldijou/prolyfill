var deferred = require('deferred');

var context;

if (typeof global !== 'undefined') {
  context = global;
} else if (typeof window !== 'undefined' && window.document) {
  context = window;
} else {
  context = this;
}

context.Deferred = deferred;
