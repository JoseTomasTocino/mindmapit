(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],2:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = setTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    clearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        setTimeout(drainQueue, 0);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],3:[function(require,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],4:[function(require,module,exports){
(function (process,global){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};


// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
exports.deprecate = function(fn, msg) {
  // Allow for deprecating things in the process of starting up.
  if (isUndefined(global.process)) {
    return function() {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
  }

  if (process.noDeprecation === true) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};


var debugs = {};
var debugEnviron;
exports.debuglog = function(set) {
  if (isUndefined(debugEnviron))
    debugEnviron = process.env.NODE_DEBUG || '';
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
      var pid = process.pid;
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
};


/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = require('./support/isBuffer');

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = require('inherits');

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./support/isBuffer":3,"_process":2,"inherits":1}],5:[function(require,module,exports){
// Generated by CoffeeScript 1.8.0
var Dumper, Inline, Utils;

Utils = require('./Utils');

Inline = require('./Inline');

Dumper = (function() {
  function Dumper() {}

  Dumper.indentation = 4;

  Dumper.prototype.dump = function(input, inline, indent, exceptionOnInvalidType, objectEncoder) {
    var key, output, prefix, value, willBeInlined, _i, _len;
    if (inline == null) {
      inline = 0;
    }
    if (indent == null) {
      indent = 0;
    }
    if (exceptionOnInvalidType == null) {
      exceptionOnInvalidType = false;
    }
    if (objectEncoder == null) {
      objectEncoder = null;
    }
    output = '';
    prefix = (indent ? Utils.strRepeat(' ', indent) : '');
    if (inline <= 0 || typeof input !== 'object' || input instanceof Date || Utils.isEmpty(input)) {
      output += prefix + Inline.dump(input, exceptionOnInvalidType, objectEncoder);
    } else {
      if (input instanceof Array) {
        for (_i = 0, _len = input.length; _i < _len; _i++) {
          value = input[_i];
          willBeInlined = inline - 1 <= 0 || typeof value !== 'object' || Utils.isEmpty(value);
          output += prefix + '-' + (willBeInlined ? ' ' : "\n") + this.dump(value, inline - 1, (willBeInlined ? 0 : indent + this.indentation), exceptionOnInvalidType, objectEncoder) + (willBeInlined ? "\n" : '');
        }
      } else {
        for (key in input) {
          value = input[key];
          willBeInlined = inline - 1 <= 0 || typeof value !== 'object' || Utils.isEmpty(value);
          output += prefix + Inline.dump(key, exceptionOnInvalidType, objectEncoder) + ':' + (willBeInlined ? ' ' : "\n") + this.dump(value, inline - 1, (willBeInlined ? 0 : indent + this.indentation), exceptionOnInvalidType, objectEncoder) + (willBeInlined ? "\n" : '');
        }
      }
    }
    return output;
  };

  return Dumper;

})();

module.exports = Dumper;

},{"./Inline":9,"./Utils":13}],6:[function(require,module,exports){
// Generated by CoffeeScript 1.8.0
var Escaper, Pattern;

Pattern = require('./Pattern');

Escaper = (function() {
  var ch;

  function Escaper() {}

  Escaper.LIST_ESCAPEES = ['\\\\', '\\"', '"', "\x00", "\x01", "\x02", "\x03", "\x04", "\x05", "\x06", "\x07", "\x08", "\x09", "\x0a", "\x0b", "\x0c", "\x0d", "\x0e", "\x0f", "\x10", "\x11", "\x12", "\x13", "\x14", "\x15", "\x16", "\x17", "\x18", "\x19", "\x1a", "\x1b", "\x1c", "\x1d", "\x1e", "\x1f", (ch = String.fromCharCode)(0x0085), ch(0x00A0), ch(0x2028), ch(0x2029)];

  Escaper.LIST_ESCAPED = ['\\"', '\\\\', '\\"', "\\0", "\\x01", "\\x02", "\\x03", "\\x04", "\\x05", "\\x06", "\\a", "\\b", "\\t", "\\n", "\\v", "\\f", "\\r", "\\x0e", "\\x0f", "\\x10", "\\x11", "\\x12", "\\x13", "\\x14", "\\x15", "\\x16", "\\x17", "\\x18", "\\x19", "\\x1a", "\\e", "\\x1c", "\\x1d", "\\x1e", "\\x1f", "\\N", "\\_", "\\L", "\\P"];

  Escaper.MAPPING_ESCAPEES_TO_ESCAPED = (function() {
    var i, mapping, _i, _ref;
    mapping = {};
    for (i = _i = 0, _ref = Escaper.LIST_ESCAPEES.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
      mapping[Escaper.LIST_ESCAPEES[i]] = Escaper.LIST_ESCAPED[i];
    }
    return mapping;
  })();

  Escaper.PATTERN_CHARACTERS_TO_ESCAPE = new Pattern('[\\x00-\\x1f]|\xc2\x85|\xc2\xa0|\xe2\x80\xa8|\xe2\x80\xa9');

  Escaper.PATTERN_MAPPING_ESCAPEES = new Pattern(Escaper.LIST_ESCAPEES.join('|'));

  Escaper.PATTERN_SINGLE_QUOTING = new Pattern('[\\s\'":{}[\\],&*#?]|^[-?|<>=!%@`]');

  Escaper.requiresDoubleQuoting = function(value) {
    return this.PATTERN_CHARACTERS_TO_ESCAPE.test(value);
  };

  Escaper.escapeWithDoubleQuotes = function(value) {
    var result;
    result = this.PATTERN_MAPPING_ESCAPEES.replace(value, (function(_this) {
      return function(str) {
        return _this.MAPPING_ESCAPEES_TO_ESCAPED[str];
      };
    })(this));
    return '"' + result + '"';
  };

  Escaper.requiresSingleQuoting = function(value) {
    return this.PATTERN_SINGLE_QUOTING.test(value);
  };

  Escaper.escapeWithSingleQuotes = function(value) {
    return "'" + value.replace(/'/g, "''") + "'";
  };

  return Escaper;

})();

module.exports = Escaper;

},{"./Pattern":11}],7:[function(require,module,exports){
// Generated by CoffeeScript 1.8.0
var DumpException,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

DumpException = (function(_super) {
  __extends(DumpException, _super);

  function DumpException(message, parsedLine, snippet) {
    this.message = message;
    this.parsedLine = parsedLine;
    this.snippet = snippet;
  }

  DumpException.prototype.toString = function() {
    if ((this.parsedLine != null) && (this.snippet != null)) {
      return '<DumpException> ' + this.message + ' (line ' + this.parsedLine + ': \'' + this.snippet + '\')';
    } else {
      return '<DumpException> ' + this.message;
    }
  };

  return DumpException;

})(Error);

module.exports = DumpException;

},{}],8:[function(require,module,exports){
// Generated by CoffeeScript 1.8.0
var ParseException,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

ParseException = (function(_super) {
  __extends(ParseException, _super);

  function ParseException(message, parsedLine, snippet) {
    this.message = message;
    this.parsedLine = parsedLine;
    this.snippet = snippet;
  }

  ParseException.prototype.toString = function() {
    if ((this.parsedLine != null) && (this.snippet != null)) {
      return '<ParseException> ' + this.message + ' (line ' + this.parsedLine + ': \'' + this.snippet + '\')';
    } else {
      return '<ParseException> ' + this.message;
    }
  };

  return ParseException;

})(Error);

module.exports = ParseException;

},{}],9:[function(require,module,exports){
// Generated by CoffeeScript 1.8.0
var DumpException, Escaper, Inline, ParseException, Pattern, Unescaper, Utils,
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

Pattern = require('./Pattern');

Unescaper = require('./Unescaper');

Escaper = require('./Escaper');

Utils = require('./Utils');

ParseException = require('./Exception/ParseException');

DumpException = require('./Exception/DumpException');

Inline = (function() {
  function Inline() {}

  Inline.REGEX_QUOTED_STRING = '(?:"(?:[^"\\\\]*(?:\\\\.[^"\\\\]*)*)"|\'(?:[^\']*(?:\'\'[^\']*)*)\')';

  Inline.PATTERN_TRAILING_COMMENTS = new Pattern('^\\s*#.*$');

  Inline.PATTERN_QUOTED_SCALAR = new Pattern('^' + Inline.REGEX_QUOTED_STRING);

  Inline.PATTERN_THOUSAND_NUMERIC_SCALAR = new Pattern('^(-|\\+)?[0-9,]+(\\.[0-9]+)?$');

  Inline.PATTERN_SCALAR_BY_DELIMITERS = {};

  Inline.settings = {};

  Inline.configure = function(exceptionOnInvalidType, objectDecoder) {
    if (exceptionOnInvalidType == null) {
      exceptionOnInvalidType = null;
    }
    if (objectDecoder == null) {
      objectDecoder = null;
    }
    this.settings.exceptionOnInvalidType = exceptionOnInvalidType;
    this.settings.objectDecoder = objectDecoder;
  };

  Inline.parse = function(value, exceptionOnInvalidType, objectDecoder) {
    var context, result;
    if (exceptionOnInvalidType == null) {
      exceptionOnInvalidType = false;
    }
    if (objectDecoder == null) {
      objectDecoder = null;
    }
    this.settings.exceptionOnInvalidType = exceptionOnInvalidType;
    this.settings.objectDecoder = objectDecoder;
    if (value == null) {
      return '';
    }
    value = Utils.trim(value);
    if (0 === value.length) {
      return '';
    }
    context = {
      exceptionOnInvalidType: exceptionOnInvalidType,
      objectDecoder: objectDecoder,
      i: 0
    };
    switch (value.charAt(0)) {
      case '[':
        result = this.parseSequence(value, context);
        ++context.i;
        break;
      case '{':
        result = this.parseMapping(value, context);
        ++context.i;
        break;
      default:
        result = this.parseScalar(value, null, ['"', "'"], context);
    }
    if (this.PATTERN_TRAILING_COMMENTS.replace(value.slice(context.i), '') !== '') {
      throw new ParseException('Unexpected characters near "' + value.slice(context.i) + '".');
    }
    return result;
  };

  Inline.dump = function(value, exceptionOnInvalidType, objectEncoder) {
    var result, type, _ref;
    if (exceptionOnInvalidType == null) {
      exceptionOnInvalidType = false;
    }
    if (objectEncoder == null) {
      objectEncoder = null;
    }
    if (value == null) {
      return 'null';
    }
    type = typeof value;
    if (type === 'object') {
      if (value instanceof Date) {
        return value.toISOString();
      } else if (objectEncoder != null) {
        result = objectEncoder(value);
        if (typeof result === 'string' || (result != null)) {
          return result;
        }
      }
      return this.dumpObject(value);
    }
    if (type === 'boolean') {
      return (value ? 'true' : 'false');
    }
    if (Utils.isDigits(value)) {
      return (type === 'string' ? "'" + value + "'" : String(parseInt(value)));
    }
    if (Utils.isNumeric(value)) {
      return (type === 'string' ? "'" + value + "'" : String(parseFloat(value)));
    }
    if (type === 'number') {
      return (value === Infinity ? '.Inf' : (value === -Infinity ? '-.Inf' : (isNaN(value) ? '.NaN' : value)));
    }
    if (Escaper.requiresDoubleQuoting(value)) {
      return Escaper.escapeWithDoubleQuotes(value);
    }
    if (Escaper.requiresSingleQuoting(value)) {
      return Escaper.escapeWithSingleQuotes(value);
    }
    if ('' === value) {
      return '""';
    }
    if (Utils.PATTERN_DATE.test(value)) {
      return "'" + value + "'";
    }
    if ((_ref = value.toLowerCase()) === 'null' || _ref === '~' || _ref === 'true' || _ref === 'false') {
      return "'" + value + "'";
    }
    return value;
  };

  Inline.dumpObject = function(value, exceptionOnInvalidType, objectSupport) {
    var key, output, val, _i, _len;
    if (objectSupport == null) {
      objectSupport = null;
    }
    if (value instanceof Array) {
      output = [];
      for (_i = 0, _len = value.length; _i < _len; _i++) {
        val = value[_i];
        output.push(this.dump(val));
      }
      return '[' + output.join(', ') + ']';
    } else {
      output = [];
      for (key in value) {
        val = value[key];
        output.push(this.dump(key) + ': ' + this.dump(val));
      }
      return '{' + output.join(', ') + '}';
    }
  };

  Inline.parseScalar = function(scalar, delimiters, stringDelimiters, context, evaluate) {
    var i, joinedDelimiters, match, output, pattern, strpos, tmp, _ref, _ref1;
    if (delimiters == null) {
      delimiters = null;
    }
    if (stringDelimiters == null) {
      stringDelimiters = ['"', "'"];
    }
    if (context == null) {
      context = null;
    }
    if (evaluate == null) {
      evaluate = true;
    }
    if (context == null) {
      context = {
        exceptionOnInvalidType: this.settings.exceptionOnInvalidType,
        objectDecoder: this.settings.objectDecoder,
        i: 0
      };
    }
    i = context.i;
    if (_ref = scalar.charAt(i), __indexOf.call(stringDelimiters, _ref) >= 0) {
      output = this.parseQuotedScalar(scalar, context);
      i = context.i;
      if (delimiters != null) {
        tmp = Utils.ltrim(scalar.slice(i), ' ');
        if (!(_ref1 = tmp.charAt(0), __indexOf.call(delimiters, _ref1) >= 0)) {
          throw new ParseException('Unexpected characters (' + scalar.slice(i) + ').');
        }
      }
    } else {
      if (!delimiters) {
        output = scalar.slice(i);
        i += output.length;
        strpos = output.indexOf(' #');
        if (strpos !== -1) {
          output = Utils.rtrim(output.slice(0, strpos));
        }
      } else {
        joinedDelimiters = delimiters.join('|');
        pattern = this.PATTERN_SCALAR_BY_DELIMITERS[joinedDelimiters];
        if (pattern == null) {
          pattern = new Pattern('^(.+?)(' + joinedDelimiters + ')');
          this.PATTERN_SCALAR_BY_DELIMITERS[joinedDelimiters] = pattern;
        }
        if (match = pattern.exec(scalar.slice(i))) {
          output = match[1];
          i += output.length;
        } else {
          throw new ParseException('Malformed inline YAML string (' + scalar + ').');
        }
      }
      if (evaluate) {
        output = this.evaluateScalar(output, context);
      }
    }
    context.i = i;
    return output;
  };

  Inline.parseQuotedScalar = function(scalar, context) {
    var i, match, output;
    i = context.i;
    if (!(match = this.PATTERN_QUOTED_SCALAR.exec(scalar.slice(i)))) {
      throw new ParseException('Malformed inline YAML string (' + scalar.slice(i) + ').');
    }
    output = match[0].substr(1, match[0].length - 2);
    if ('"' === scalar.charAt(i)) {
      output = Unescaper.unescapeDoubleQuotedString(output);
    } else {
      output = Unescaper.unescapeSingleQuotedString(output);
    }
    i += match[0].length;
    context.i = i;
    return output;
  };

  Inline.parseSequence = function(sequence, context) {
    var e, i, isQuoted, len, output, value, _ref;
    output = [];
    len = sequence.length;
    i = context.i;
    i += 1;
    while (i < len) {
      context.i = i;
      switch (sequence.charAt(i)) {
        case '[':
          output.push(this.parseSequence(sequence, context));
          i = context.i;
          break;
        case '{':
          output.push(this.parseMapping(sequence, context));
          i = context.i;
          break;
        case ']':
          return output;
        case ',':
        case ' ':
        case "\n":
          break;
        default:
          isQuoted = ((_ref = sequence.charAt(i)) === '"' || _ref === "'");
          value = this.parseScalar(sequence, [',', ']'], ['"', "'"], context);
          i = context.i;
          if (!isQuoted && typeof value === 'string' && (value.indexOf(': ') !== -1 || value.indexOf(":\n") !== -1)) {
            try {
              value = this.parseMapping('{' + value + '}');
            } catch (_error) {
              e = _error;
            }
          }
          output.push(value);
          --i;
      }
      ++i;
    }
    throw new ParseException('Malformed inline YAML string ' + sequence);
  };

  Inline.parseMapping = function(mapping, context) {
    var done, i, key, len, output, shouldContinueWhileLoop, value;
    output = {};
    len = mapping.length;
    i = context.i;
    i += 1;
    shouldContinueWhileLoop = false;
    while (i < len) {
      context.i = i;
      switch (mapping.charAt(i)) {
        case ' ':
        case ',':
        case "\n":
          ++i;
          context.i = i;
          shouldContinueWhileLoop = true;
          break;
        case '}':
          return output;
      }
      if (shouldContinueWhileLoop) {
        shouldContinueWhileLoop = false;
        continue;
      }
      key = this.parseScalar(mapping, [':', ' ', "\n"], ['"', "'"], context, false);
      i = context.i;
      done = false;
      while (i < len) {
        context.i = i;
        switch (mapping.charAt(i)) {
          case '[':
            value = this.parseSequence(mapping, context);
            i = context.i;
            if (output[key] === void 0) {
              output[key] = value;
            }
            done = true;
            break;
          case '{':
            value = this.parseMapping(mapping, context);
            i = context.i;
            if (output[key] === void 0) {
              output[key] = value;
            }
            done = true;
            break;
          case ':':
          case ' ':
          case "\n":
            break;
          default:
            value = this.parseScalar(mapping, [',', '}'], ['"', "'"], context);
            i = context.i;
            if (output[key] === void 0) {
              output[key] = value;
            }
            done = true;
            --i;
        }
        ++i;
        if (done) {
          break;
        }
      }
    }
    throw new ParseException('Malformed inline YAML string ' + mapping);
  };

  Inline.evaluateScalar = function(scalar, context) {
    var cast, date, exceptionOnInvalidType, firstChar, firstSpace, firstWord, objectDecoder, raw, scalarLower, subValue, trimmedScalar;
    scalar = Utils.trim(scalar);
    scalarLower = scalar.toLowerCase();
    switch (scalarLower) {
      case 'null':
      case '':
      case '~':
        return null;
      case 'true':
        return true;
      case 'false':
        return false;
      case '.inf':
        return Infinity;
      case '.nan':
        return NaN;
      case '-.inf':
        return Infinity;
      default:
        firstChar = scalarLower.charAt(0);
        switch (firstChar) {
          case '!':
            firstSpace = scalar.indexOf(' ');
            if (firstSpace === -1) {
              firstWord = scalarLower;
            } else {
              firstWord = scalarLower.slice(0, firstSpace);
            }
            switch (firstWord) {
              case '!':
                if (firstSpace !== -1) {
                  return parseInt(this.parseScalar(scalar.slice(2)));
                }
                return null;
              case '!str':
                return Utils.ltrim(scalar.slice(4));
              case '!!str':
                return Utils.ltrim(scalar.slice(5));
              case '!!int':
                return parseInt(this.parseScalar(scalar.slice(5)));
              case '!!bool':
                return Utils.parseBoolean(this.parseScalar(scalar.slice(6)), false);
              case '!!float':
                return parseFloat(this.parseScalar(scalar.slice(7)));
              case '!!timestamp':
                return Utils.stringToDate(Utils.ltrim(scalar.slice(11)));
              default:
                if (context == null) {
                  context = {
                    exceptionOnInvalidType: this.settings.exceptionOnInvalidType,
                    objectDecoder: this.settings.objectDecoder,
                    i: 0
                  };
                }
                objectDecoder = context.objectDecoder, exceptionOnInvalidType = context.exceptionOnInvalidType;
                if (objectDecoder) {
                  trimmedScalar = Utils.rtrim(scalar);
                  firstSpace = trimmedScalar.indexOf(' ');
                  if (firstSpace === -1) {
                    return objectDecoder(trimmedScalar, null);
                  } else {
                    subValue = Utils.ltrim(trimmedScalar.slice(firstSpace + 1));
                    if (!(subValue.length > 0)) {
                      subValue = null;
                    }
                    return objectDecoder(trimmedScalar.slice(0, firstSpace), subValue);
                  }
                }
                if (exceptionOnInvalidType) {
                  throw new ParseException('Custom object support when parsing a YAML file has been disabled.');
                }
                return null;
            }
            break;
          case '0':
            if ('0x' === scalar.slice(0, 2)) {
              return Utils.hexDec(scalar);
            } else if (Utils.isDigits(scalar)) {
              return Utils.octDec(scalar);
            } else if (Utils.isNumeric(scalar)) {
              return parseFloat(scalar);
            } else {
              return scalar;
            }
            break;
          case '+':
            if (Utils.isDigits(scalar)) {
              raw = scalar;
              cast = parseInt(raw);
              if (raw === String(cast)) {
                return cast;
              } else {
                return raw;
              }
            } else if (Utils.isNumeric(scalar)) {
              return parseFloat(scalar);
            } else if (this.PATTERN_THOUSAND_NUMERIC_SCALAR.test(scalar)) {
              return parseFloat(scalar.replace(',', ''));
            }
            return scalar;
          case '-':
            if (Utils.isDigits(scalar.slice(1))) {
              if ('0' === scalar.charAt(1)) {
                return -Utils.octDec(scalar.slice(1));
              } else {
                raw = scalar.slice(1);
                cast = parseInt(raw);
                if (raw === String(cast)) {
                  return -cast;
                } else {
                  return -raw;
                }
              }
            } else if (Utils.isNumeric(scalar)) {
              return parseFloat(scalar);
            } else if (this.PATTERN_THOUSAND_NUMERIC_SCALAR.test(scalar)) {
              return parseFloat(scalar.replace(',', ''));
            }
            return scalar;
          default:
            if (date = Utils.stringToDate(scalar)) {
              return date;
            } else if (Utils.isNumeric(scalar)) {
              return parseFloat(scalar);
            } else if (this.PATTERN_THOUSAND_NUMERIC_SCALAR.test(scalar)) {
              return parseFloat(scalar.replace(',', ''));
            }
            return scalar;
        }
    }
  };

  return Inline;

})();

module.exports = Inline;

},{"./Escaper":6,"./Exception/DumpException":7,"./Exception/ParseException":8,"./Pattern":11,"./Unescaper":12,"./Utils":13}],10:[function(require,module,exports){
// Generated by CoffeeScript 1.8.0
var Inline, ParseException, Parser, Pattern, Utils;

Inline = require('./Inline');

Pattern = require('./Pattern');

Utils = require('./Utils');

ParseException = require('./Exception/ParseException');

Parser = (function() {
  Parser.prototype.PATTERN_FOLDED_SCALAR_ALL = new Pattern('^(?:(?<type>![^\\|>]*)\\s+)?(?<separator>\\||>)(?<modifiers>\\+|\\-|\\d+|\\+\\d+|\\-\\d+|\\d+\\+|\\d+\\-)?(?<comments> +#.*)?$');

  Parser.prototype.PATTERN_FOLDED_SCALAR_END = new Pattern('(?<separator>\\||>)(?<modifiers>\\+|\\-|\\d+|\\+\\d+|\\-\\d+|\\d+\\+|\\d+\\-)?(?<comments> +#.*)?$');

  Parser.prototype.PATTERN_SEQUENCE_ITEM = new Pattern('^\\-((?<leadspaces>\\s+)(?<value>.+?))?\\s*$');

  Parser.prototype.PATTERN_ANCHOR_VALUE = new Pattern('^&(?<ref>[^ ]+) *(?<value>.*)');

  Parser.prototype.PATTERN_COMPACT_NOTATION = new Pattern('^(?<key>' + Inline.REGEX_QUOTED_STRING + '|[^ \'"\\{\\[].*?) *\\:(\\s+(?<value>.+?))?\\s*$');

  Parser.prototype.PATTERN_MAPPING_ITEM = new Pattern('^(?<key>' + Inline.REGEX_QUOTED_STRING + '|[^ \'"\\[\\{].*?) *\\:(\\s+(?<value>.+?))?\\s*$');

  Parser.prototype.PATTERN_DECIMAL = new Pattern('\\d+');

  Parser.prototype.PATTERN_INDENT_SPACES = new Pattern('^ +');

  Parser.prototype.PATTERN_TRAILING_LINES = new Pattern('(\n*)$');

  Parser.prototype.PATTERN_YAML_HEADER = new Pattern('^\\%YAML[: ][\\d\\.]+.*\n');

  Parser.prototype.PATTERN_LEADING_COMMENTS = new Pattern('^(\\#.*?\n)+');

  Parser.prototype.PATTERN_DOCUMENT_MARKER_START = new Pattern('^\\-\\-\\-.*?\n');

  Parser.prototype.PATTERN_DOCUMENT_MARKER_END = new Pattern('^\\.\\.\\.\\s*$');

  Parser.prototype.PATTERN_FOLDED_SCALAR_BY_INDENTATION = {};

  Parser.prototype.CONTEXT_NONE = 0;

  Parser.prototype.CONTEXT_SEQUENCE = 1;

  Parser.prototype.CONTEXT_MAPPING = 2;

  function Parser(offset) {
    this.offset = offset != null ? offset : 0;
    this.lines = [];
    this.currentLineNb = -1;
    this.currentLine = '';
    this.refs = {};
  }

  Parser.prototype.parse = function(value, exceptionOnInvalidType, objectDecoder) {
    var alias, allowOverwrite, block, c, context, data, e, first, i, indent, isRef, k, key, lastKey, lineCount, matches, mergeNode, parsed, parsedItem, parser, refName, refValue, val, values, _i, _j, _k, _l, _len, _len1, _len2, _len3, _name, _ref, _ref1, _ref2;
    if (exceptionOnInvalidType == null) {
      exceptionOnInvalidType = false;
    }
    if (objectDecoder == null) {
      objectDecoder = null;
    }
    this.currentLineNb = -1;
    this.currentLine = '';
    this.lines = this.cleanup(value).split("\n");
    data = null;
    context = this.CONTEXT_NONE;
    allowOverwrite = false;
    while (this.moveToNextLine()) {
      if (this.isCurrentLineEmpty()) {
        continue;
      }
      if ("\t" === this.currentLine[0]) {
        throw new ParseException('A YAML file cannot contain tabs as indentation.', this.getRealCurrentLineNb() + 1, this.currentLine);
      }
      isRef = mergeNode = false;
      if (values = this.PATTERN_SEQUENCE_ITEM.exec(this.currentLine)) {
        if (this.CONTEXT_MAPPING === context) {
          throw new ParseException('You cannot define a sequence item when in a mapping');
        }
        context = this.CONTEXT_SEQUENCE;
        if (data == null) {
          data = [];
        }
        if ((values.value != null) && (matches = this.PATTERN_ANCHOR_VALUE.exec(values.value))) {
          isRef = matches.ref;
          values.value = matches.value;
        }
        if (!(values.value != null) || '' === Utils.trim(values.value, ' ') || Utils.ltrim(values.value, ' ').indexOf('#') === 0) {
          if (this.currentLineNb < this.lines.length - 1 && !this.isNextLineUnIndentedCollection()) {
            c = this.getRealCurrentLineNb() + 1;
            parser = new Parser(c);
            parser.refs = this.refs;
            data.push(parser.parse(this.getNextEmbedBlock(null, true), exceptionOnInvalidType, objectDecoder));
          } else {
            data.push(null);
          }
        } else {
          if (((_ref = values.leadspaces) != null ? _ref.length : void 0) && (matches = this.PATTERN_COMPACT_NOTATION.exec(values.value))) {
            c = this.getRealCurrentLineNb();
            parser = new Parser(c);
            parser.refs = this.refs;
            block = values.value;
            indent = this.getCurrentLineIndentation();
            if (this.isNextLineIndented(false)) {
              block += "\n" + this.getNextEmbedBlock(indent + values.leadspaces.length + 1, true);
            }
            data.push(parser.parse(block, exceptionOnInvalidType, objectDecoder));
          } else {
            data.push(this.parseValue(values.value, exceptionOnInvalidType, objectDecoder));
          }
        }
      } else if ((values = this.PATTERN_MAPPING_ITEM.exec(this.currentLine)) && values.key.indexOf(' #') === -1) {
        if (this.CONTEXT_SEQUENCE === context) {
          throw new ParseException('You cannot define a mapping item when in a sequence');
        }
        context = this.CONTEXT_MAPPING;
        if (data == null) {
          data = {};
        }
        Inline.configure(exceptionOnInvalidType, objectDecoder);
        try {
          key = Inline.parseScalar(values.key);
        } catch (_error) {
          e = _error;
          e.parsedLine = this.getRealCurrentLineNb() + 1;
          e.snippet = this.currentLine;
          throw e;
        }
        if ('<<' === key) {
          mergeNode = true;
          allowOverwrite = true;
          if (((_ref1 = values.value) != null ? _ref1.indexOf('*') : void 0) === 0) {
            refName = values.value.slice(1);
            if (this.refs[refName] == null) {
              throw new ParseException('Reference "' + refName + '" does not exist.', this.getRealCurrentLineNb() + 1, this.currentLine);
            }
            refValue = this.refs[refName];
            if (typeof refValue !== 'object') {
              throw new ParseException('YAML merge keys used with a scalar value instead of an object.', this.getRealCurrentLineNb() + 1, this.currentLine);
            }
            if (refValue instanceof Array) {
              for (i = _i = 0, _len = refValue.length; _i < _len; i = ++_i) {
                value = refValue[i];
                if (data[_name = String(i)] == null) {
                  data[_name] = value;
                }
              }
            } else {
              for (key in refValue) {
                value = refValue[key];
                if (data[key] == null) {
                  data[key] = value;
                }
              }
            }
          } else {
            if ((values.value != null) && values.value !== '') {
              value = values.value;
            } else {
              value = this.getNextEmbedBlock();
            }
            c = this.getRealCurrentLineNb() + 1;
            parser = new Parser(c);
            parser.refs = this.refs;
            parsed = parser.parse(value, exceptionOnInvalidType);
            if (typeof parsed !== 'object') {
              throw new ParseException('YAML merge keys used with a scalar value instead of an object.', this.getRealCurrentLineNb() + 1, this.currentLine);
            }
            if (parsed instanceof Array) {
              for (_j = 0, _len1 = parsed.length; _j < _len1; _j++) {
                parsedItem = parsed[_j];
                if (typeof parsedItem !== 'object') {
                  throw new ParseException('Merge items must be objects.', this.getRealCurrentLineNb() + 1, parsedItem);
                }
                if (parsedItem instanceof Array) {
                  for (i = _k = 0, _len2 = parsedItem.length; _k < _len2; i = ++_k) {
                    value = parsedItem[i];
                    k = String(i);
                    if (!data.hasOwnProperty(k)) {
                      data[k] = value;
                    }
                  }
                } else {
                  for (key in parsedItem) {
                    value = parsedItem[key];
                    if (!data.hasOwnProperty(key)) {
                      data[key] = value;
                    }
                  }
                }
              }
            } else {
              for (key in parsed) {
                value = parsed[key];
                if (!data.hasOwnProperty(key)) {
                  data[key] = value;
                }
              }
            }
          }
        } else if ((values.value != null) && (matches = this.PATTERN_ANCHOR_VALUE.exec(values.value))) {
          isRef = matches.ref;
          values.value = matches.value;
        }
        if (mergeNode) {

        } else if (!(values.value != null) || '' === Utils.trim(values.value, ' ') || Utils.ltrim(values.value, ' ').indexOf('#') === 0) {
          if (!(this.isNextLineIndented()) && !(this.isNextLineUnIndentedCollection())) {
            if (allowOverwrite || data[key] === void 0) {
              data[key] = null;
            }
          } else {
            c = this.getRealCurrentLineNb() + 1;
            parser = new Parser(c);
            parser.refs = this.refs;
            val = parser.parse(this.getNextEmbedBlock(), exceptionOnInvalidType, objectDecoder);
            if (allowOverwrite || data[key] === void 0) {
              data[key] = val;
            }
          }
        } else {
          val = this.parseValue(values.value, exceptionOnInvalidType, objectDecoder);
          if (allowOverwrite || data[key] === void 0) {
            data[key] = val;
          }
        }
      } else {
        lineCount = this.lines.length;
        if (1 === lineCount || (2 === lineCount && Utils.isEmpty(this.lines[1]))) {
          try {
            value = Inline.parse(this.lines[0], exceptionOnInvalidType, objectDecoder);
          } catch (_error) {
            e = _error;
            e.parsedLine = this.getRealCurrentLineNb() + 1;
            e.snippet = this.currentLine;
            throw e;
          }
          if (typeof value === 'object') {
            if (value instanceof Array) {
              first = value[0];
            } else {
              for (key in value) {
                first = value[key];
                break;
              }
            }
            if (typeof first === 'string' && first.indexOf('*') === 0) {
              data = [];
              for (_l = 0, _len3 = value.length; _l < _len3; _l++) {
                alias = value[_l];
                data.push(this.refs[alias.slice(1)]);
              }
              value = data;
            }
          }
          return value;
        } else if ((_ref2 = Utils.ltrim(value).charAt(0)) === '[' || _ref2 === '{') {
          try {
            return Inline.parse(value, exceptionOnInvalidType, objectDecoder);
          } catch (_error) {
            e = _error;
            e.parsedLine = this.getRealCurrentLineNb() + 1;
            e.snippet = this.currentLine;
            throw e;
          }
        }
        throw new ParseException('Unable to parse.', this.getRealCurrentLineNb() + 1, this.currentLine);
      }
      if (isRef) {
        if (data instanceof Array) {
          this.refs[isRef] = data[data.length - 1];
        } else {
          lastKey = null;
          for (key in data) {
            lastKey = key;
          }
          this.refs[isRef] = data[lastKey];
        }
      }
    }
    if (Utils.isEmpty(data)) {
      return null;
    } else {
      return data;
    }
  };

  Parser.prototype.getRealCurrentLineNb = function() {
    return this.currentLineNb + this.offset;
  };

  Parser.prototype.getCurrentLineIndentation = function() {
    return this.currentLine.length - Utils.ltrim(this.currentLine, ' ').length;
  };

  Parser.prototype.getNextEmbedBlock = function(indentation, includeUnindentedCollection) {
    var data, indent, isItUnindentedCollection, newIndent, removeComments, removeCommentsPattern, unindentedEmbedBlock;
    if (indentation == null) {
      indentation = null;
    }
    if (includeUnindentedCollection == null) {
      includeUnindentedCollection = false;
    }
    this.moveToNextLine();
    if (indentation == null) {
      newIndent = this.getCurrentLineIndentation();
      unindentedEmbedBlock = this.isStringUnIndentedCollectionItem(this.currentLine);
      if (!(this.isCurrentLineEmpty()) && 0 === newIndent && !unindentedEmbedBlock) {
        throw new ParseException('Indentation problem.', this.getRealCurrentLineNb() + 1, this.currentLine);
      }
    } else {
      newIndent = indentation;
    }
    data = [this.currentLine.slice(newIndent)];
    if (!includeUnindentedCollection) {
      isItUnindentedCollection = this.isStringUnIndentedCollectionItem(this.currentLine);
    }
    removeCommentsPattern = this.PATTERN_FOLDED_SCALAR_END;
    removeComments = !removeCommentsPattern.test(this.currentLine);
    while (this.moveToNextLine()) {
      indent = this.getCurrentLineIndentation();
      if (indent === newIndent) {
        removeComments = !removeCommentsPattern.test(this.currentLine);
      }
      if (isItUnindentedCollection && !this.isStringUnIndentedCollectionItem(this.currentLine) && indent === newIndent) {
        this.moveToPreviousLine();
        break;
      }
      if (this.isCurrentLineBlank()) {
        data.push(this.currentLine.slice(newIndent));
        continue;
      }
      if (removeComments && this.isCurrentLineComment()) {
        if (indent === newIndent) {
          continue;
        }
      }
      if (indent >= newIndent) {
        data.push(this.currentLine.slice(newIndent));
      } else if (Utils.ltrim(this.currentLine).charAt(0) === '#') {

      } else if (0 === indent) {
        this.moveToPreviousLine();
        break;
      } else {
        throw new ParseException('Indentation problem.', this.getRealCurrentLineNb() + 1, this.currentLine);
      }
    }
    return data.join("\n");
  };

  Parser.prototype.moveToNextLine = function() {
    if (this.currentLineNb >= this.lines.length - 1) {
      return false;
    }
    this.currentLine = this.lines[++this.currentLineNb];
    return true;
  };

  Parser.prototype.moveToPreviousLine = function() {
    this.currentLine = this.lines[--this.currentLineNb];
  };

  Parser.prototype.parseValue = function(value, exceptionOnInvalidType, objectDecoder) {
    var e, foldedIndent, matches, modifiers, pos, val, _ref, _ref1;
    if (0 === value.indexOf('*')) {
      pos = value.indexOf('#');
      if (pos !== -1) {
        value = value.substr(1, pos - 2);
      } else {
        value = value.slice(1);
      }
      if (this.refs[value] === void 0) {
        throw new ParseException('Reference "' + value + '" does not exist.', this.currentLine);
      }
      return this.refs[value];
    }
    if (matches = this.PATTERN_FOLDED_SCALAR_ALL.exec(value)) {
      modifiers = (_ref = matches.modifiers) != null ? _ref : '';
      foldedIndent = Math.abs(parseInt(modifiers));
      if (isNaN(foldedIndent)) {
        foldedIndent = 0;
      }
      val = this.parseFoldedScalar(matches.separator, this.PATTERN_DECIMAL.replace(modifiers, ''), foldedIndent);
      if (matches.type != null) {
        Inline.configure(exceptionOnInvalidType, objectDecoder);
        return Inline.parseScalar(matches.type + ' ' + val);
      } else {
        return val;
      }
    }
    try {
      return Inline.parse(value, exceptionOnInvalidType, objectDecoder);
    } catch (_error) {
      e = _error;
      if (((_ref1 = value.charAt(0)) === '[' || _ref1 === '{') && e instanceof ParseException && this.isNextLineIndented()) {
        value += "\n" + this.getNextEmbedBlock();
        try {
          return Inline.parse(value, exceptionOnInvalidType, objectDecoder);
        } catch (_error) {
          e = _error;
          e.parsedLine = this.getRealCurrentLineNb() + 1;
          e.snippet = this.currentLine;
          throw e;
        }
      } else {
        e.parsedLine = this.getRealCurrentLineNb() + 1;
        e.snippet = this.currentLine;
        throw e;
      }
    }
  };

  Parser.prototype.parseFoldedScalar = function(separator, indicator, indentation) {
    var isCurrentLineBlank, line, matches, newText, notEOF, pattern, text, _i, _len, _ref;
    if (indicator == null) {
      indicator = '';
    }
    if (indentation == null) {
      indentation = 0;
    }
    notEOF = this.moveToNextLine();
    if (!notEOF) {
      return '';
    }
    isCurrentLineBlank = this.isCurrentLineBlank();
    text = '';
    while (notEOF && isCurrentLineBlank) {
      if (notEOF = this.moveToNextLine()) {
        text += "\n";
        isCurrentLineBlank = this.isCurrentLineBlank();
      }
    }
    if (0 === indentation) {
      if (matches = this.PATTERN_INDENT_SPACES.exec(this.currentLine)) {
        indentation = matches[0].length;
      }
    }
    if (indentation > 0) {
      pattern = this.PATTERN_FOLDED_SCALAR_BY_INDENTATION[indentation];
      if (pattern == null) {
        pattern = new Pattern('^ {' + indentation + '}(.*)$');
        Parser.prototype.PATTERN_FOLDED_SCALAR_BY_INDENTATION[indentation] = pattern;
      }
      while (notEOF && (isCurrentLineBlank || (matches = pattern.exec(this.currentLine)))) {
        if (isCurrentLineBlank) {
          text += this.currentLine.slice(indentation);
        } else {
          text += matches[1];
        }
        if (notEOF = this.moveToNextLine()) {
          text += "\n";
          isCurrentLineBlank = this.isCurrentLineBlank();
        }
      }
    } else if (notEOF) {
      text += "\n";
    }
    if (notEOF) {
      this.moveToPreviousLine();
    }
    if ('>' === separator) {
      newText = '';
      _ref = text.split("\n");
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        line = _ref[_i];
        if (line.length === 0 || line.charAt(0) === ' ') {
          newText = Utils.rtrim(newText, ' ') + line + "\n";
        } else {
          newText += line + ' ';
        }
      }
      text = newText;
    }
    if ('+' !== indicator) {
      text = Utils.rtrim(text);
    }
    if ('' === indicator) {
      text = this.PATTERN_TRAILING_LINES.replace(text, "\n");
    } else if ('-' === indicator) {
      text = this.PATTERN_TRAILING_LINES.replace(text, '');
    }
    return text;
  };

  Parser.prototype.isNextLineIndented = function(ignoreComments) {
    var EOF, currentIndentation, ret;
    if (ignoreComments == null) {
      ignoreComments = true;
    }
    currentIndentation = this.getCurrentLineIndentation();
    EOF = !this.moveToNextLine();
    if (ignoreComments) {
      while (!EOF && this.isCurrentLineEmpty()) {
        EOF = !this.moveToNextLine();
      }
    } else {
      while (!EOF && this.isCurrentLineBlank()) {
        EOF = !this.moveToNextLine();
      }
    }
    if (EOF) {
      return false;
    }
    ret = false;
    if (this.getCurrentLineIndentation() > currentIndentation) {
      ret = true;
    }
    this.moveToPreviousLine();
    return ret;
  };

  Parser.prototype.isCurrentLineEmpty = function() {
    var trimmedLine;
    trimmedLine = Utils.trim(this.currentLine, ' ');
    return trimmedLine.length === 0 || trimmedLine.charAt(0) === '#';
  };

  Parser.prototype.isCurrentLineBlank = function() {
    return '' === Utils.trim(this.currentLine, ' ');
  };

  Parser.prototype.isCurrentLineComment = function() {
    var ltrimmedLine;
    ltrimmedLine = Utils.ltrim(this.currentLine, ' ');
    return ltrimmedLine.charAt(0) === '#';
  };

  Parser.prototype.cleanup = function(value) {
    var count, i, indent, line, lines, smallestIndent, trimmedValue, _i, _j, _len, _len1, _ref, _ref1, _ref2;
    if (value.indexOf("\r") !== -1) {
      value = value.split("\r\n").join("\n").split("\r").join("\n");
    }
    count = 0;
    _ref = this.PATTERN_YAML_HEADER.replaceAll(value, ''), value = _ref[0], count = _ref[1];
    this.offset += count;
    _ref1 = this.PATTERN_LEADING_COMMENTS.replaceAll(value, '', 1), trimmedValue = _ref1[0], count = _ref1[1];
    if (count === 1) {
      this.offset += Utils.subStrCount(value, "\n") - Utils.subStrCount(trimmedValue, "\n");
      value = trimmedValue;
    }
    _ref2 = this.PATTERN_DOCUMENT_MARKER_START.replaceAll(value, '', 1), trimmedValue = _ref2[0], count = _ref2[1];
    if (count === 1) {
      this.offset += Utils.subStrCount(value, "\n") - Utils.subStrCount(trimmedValue, "\n");
      value = trimmedValue;
      value = this.PATTERN_DOCUMENT_MARKER_END.replace(value, '');
    }
    lines = value.split("\n");
    smallestIndent = -1;
    for (_i = 0, _len = lines.length; _i < _len; _i++) {
      line = lines[_i];
      indent = line.length - Utils.ltrim(line).length;
      if (smallestIndent === -1 || indent < smallestIndent) {
        smallestIndent = indent;
      }
    }
    if (smallestIndent > 0) {
      for (i = _j = 0, _len1 = lines.length; _j < _len1; i = ++_j) {
        line = lines[i];
        lines[i] = line.slice(smallestIndent);
      }
      value = lines.join("\n");
    }
    return value;
  };

  Parser.prototype.isNextLineUnIndentedCollection = function(currentIndentation) {
    var notEOF, ret;
    if (currentIndentation == null) {
      currentIndentation = null;
    }
    if (currentIndentation == null) {
      currentIndentation = this.getCurrentLineIndentation();
    }
    notEOF = this.moveToNextLine();
    while (notEOF && this.isCurrentLineEmpty()) {
      notEOF = this.moveToNextLine();
    }
    if (false === notEOF) {
      return false;
    }
    ret = false;
    if (this.getCurrentLineIndentation() === currentIndentation && this.isStringUnIndentedCollectionItem(this.currentLine)) {
      ret = true;
    }
    this.moveToPreviousLine();
    return ret;
  };

  Parser.prototype.isStringUnIndentedCollectionItem = function() {
    return this.currentLine === '-' || this.currentLine.slice(0, 2) === '- ';
  };

  return Parser;

})();

module.exports = Parser;

},{"./Exception/ParseException":8,"./Inline":9,"./Pattern":11,"./Utils":13}],11:[function(require,module,exports){
// Generated by CoffeeScript 1.8.0
var Pattern;

Pattern = (function() {
  Pattern.prototype.regex = null;

  Pattern.prototype.rawRegex = null;

  Pattern.prototype.cleanedRegex = null;

  Pattern.prototype.mapping = null;

  function Pattern(rawRegex, modifiers) {
    var capturingBracketNumber, cleanedRegex, i, len, mapping, name, part, subChar, _char;
    if (modifiers == null) {
      modifiers = '';
    }
    cleanedRegex = '';
    len = rawRegex.length;
    mapping = null;
    capturingBracketNumber = 0;
    i = 0;
    while (i < len) {
      _char = rawRegex.charAt(i);
      if (_char === '\\') {
        cleanedRegex += rawRegex.slice(i, +(i + 1) + 1 || 9e9);
        i++;
      } else if (_char === '(') {
        if (i < len - 2) {
          part = rawRegex.slice(i, +(i + 2) + 1 || 9e9);
          if (part === '(?:') {
            i += 2;
            cleanedRegex += part;
          } else if (part === '(?<') {
            capturingBracketNumber++;
            i += 2;
            name = '';
            while (i + 1 < len) {
              subChar = rawRegex.charAt(i + 1);
              if (subChar === '>') {
                cleanedRegex += '(';
                i++;
                if (name.length > 0) {
                  if (mapping == null) {
                    mapping = {};
                  }
                  mapping[name] = capturingBracketNumber;
                }
                break;
              } else {
                name += subChar;
              }
              i++;
            }
          } else {
            cleanedRegex += _char;
            capturingBracketNumber++;
          }
        } else {
          cleanedRegex += _char;
        }
      } else {
        cleanedRegex += _char;
      }
      i++;
    }
    this.rawRegex = rawRegex;
    this.cleanedRegex = cleanedRegex;
    this.regex = new RegExp(this.cleanedRegex, 'g' + modifiers.replace('g', ''));
    this.mapping = mapping;
  }

  Pattern.prototype.exec = function(str) {
    var index, matches, name, _ref;
    this.regex.lastIndex = 0;
    matches = this.regex.exec(str);
    if (matches == null) {
      return null;
    }
    if (this.mapping != null) {
      _ref = this.mapping;
      for (name in _ref) {
        index = _ref[name];
        matches[name] = matches[index];
      }
    }
    return matches;
  };

  Pattern.prototype.test = function(str) {
    this.regex.lastIndex = 0;
    return this.regex.test(str);
  };

  Pattern.prototype.replace = function(str, replacement) {
    this.regex.lastIndex = 0;
    return str.replace(this.regex, replacement);
  };

  Pattern.prototype.replaceAll = function(str, replacement, limit) {
    var count;
    if (limit == null) {
      limit = 0;
    }
    this.regex.lastIndex = 0;
    count = 0;
    while (this.regex.test(str) && (limit === 0 || count < limit)) {
      this.regex.lastIndex = 0;
      str = str.replace(this.regex, '');
      count++;
    }
    return [str, count];
  };

  return Pattern;

})();

module.exports = Pattern;

},{}],12:[function(require,module,exports){
// Generated by CoffeeScript 1.8.0
var Pattern, Unescaper, Utils;

Utils = require('./Utils');

Pattern = require('./Pattern');

Unescaper = (function() {
  function Unescaper() {}

  Unescaper.PATTERN_ESCAPED_CHARACTER = new Pattern('\\\\([0abt\tnvfre "\\/\\\\N_LP]|x[0-9a-fA-F]{2}|u[0-9a-fA-F]{4}|U[0-9a-fA-F]{8})');

  Unescaper.unescapeSingleQuotedString = function(value) {
    return value.replace(/\'\'/g, '\'');
  };

  Unescaper.unescapeDoubleQuotedString = function(value) {
    if (this._unescapeCallback == null) {
      this._unescapeCallback = (function(_this) {
        return function(str) {
          return _this.unescapeCharacter(str);
        };
      })(this);
    }
    return this.PATTERN_ESCAPED_CHARACTER.replace(value, this._unescapeCallback);
  };

  Unescaper.unescapeCharacter = function(value) {
    var ch;
    ch = String.fromCharCode;
    switch (value.charAt(1)) {
      case '0':
        return ch(0);
      case 'a':
        return ch(7);
      case 'b':
        return ch(8);
      case 't':
        return "\t";
      case "\t":
        return "\t";
      case 'n':
        return "\n";
      case 'v':
        return ch(11);
      case 'f':
        return ch(12);
      case 'r':
        return ch(13);
      case 'e':
        return ch(27);
      case ' ':
        return ' ';
      case '"':
        return '"';
      case '/':
        return '/';
      case '\\':
        return '\\';
      case 'N':
        return ch(0x0085);
      case '_':
        return ch(0x00A0);
      case 'L':
        return ch(0x2028);
      case 'P':
        return ch(0x2029);
      case 'x':
        return Utils.utf8chr(Utils.hexDec(value.substr(2, 2)));
      case 'u':
        return Utils.utf8chr(Utils.hexDec(value.substr(2, 4)));
      case 'U':
        return Utils.utf8chr(Utils.hexDec(value.substr(2, 8)));
      default:
        return '';
    }
  };

  return Unescaper;

})();

module.exports = Unescaper;

},{"./Pattern":11,"./Utils":13}],13:[function(require,module,exports){
// Generated by CoffeeScript 1.8.0
var Pattern, Utils;

Pattern = require('./Pattern');

Utils = (function() {
  function Utils() {}

  Utils.REGEX_LEFT_TRIM_BY_CHAR = {};

  Utils.REGEX_RIGHT_TRIM_BY_CHAR = {};

  Utils.REGEX_SPACES = /\s+/g;

  Utils.REGEX_DIGITS = /^\d+$/;

  Utils.REGEX_OCTAL = /[^0-7]/gi;

  Utils.REGEX_HEXADECIMAL = /[^a-f0-9]/gi;

  Utils.PATTERN_DATE = new Pattern('^' + '(?<year>[0-9][0-9][0-9][0-9])' + '-(?<month>[0-9][0-9]?)' + '-(?<day>[0-9][0-9]?)' + '(?:(?:[Tt]|[ \t]+)' + '(?<hour>[0-9][0-9]?)' + ':(?<minute>[0-9][0-9])' + ':(?<second>[0-9][0-9])' + '(?:\.(?<fraction>[0-9]*))?' + '(?:[ \t]*(?<tz>Z|(?<tz_sign>[-+])(?<tz_hour>[0-9][0-9]?)' + '(?::(?<tz_minute>[0-9][0-9]))?))?)?' + '$', 'i');

  Utils.LOCAL_TIMEZONE_OFFSET = new Date().getTimezoneOffset() * 60 * 1000;

  Utils.trim = function(str, _char) {
    var regexLeft, regexRight;
    if (_char == null) {
      _char = '\\s';
    }
    return str.trim();
    regexLeft = this.REGEX_LEFT_TRIM_BY_CHAR[_char];
    if (regexLeft == null) {
      this.REGEX_LEFT_TRIM_BY_CHAR[_char] = regexLeft = new RegExp('^' + _char + '' + _char + '*');
    }
    regexLeft.lastIndex = 0;
    regexRight = this.REGEX_RIGHT_TRIM_BY_CHAR[_char];
    if (regexRight == null) {
      this.REGEX_RIGHT_TRIM_BY_CHAR[_char] = regexRight = new RegExp(_char + '' + _char + '*$');
    }
    regexRight.lastIndex = 0;
    return str.replace(regexLeft, '').replace(regexRight, '');
  };

  Utils.ltrim = function(str, _char) {
    var regexLeft;
    if (_char == null) {
      _char = '\\s';
    }
    regexLeft = this.REGEX_LEFT_TRIM_BY_CHAR[_char];
    if (regexLeft == null) {
      this.REGEX_LEFT_TRIM_BY_CHAR[_char] = regexLeft = new RegExp('^' + _char + '' + _char + '*');
    }
    regexLeft.lastIndex = 0;
    return str.replace(regexLeft, '');
  };

  Utils.rtrim = function(str, _char) {
    var regexRight;
    if (_char == null) {
      _char = '\\s';
    }
    regexRight = this.REGEX_RIGHT_TRIM_BY_CHAR[_char];
    if (regexRight == null) {
      this.REGEX_RIGHT_TRIM_BY_CHAR[_char] = regexRight = new RegExp(_char + '' + _char + '*$');
    }
    regexRight.lastIndex = 0;
    return str.replace(regexRight, '');
  };

  Utils.isEmpty = function(value) {
    return !value || value === '' || value === '0' || (value instanceof Array && value.length === 0);
  };

  Utils.subStrCount = function(string, subString, start, length) {
    var c, i, len, sublen, _i;
    c = 0;
    string = '' + string;
    subString = '' + subString;
    if (start != null) {
      string = string.slice(start);
    }
    if (length != null) {
      string = string.slice(0, length);
    }
    len = string.length;
    sublen = subString.length;
    for (i = _i = 0; 0 <= len ? _i < len : _i > len; i = 0 <= len ? ++_i : --_i) {
      if (subString === string.slice(i, sublen)) {
        c++;
        i += sublen - 1;
      }
    }
    return c;
  };

  Utils.isDigits = function(input) {
    this.REGEX_DIGITS.lastIndex = 0;
    return this.REGEX_DIGITS.test(input);
  };

  Utils.octDec = function(input) {
    this.REGEX_OCTAL.lastIndex = 0;
    return parseInt((input + '').replace(this.REGEX_OCTAL, ''), 8);
  };

  Utils.hexDec = function(input) {
    this.REGEX_HEXADECIMAL.lastIndex = 0;
    input = this.trim(input);
    if ((input + '').slice(0, 2) === '0x') {
      input = (input + '').slice(2);
    }
    return parseInt((input + '').replace(this.REGEX_HEXADECIMAL, ''), 16);
  };

  Utils.utf8chr = function(c) {
    var ch;
    ch = String.fromCharCode;
    if (0x80 > (c %= 0x200000)) {
      return ch(c);
    }
    if (0x800 > c) {
      return ch(0xC0 | c >> 6) + ch(0x80 | c & 0x3F);
    }
    if (0x10000 > c) {
      return ch(0xE0 | c >> 12) + ch(0x80 | c >> 6 & 0x3F) + ch(0x80 | c & 0x3F);
    }
    return ch(0xF0 | c >> 18) + ch(0x80 | c >> 12 & 0x3F) + ch(0x80 | c >> 6 & 0x3F) + ch(0x80 | c & 0x3F);
  };

  Utils.parseBoolean = function(input, strict) {
    var lowerInput;
    if (strict == null) {
      strict = true;
    }
    if (typeof input === 'string') {
      lowerInput = input.toLowerCase();
      if (!strict) {
        if (lowerInput === 'no') {
          return false;
        }
      }
      if (lowerInput === '0') {
        return false;
      }
      if (lowerInput === 'false') {
        return false;
      }
      if (lowerInput === '') {
        return false;
      }
      return true;
    }
    return !!input;
  };

  Utils.isNumeric = function(input) {
    this.REGEX_SPACES.lastIndex = 0;
    return typeof input === 'number' || typeof input === 'string' && !isNaN(input) && input.replace(this.REGEX_SPACES, '') !== '';
  };

  Utils.stringToDate = function(str) {
    var date, day, fraction, hour, info, minute, month, second, tz_hour, tz_minute, tz_offset, year;
    if (!(str != null ? str.length : void 0)) {
      return null;
    }
    info = this.PATTERN_DATE.exec(str);
    if (!info) {
      return null;
    }
    year = parseInt(info.year, 10);
    month = parseInt(info.month, 10) - 1;
    day = parseInt(info.day, 10);
    if (info.hour == null) {
      date = new Date(Date.UTC(year, month, day));
      return date;
    }
    hour = parseInt(info.hour, 10);
    minute = parseInt(info.minute, 10);
    second = parseInt(info.second, 10);
    if (info.fraction != null) {
      fraction = info.fraction.slice(0, 3);
      while (fraction.length < 3) {
        fraction += '0';
      }
      fraction = parseInt(fraction, 10);
    } else {
      fraction = 0;
    }
    if (info.tz != null) {
      tz_hour = parseInt(info.tz_hour, 10);
      if (info.tz_minute != null) {
        tz_minute = parseInt(info.tz_minute, 10);
      } else {
        tz_minute = 0;
      }
      tz_offset = (tz_hour * 60 + tz_minute) * 60000;
      if ('-' === info.tz_sign) {
        tz_offset *= -1;
      }
    }
    date = new Date(Date.UTC(year, month, day, hour, minute, second, fraction));
    if (tz_offset) {
      date.setTime(date.getTime() + tz_offset);
    }
    return date;
  };

  Utils.strRepeat = function(str, number) {
    var i, res;
    res = '';
    i = 0;
    while (i < number) {
      res += str;
      i++;
    }
    return res;
  };

  Utils.getStringFromFile = function(path, callback) {
    var data, fs, name, req, xhr, _i, _len, _ref;
    if (callback == null) {
      callback = null;
    }
    xhr = null;
    if (typeof window !== "undefined" && window !== null) {
      if (window.XMLHttpRequest) {
        xhr = new XMLHttpRequest();
      } else if (window.ActiveXObject) {
        _ref = ["Msxml2.XMLHTTP.6.0", "Msxml2.XMLHTTP.3.0", "Msxml2.XMLHTTP", "Microsoft.XMLHTTP"];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          name = _ref[_i];
          try {
            xhr = new ActiveXObject(name);
          } catch (_error) {}
        }
      }
    }
    if (xhr != null) {
      if (callback != null) {
        xhr.onreadystatechange = function() {
          if (xhr.readyState === 4) {
            if (xhr.status === 200 || xhr.status === 0) {
              return callback(xhr.responseText);
            } else {
              return callback(null);
            }
          }
        };
        xhr.open('GET', path, true);
        return xhr.send(null);
      } else {
        xhr.open('GET', path, false);
        xhr.send(null);
        if (xhr.status === 200 || xhr.status === 0) {
          return xhr.responseText;
        }
        return null;
      }
    } else {
      req = require;
      fs = req('fs');
      if (callback != null) {
        return fs.readFile(path, function(err, data) {
          if (err) {
            return callback(null);
          } else {
            return callback(String(data));
          }
        });
      } else {
        data = fs.readFileSync(path);
        if (data != null) {
          return String(data);
        }
        return null;
      }
    }
  };

  return Utils;

})();

module.exports = Utils;

},{"./Pattern":11}],14:[function(require,module,exports){
// Generated by CoffeeScript 1.8.0
var Dumper, Parser, Utils, Yaml;

Parser = require('./Parser');

Dumper = require('./Dumper');

Utils = require('./Utils');

Yaml = (function() {
  function Yaml() {}

  Yaml.parse = function(input, exceptionOnInvalidType, objectDecoder) {
    if (exceptionOnInvalidType == null) {
      exceptionOnInvalidType = false;
    }
    if (objectDecoder == null) {
      objectDecoder = null;
    }
    return new Parser().parse(input, exceptionOnInvalidType, objectDecoder);
  };

  Yaml.parseFile = function(path, callback, exceptionOnInvalidType, objectDecoder) {
    var input;
    if (callback == null) {
      callback = null;
    }
    if (exceptionOnInvalidType == null) {
      exceptionOnInvalidType = false;
    }
    if (objectDecoder == null) {
      objectDecoder = null;
    }
    if (callback != null) {
      return Utils.getStringFromFile(path, (function(_this) {
        return function(input) {
          var result;
          result = null;
          if (input != null) {
            result = _this.parse(input, exceptionOnInvalidType, objectDecoder);
          }
          callback(result);
        };
      })(this));
    } else {
      input = Utils.getStringFromFile(path);
      if (input != null) {
        return this.parse(input, exceptionOnInvalidType, objectDecoder);
      }
      return null;
    }
  };

  Yaml.dump = function(input, inline, indent, exceptionOnInvalidType, objectEncoder) {
    var yaml;
    if (inline == null) {
      inline = 2;
    }
    if (indent == null) {
      indent = 4;
    }
    if (exceptionOnInvalidType == null) {
      exceptionOnInvalidType = false;
    }
    if (objectEncoder == null) {
      objectEncoder = null;
    }
    yaml = new Dumper();
    yaml.indentation = indent;
    return yaml.dump(input, inline, 0, exceptionOnInvalidType, objectEncoder);
  };

  Yaml.register = function() {
    var require_handler;
    require_handler = function(module, filename) {
      return module.exports = YAML.parseFile(filename);
    };
    if ((typeof require !== "undefined" && require !== null ? require.extensions : void 0) != null) {
      require.extensions['.yml'] = require_handler;
      return require.extensions['.yaml'] = require_handler;
    }
  };

  Yaml.stringify = function(input, inline, indent, exceptionOnInvalidType, objectEncoder) {
    return this.dump(input, inline, indent, exceptionOnInvalidType, objectEncoder);
  };

  Yaml.load = function(path, callback, exceptionOnInvalidType, objectDecoder) {
    return this.parseFile(path, callback, exceptionOnInvalidType, objectDecoder);
  };

  return Yaml;

})();

if (typeof window !== "undefined" && window !== null) {
  window.YAML = Yaml;
}

if (typeof window === "undefined" || window === null) {
  this.YAML = Yaml;
}

module.exports = Yaml;

},{"./Dumper":5,"./Parser":10,"./Utils":13}],15:[function(require,module,exports){
'use strict';

var _TreeNode = require('./js/TreeNode.js');

var _TreeNode2 = _interopRequireDefault(_TreeNode);

var _Util = require('./js/Util.js');

var utils = _interopRequireWildcard(_Util);

var _Parser = require('./js/Parser.js');

var _Parser2 = _interopRequireDefault(_Parser);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var YAML = require('yamljs');

var vm = new Vue({
    el: '.content',
    data: {
        sourceCode: 'Something something',
        currentTree: undefined
    },
    methods: {
        parseSource: function parseSource() {
            console.log("Parsing...");

            try {
                //var parsed = YAML.parse(this.sourceCode);
                var parsed = (0, _Parser2.default)(this.sourceCode);
            } catch (err) {
                console.log("Woops! Error parsing");

                return;
            }

            if (parsed.length == 0) return;
            parsed = parsed.children[0];

            vm.currentTree = this.parseObjectBranch(parsed, true);
            vm.regenerateDiagram();
        },

        parseObjectBranch: function parseObjectBranch(branch) {
            var isRoot = arguments.length <= 1 || arguments[1] === undefined ? false : arguments[1];

            var branchLabel = branch.label;
            var branchChildren = branch.children;

            var node = new _TreeNode2.default(branchLabel, isRoot);

            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = branchChildren[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var child = _step.value;

                    node.addChild(this.parseObjectBranch(child, false));
                }
            } catch (err) {
                _didIteratorError = true;
                _iteratorError = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion && _iterator.return) {
                        _iterator.return();
                    }
                } finally {
                    if (_didIteratorError) {
                        throw _iteratorError;
                    }
                }
            }

            return node;
        },

        regenerateDiagram: function regenerateDiagram() {
            var canvas = document.getElementById("canvas");
            var ctx = canvas.getContext("2d");

            // Resize canvas to the available size
            canvas.width = canvas.clientWidth;
            canvas.height = canvas.clientHeight;

            if (!(this.currentTree instanceof _TreeNode2.default)) {
                console.log("Not a valid tree", this.currentTree);
                return;
            }

            var shit = this.currentTree.draw();
            canvas.width = shit.width + 25;
            canvas.height = shit.height + 25;

            ctx.drawImage(shit, 25, 25);
        }
    }
});

//window.addEventListener('resize', vm.regenerateDiagram);

vm.sourceCode = '- Programming\nsomething I love\n  - Web Development\n    - Front-end development\n(stuff for the browsers)\n      - Languages\n        - HTML\n        - CSS\n        - JavaScript\n      - Tools\n        - Bootstrap\n    - Back-end development\n(stuff for the server)\n      - Languages\n        - PHP\n        - Python\n      - Frameworks\n        - Django\n        - Symphony\n  - Desktop development,\nwhich is something pretty hard that\nmost web developers can\'t do\n  - Mobile development\n    - Android\n    - iOS\n    - Some other stuff\nno one cares about\n    - LOLWAT\n';

vm.$watch('sourceCode', function (sourceCode) {
    vm.parseSource();
});

var maxDepth = 4;
var maxChildren = 5;

var generateRandomChildren = function generateRandomChildren(node) {
    var depth = arguments.length <= 1 || arguments[1] === undefined ? 0 : arguments[1];

    if (depth == maxDepth) return;

    var numChildren = utils.getRandomInt(0, maxChildren);

    for (var i = 0; i < numChildren; ++i) {
        //var child = new TreeNode("Ch" + i + "d" + depth);
        var child = new _TreeNode2.default(utils.getLoremIpsum(3));
        generateRandomChildren(child, depth + 1);
        node.addChild(child);
    }
};

//generateRandomChildren(root);

//var a = new TreeNode('Hijo 1');
//var b = new TreeNode('Hijo 2');
//var c = new TreeNode('Hijo 3');
//
//root.addChildren(a, b, c);
//
//a.addChildren(
//    new TreeNode('Subh 1.1'),
//    new TreeNode('Subh 1.2'),
//    new TreeNode('Subh 1.3'),
//    new TreeNode('Subh 1.4')
//);
//
//b.addChildren(
//    new TreeNode('Subh 2.1'),
//    new TreeNode('Subh 2.2'),
//    new TreeNode('Subh 2.2'),
//    new TreeNode('Subh 2.2'),
//    new TreeNode('Subh 2.2'),
//    new TreeNode('Subh 2.2'),
//    new TreeNode('Subh 2.2'),
//    new TreeNode('Subh 2.2'),
//    new TreeNode('Subh 2.2'),
//    new TreeNode('Subh 2.3')
//);

//vm.currentTree = root;
vm.parseSource();
//vm.regenerateDiagram();

},{"./js/Parser.js":16,"./js/TreeNode.js":17,"./js/Util.js":18,"yamljs":14}],16:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = parseList;
var util = require('util');

function parseList(text) {
    var items = { 'label': 'ROOT', 'children': [], 'depth': -1 };
    var lines = text.split("\n");
    lines = lines.filter(function (c) {
        return !c.match(/^\s*$/);
    }); // Remove blank lines

    var currentParent = items;
    var currentParentDepth = -1;

    var currentItemLabel = "";
    var currentItemDepth;

    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
        for (var _iterator = lines[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var line = _step.value;

            var itemMatch = line.match(/^( *)-\s*(.*)$/);

            // New item
            if (itemMatch) {
                // Store previous item (if any)
                if (currentItemLabel != "") {

                    // Build the node for the previously read node
                    var node = {
                        'label': currentItemLabel,
                        'children': [],
                        'parent': currentParent,
                        'depth': currentItemDepth
                    };

                    // Store the node within its parent
                    currentParent['children'].push(node);

                    // Set the new "parent" to the previous item
                    currentParent = node;
                    currentParentDepth = node.depth;
                }

                // Fetch the data from the newly-read item
                currentItemDepth = itemMatch[1].length;
                currentItemLabel = itemMatch[2];

                // If the parent is deeper than the new item, switch the parent
                // to one with lower depth than current item
                while (currentItemDepth <= currentParentDepth) {
                    currentParent = currentParent['parent'];
                    currentParentDepth = currentParent['depth'];
                }
            }
            // Continued string from previous item
            else {
                    currentItemLabel += "\n" + line;
                }
        }

        // Force insert last item
    } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion && _iterator.return) {
                _iterator.return();
            }
        } finally {
            if (_didIteratorError) {
                throw _iteratorError;
            }
        }
    }

    if (currentItemLabel) {
        var node = {
            'label': currentItemLabel,
            'children': [],
            'parent': currentParent,
            'depth': currentParentDepth + 1
        };
        currentParent['children'].push(node);
    }

    return items;
}

//var sourceCode =
//`- Programming:
//  - Web Development:
//
//    - Front-end development:
//      - Languages:
//        - HTML
//        y penes
//        y vaginas
//        - CSS
//        - JavaScript
//      - Tools:
//        - Bootstrap
//    - Back-end development:
//      - Languages:
//        - PHP
//        - Python
//      - Frameworks:
//        - Django
//        - Symphony
//  - Desktop development
//  - Mobile development:
//    - Android
//    - iOS
//    - Some other stuff no one cares about
//`;
//
//
//console.log(util.inspect(parseList(sourceCode), false, null, true));

},{"util":4}],17:[function(require,module,exports){
"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _Util = require("./Util.js");

var utils = _interopRequireWildcard(_Util);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var connectorWidth = 50;
var connectorSteepness = 0.8;
var connectorLineWidth = 4.5;

var fontSize = 13;
var fontFamily = "Open Sans";

var labelPaddingBottom = 8;
var labelPaddingRight = 5;

var leafMarginTop = 5;
var leafMarginBottom = 5;

var TreeNode = (function () {
    function TreeNode(label) {
        var isRoot = arguments.length <= 1 || arguments[1] === undefined ? false : arguments[1];

        _classCallCheck(this, TreeNode);

        this.label = label;
        this.labelLines = this.label.split("\n");
        this.isRoot = isRoot;
        this.parent = undefined;
        this.children = [];
    }

    _createClass(TreeNode, [{
        key: "addChild",
        value: function addChild(child) {
            child.parent = this;
            this.children.push(child);
        }
    }, {
        key: "addChildren",
        value: function addChildren() {
            for (var _len = arguments.length, children = Array(_len), _key = 0; _key < _len; _key++) {
                children[_key] = arguments[_key];
            }

            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = children[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var child = _step.value;

                    this.addChild(child);
                }
            } catch (err) {
                _didIteratorError = true;
                _iteratorError = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion && _iterator.return) {
                        _iterator.return();
                    }
                } finally {
                    if (_didIteratorError) {
                        throw _iteratorError;
                    }
                }
            }
        }
    }, {
        key: "draw",
        value: function draw(currentBranchColor) {
            var _Math,
                _this = this;

            var that = this;

            var dl = function dl(x, y) {
                var c = arguments.length <= 2 || arguments[2] === undefined ? "#00ff00" : arguments[2];
                var w = arguments.length <= 3 || arguments[3] === undefined ? 100 : arguments[3];

                that.ctx.fillStyle = c;
                that.ctx.fillRect(x, y, w, 1);
            };

            var dr = function dr(x, y, w, h) {
                var c = arguments.length <= 4 || arguments[4] === undefined ? "#00ff00" : arguments[4];

                that.ctx.fillStyle = c;
                that.ctx.rect(x, y, w, h);
                that.ctx.stroke();
            };

            this.canvas = document.createElement("canvas");
            this.ctx = this.canvas.getContext("2d");

            // The width of the label will be the width of the widest line
            this.ctx.font = fontSize + "px " + fontFamily;
            this.labelWidth = Math.ceil((_Math = Math).max.apply(_Math, _toConsumableArray(this.labelLines.map(function (c) {
                return _this.ctx.measureText(c).width;
            }))));

            if (this.isLeaf) {
                this.canvas.width = this.labelWidth + labelPaddingRight * 2;
                this.canvas.height = fontSize * (this.labelLines.length + 1) + leafMarginTop + leafMarginBottom;
                this.ctx.font = fontSize + "px " + fontFamily;
                for (var i = 0; i < this.labelLines.length; i++) {
                    this.ctx.fillText(this.labelLines[i], 0, fontSize * (i + 1));
                }

                // The anchorPoint defines where the line should start
                this.anchorPoint = { x: 0, y: this.labelLines.length * fontSize + labelPaddingBottom };
            } else {
                var _Math2;

                // If this is the root, we need to generate a random color for each branch
                if (this.isRoot) {
                    var branchColors = this.children.map(function (c) {
                        return utils.generateRandomColor();
                    });
                    var canvases = this.children.map(function (c, i) {
                        return c.draw(branchColors[i]);
                    });
                }

                // Otherwise, used the received branchColor
                else {
                        var canvases = this.children.map(function (c, i) {
                            return c.draw(currentBranchColor);
                        });
                    }

                // Get the vertical positions for the children
                var vertical_positions = [0];

                // Each position is the sum of the acummulated heights of the previous elements
                for (var i = 0; i < canvases.length; i++) {
                    vertical_positions[i + 1] = vertical_positions[i] + canvases[i].height;
                }

                // Compute left margin (label width + separation)
                var leftMargin = 10 + this.labelWidth + connectorWidth;

                // Set the width to the leftMargin plus the width of the widest child branch
                this.canvas.width = leftMargin + (_Math2 = Math).max.apply(_Math2, _toConsumableArray(canvases.map(function (c) {
                    return c.width;
                })));
                this.canvas.height = vertical_positions[canvases.length] + 5;
                this.ctx.font = fontSize + "px " + fontFamily;

                if (this.isRoot) {
                    this.anchorPoint = { x: 10, y: this.canvas.height / 2 + fontSize / 2 };
                } else {
                    this.anchorPoint = { x: 0, y: this.canvas.height / 2 + fontSize / 2 + labelPaddingBottom };
                }

                for (var i = 0; i < canvases.length; i++) {
                    if (this.isRoot) {
                        currentBranchColor = branchColors[i];
                    }

                    this.ctx.drawImage(canvases[i], leftMargin, vertical_positions[i]);

                    var connector_a = {
                        x: this.anchorPoint.x + this.labelWidth + labelPaddingRight,
                        y: this.anchorPoint.y
                    };

                    var connector_b = {
                        x: leftMargin,
                        y: vertical_positions[i] + this.children[i].anchorPoint.y
                    };

                    this.ctx.beginPath();
                    this.ctx.moveTo(connector_a.x, connector_a.y);

                    this.ctx.bezierCurveTo(connector_a.x + connectorSteepness * connectorWidth, connector_a.y, connector_b.x - connectorSteepness * connectorWidth, connector_b.y, connector_b.x, connector_b.y);

                    this.ctx.lineTo(connector_b.x + this.children[i].labelWidth + labelPaddingRight, connector_b.y);
                    this.ctx.lineWidth = connectorLineWidth;
                    this.ctx.lineCap = "round";
                    this.ctx.strokeStyle = currentBranchColor;
                    this.ctx.stroke();
                }

                if (this.isRoot) {
                    this.ctx.fillStyle = "#ffffff";
                    this.ctx.lineWidth = 3;
                    utils.roundRect(this.ctx, 2, this.canvas.height / 2 - this.labelLines.length * fontSize, this.labelWidth + 18, fontSize * (this.labelLines.length + 1.5), 5, true, true);
                }
                this.ctx.fillStyle = "#000000";

                for (var i = 0; i < this.labelLines.length; i++) {
                    this.ctx.fillText(this.labelLines[i], 10, // Fixed margin from the left
                    this.canvas.height / 2 // Vertical center
                     + fontSize / 2 // Middle of the line height
                     - fontSize * (this.labelLines.length - i - 1) // Correctly account for multilines
                    );
                }
            }

            return this.canvas;
        }
    }, {
        key: "isLeaf",
        get: function get() {
            return this.children.length == 0;
        }
    }]);

    return TreeNode;
})();

exports.default = TreeNode;
;

},{"./Util.js":18}],18:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.roundRect = roundRect;
exports.getRandomInt = getRandomInt;
exports.generateRandomColor = generateRandomColor;
exports.getLoremIpsum = getLoremIpsum;
/**
 * Draws a rounded rectangle using the current state of the canvas.
 * If you omit the last three params, it will draw a rectangle
 * outline with a 5 pixel border radius
 * @param {CanvasRenderingContext2D} ctx
 * @param {Number} x The top left x coordinate
 * @param {Number} y The top left y coordinate
 * @param {Number} width The width of the rectangle
 * @param {Number} height The height of the rectangle
 * @param {Number} [radius = 5] The corner radius; It can also be an object
 *                 to specify different radii for corners
 * @param {Number} [radius.tl = 0] Top left
 * @param {Number} [radius.tr = 0] Top right
 * @param {Number} [radius.br = 0] Bottom right
 * @param {Number} [radius.bl = 0] Bottom left
 * @param {Boolean} [fill = false] Whether to fill the rectangle.
 * @param {Boolean} [stroke = true] Whether to stroke the rectangle.
 */
function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
    if (typeof stroke == 'undefined') {
        stroke = true;
    }
    if (typeof radius === 'undefined') {
        radius = 5;
    }
    if (typeof radius === 'number') {
        radius = { tl: radius, tr: radius, br: radius, bl: radius };
    } else {
        var defaultRadius = { tl: 0, tr: 0, br: 0, bl: 0 };
        for (var side in defaultRadius) {
            radius[side] = radius[side] || defaultRadius[side];
        }
    }
    ctx.beginPath();
    ctx.moveTo(x + radius.tl, y);
    ctx.lineTo(x + width - radius.tr, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
    ctx.lineTo(x + width, y + height - radius.br);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
    ctx.lineTo(x + radius.bl, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
    ctx.lineTo(x, y + radius.tl);
    ctx.quadraticCurveTo(x, y, x + radius.tl, y);
    ctx.closePath();
    if (fill) {
        ctx.fill();
    }
    if (stroke) {
        ctx.stroke();
    }
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(r, g, b) {
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

function generateRandomColor() {
    var baseColor = arguments.length <= 0 || arguments[0] === undefined ? [256, 256, 256] : arguments[0];

    var red = getRandomInt(0, 256);
    var green = getRandomInt(0, 256);
    var blue = getRandomInt(0, 256);

    // mix the color

    var mixture = 0.7;

    red = Math.round(red * mixture + baseColor[0] * (1 - mixture));
    green = Math.round(green * mixture + baseColor[1] * (1 - mixture));
    blue = Math.round(blue * mixture + baseColor[2] * (1 - mixture));

    //
    //red = Math.round((red + baseColor[0]) / 2);
    //green = Math.round((green + baseColor[1]) / 2);
    //blue = Math.round((blue + baseColor[2]) / 2);

    return rgbToHex(red, green, blue);
}

function getLoremIpsum() {
    var numWords = arguments.length <= 0 || arguments[0] === undefined ? 5 : arguments[0];

    var baseText = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Phasellus gravida eu leo vitae imperdiet. Nam pulvinar luctus arcu, vel semper ligula efficitur in. Mauris non semper ante. Nullam scelerisque hendrerit urna, lacinia egestas enim laoreet vitae. Aliquam erat volutpat. Duis posuere magna libero, vel rhoncus nisl ullamcorper eu. Etiam ac libero consectetur, congue nisi quis, vulputate erat.";
    var sentences = baseText.split(".");
    var sentences_words = sentences.map(function (s) {
        return s.split(/[\s\.,]/);
    });

    var chosenSentenceNumber = getRandomInt(0, sentences.length - 1);
    var chosenWords = sentences_words[chosenSentenceNumber].slice(0, numWords).join(" ");

    return chosenWords;
}

},{}]},{},[15])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvaW5oZXJpdHMvaW5oZXJpdHNfYnJvd3Nlci5qcyIsIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9wcm9jZXNzL2Jyb3dzZXIuanMiLCJub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvdXRpbC9zdXBwb3J0L2lzQnVmZmVyQnJvd3Nlci5qcyIsIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy91dGlsL3V0aWwuanMiLCJub2RlX21vZHVsZXMveWFtbGpzL2xpYi9EdW1wZXIuanMiLCJub2RlX21vZHVsZXMveWFtbGpzL2xpYi9Fc2NhcGVyLmpzIiwibm9kZV9tb2R1bGVzL3lhbWxqcy9saWIvRXhjZXB0aW9uL0R1bXBFeGNlcHRpb24uanMiLCJub2RlX21vZHVsZXMveWFtbGpzL2xpYi9FeGNlcHRpb24vUGFyc2VFeGNlcHRpb24uanMiLCJub2RlX21vZHVsZXMveWFtbGpzL2xpYi9JbmxpbmUuanMiLCJub2RlX21vZHVsZXMveWFtbGpzL2xpYi9QYXJzZXIuanMiLCJub2RlX21vZHVsZXMveWFtbGpzL2xpYi9QYXR0ZXJuLmpzIiwibm9kZV9tb2R1bGVzL3lhbWxqcy9saWIvVW5lc2NhcGVyLmpzIiwibm9kZV9tb2R1bGVzL3lhbWxqcy9saWIvVXRpbHMuanMiLCJub2RlX21vZHVsZXMveWFtbGpzL2xpYi9ZYW1sLmpzIiwic3JjL2FwcC5qcyIsInNyYy9qcy9QYXJzZXIuanMiLCJzcmMvanMvVHJlZU5vZGUuanMiLCJzcmMvanMvVXRpbC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDMWtCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuZUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZsQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1UkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FB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Q0FBQyxHQUFHLE9BQU8sQ0FBQSxBQUFDLENBQUMsQ0FBQztBQUMvRCxTQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLEdBQUcsT0FBTyxHQUFHLFNBQVMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsT0FBTyxDQUFBLEFBQUMsQ0FBQyxDQUFDO0FBQ25FLFFBQUksR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksR0FBRyxPQUFPLEdBQUcsU0FBUyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxPQUFPLENBQUEsQUFBQyxDQUFDOzs7Ozs7O0FBQUMsQUFPakUsV0FBTyxRQUFRLENBQUMsR0FBRyxFQUFFLEtBQUssRUFBRSxJQUFJLENBQUMsQ0FBQztDQUNyQzs7QUFFTSxTQUFTLGFBQWEsR0FBYztRQUFaLFFBQVEseURBQUMsQ0FBQzs7QUFDckMsUUFBSSxRQUFRLEdBQUcsK1lBQStZLENBQUM7QUFDL1osUUFBSSxTQUFTLEdBQUcsUUFBUSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUNwQyxRQUFJLGVBQWUsR0FBRyxTQUFTLENBQUMsR0FBRyxDQUFDLFVBQUEsQ0FBQztlQUFJLENBQUMsQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDO0tBQUEsQ0FBQyxDQUFDOztBQUU3RCxRQUFJLG9CQUFvQixHQUFHLFlBQVksQ0FBQyxDQUFDLEVBQUUsU0FBUyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQztBQUNqRSxRQUFJLFdBQVcsR0FBRyxlQUFlLENBQUMsb0JBQW9CLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLFFBQVEsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQzs7QUFFckYsV0FBTyxXQUFXLENBQUM7Q0FDdEIiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiaWYgKHR5cGVvZiBPYmplY3QuY3JlYXRlID09PSAnZnVuY3Rpb24nKSB7XG4gIC8vIGltcGxlbWVudGF0aW9uIGZyb20gc3RhbmRhcmQgbm9kZS5qcyAndXRpbCcgbW9kdWxlXG4gIG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaW5oZXJpdHMoY3Rvciwgc3VwZXJDdG9yKSB7XG4gICAgY3Rvci5zdXBlcl8gPSBzdXBlckN0b3JcbiAgICBjdG9yLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoc3VwZXJDdG9yLnByb3RvdHlwZSwge1xuICAgICAgY29uc3RydWN0b3I6IHtcbiAgICAgICAgdmFsdWU6IGN0b3IsXG4gICAgICAgIGVudW1lcmFibGU6IGZhbHNlLFxuICAgICAgICB3cml0YWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgICB9XG4gICAgfSk7XG4gIH07XG59IGVsc2Uge1xuICAvLyBvbGQgc2Nob29sIHNoaW0gZm9yIG9sZCBicm93c2Vyc1xuICBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGluaGVyaXRzKGN0b3IsIHN1cGVyQ3Rvcikge1xuICAgIGN0b3Iuc3VwZXJfID0gc3VwZXJDdG9yXG4gICAgdmFyIFRlbXBDdG9yID0gZnVuY3Rpb24gKCkge31cbiAgICBUZW1wQ3Rvci5wcm90b3R5cGUgPSBzdXBlckN0b3IucHJvdG90eXBlXG4gICAgY3Rvci5wcm90b3R5cGUgPSBuZXcgVGVtcEN0b3IoKVxuICAgIGN0b3IucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gY3RvclxuICB9XG59XG4iLCIvLyBzaGltIGZvciB1c2luZyBwcm9jZXNzIGluIGJyb3dzZXJcblxudmFyIHByb2Nlc3MgPSBtb2R1bGUuZXhwb3J0cyA9IHt9O1xudmFyIHF1ZXVlID0gW107XG52YXIgZHJhaW5pbmcgPSBmYWxzZTtcbnZhciBjdXJyZW50UXVldWU7XG52YXIgcXVldWVJbmRleCA9IC0xO1xuXG5mdW5jdGlvbiBjbGVhblVwTmV4dFRpY2soKSB7XG4gICAgZHJhaW5pbmcgPSBmYWxzZTtcbiAgICBpZiAoY3VycmVudFF1ZXVlLmxlbmd0aCkge1xuICAgICAgICBxdWV1ZSA9IGN1cnJlbnRRdWV1ZS5jb25jYXQocXVldWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHF1ZXVlSW5kZXggPSAtMTtcbiAgICB9XG4gICAgaWYgKHF1ZXVlLmxlbmd0aCkge1xuICAgICAgICBkcmFpblF1ZXVlKCk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBkcmFpblF1ZXVlKCkge1xuICAgIGlmIChkcmFpbmluZykge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIHZhciB0aW1lb3V0ID0gc2V0VGltZW91dChjbGVhblVwTmV4dFRpY2spO1xuICAgIGRyYWluaW5nID0gdHJ1ZTtcblxuICAgIHZhciBsZW4gPSBxdWV1ZS5sZW5ndGg7XG4gICAgd2hpbGUobGVuKSB7XG4gICAgICAgIGN1cnJlbnRRdWV1ZSA9IHF1ZXVlO1xuICAgICAgICBxdWV1ZSA9IFtdO1xuICAgICAgICB3aGlsZSAoKytxdWV1ZUluZGV4IDwgbGVuKSB7XG4gICAgICAgICAgICBpZiAoY3VycmVudFF1ZXVlKSB7XG4gICAgICAgICAgICAgICAgY3VycmVudFF1ZXVlW3F1ZXVlSW5kZXhdLnJ1bigpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHF1ZXVlSW5kZXggPSAtMTtcbiAgICAgICAgbGVuID0gcXVldWUubGVuZ3RoO1xuICAgIH1cbiAgICBjdXJyZW50UXVldWUgPSBudWxsO1xuICAgIGRyYWluaW5nID0gZmFsc2U7XG4gICAgY2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xufVxuXG5wcm9jZXNzLm5leHRUaWNrID0gZnVuY3Rpb24gKGZ1bikge1xuICAgIHZhciBhcmdzID0gbmV3IEFycmF5KGFyZ3VtZW50cy5sZW5ndGggLSAxKTtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDE7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGFyZ3NbaSAtIDFdID0gYXJndW1lbnRzW2ldO1xuICAgICAgICB9XG4gICAgfVxuICAgIHF1ZXVlLnB1c2gobmV3IEl0ZW0oZnVuLCBhcmdzKSk7XG4gICAgaWYgKHF1ZXVlLmxlbmd0aCA9PT0gMSAmJiAhZHJhaW5pbmcpIHtcbiAgICAgICAgc2V0VGltZW91dChkcmFpblF1ZXVlLCAwKTtcbiAgICB9XG59O1xuXG4vLyB2OCBsaWtlcyBwcmVkaWN0aWJsZSBvYmplY3RzXG5mdW5jdGlvbiBJdGVtKGZ1biwgYXJyYXkpIHtcbiAgICB0aGlzLmZ1biA9IGZ1bjtcbiAgICB0aGlzLmFycmF5ID0gYXJyYXk7XG59XG5JdGVtLnByb3RvdHlwZS5ydW4gPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5mdW4uYXBwbHkobnVsbCwgdGhpcy5hcnJheSk7XG59O1xucHJvY2Vzcy50aXRsZSA9ICdicm93c2VyJztcbnByb2Nlc3MuYnJvd3NlciA9IHRydWU7XG5wcm9jZXNzLmVudiA9IHt9O1xucHJvY2Vzcy5hcmd2ID0gW107XG5wcm9jZXNzLnZlcnNpb24gPSAnJzsgLy8gZW1wdHkgc3RyaW5nIHRvIGF2b2lkIHJlZ2V4cCBpc3N1ZXNcbnByb2Nlc3MudmVyc2lvbnMgPSB7fTtcblxuZnVuY3Rpb24gbm9vcCgpIHt9XG5cbnByb2Nlc3Mub24gPSBub29wO1xucHJvY2Vzcy5hZGRMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLm9uY2UgPSBub29wO1xucHJvY2Vzcy5vZmYgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUFsbExpc3RlbmVycyA9IG5vb3A7XG5wcm9jZXNzLmVtaXQgPSBub29wO1xuXG5wcm9jZXNzLmJpbmRpbmcgPSBmdW5jdGlvbiAobmFtZSkge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5iaW5kaW5nIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG5cbnByb2Nlc3MuY3dkID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gJy8nIH07XG5wcm9jZXNzLmNoZGlyID0gZnVuY3Rpb24gKGRpcikge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5jaGRpciBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xucHJvY2Vzcy51bWFzayA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gMDsgfTtcbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaXNCdWZmZXIoYXJnKSB7XG4gIHJldHVybiBhcmcgJiYgdHlwZW9mIGFyZyA9PT0gJ29iamVjdCdcbiAgICAmJiB0eXBlb2YgYXJnLmNvcHkgPT09ICdmdW5jdGlvbidcbiAgICAmJiB0eXBlb2YgYXJnLmZpbGwgPT09ICdmdW5jdGlvbidcbiAgICAmJiB0eXBlb2YgYXJnLnJlYWRVSW50OCA9PT0gJ2Z1bmN0aW9uJztcbn0iLCIvLyBDb3B5cmlnaHQgSm95ZW50LCBJbmMuIGFuZCBvdGhlciBOb2RlIGNvbnRyaWJ1dG9ycy5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYVxuLy8gY29weSBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZVxuLy8gXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nXG4vLyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsXG4vLyBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0XG4vLyBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGVcbi8vIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkXG4vLyBpbiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTXG4vLyBPUiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GXG4vLyBNRVJDSEFOVEFCSUxJVFksIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOXG4vLyBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSxcbi8vIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUlxuLy8gT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRVxuLy8gVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cblxudmFyIGZvcm1hdFJlZ0V4cCA9IC8lW3NkaiVdL2c7XG5leHBvcnRzLmZvcm1hdCA9IGZ1bmN0aW9uKGYpIHtcbiAgaWYgKCFpc1N0cmluZyhmKSkge1xuICAgIHZhciBvYmplY3RzID0gW107XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIG9iamVjdHMucHVzaChpbnNwZWN0KGFyZ3VtZW50c1tpXSkpO1xuICAgIH1cbiAgICByZXR1cm4gb2JqZWN0cy5qb2luKCcgJyk7XG4gIH1cblxuICB2YXIgaSA9IDE7XG4gIHZhciBhcmdzID0gYXJndW1lbnRzO1xuICB2YXIgbGVuID0gYXJncy5sZW5ndGg7XG4gIHZhciBzdHIgPSBTdHJpbmcoZikucmVwbGFjZShmb3JtYXRSZWdFeHAsIGZ1bmN0aW9uKHgpIHtcbiAgICBpZiAoeCA9PT0gJyUlJykgcmV0dXJuICclJztcbiAgICBpZiAoaSA+PSBsZW4pIHJldHVybiB4O1xuICAgIHN3aXRjaCAoeCkge1xuICAgICAgY2FzZSAnJXMnOiByZXR1cm4gU3RyaW5nKGFyZ3NbaSsrXSk7XG4gICAgICBjYXNlICclZCc6IHJldHVybiBOdW1iZXIoYXJnc1tpKytdKTtcbiAgICAgIGNhc2UgJyVqJzpcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkoYXJnc1tpKytdKTtcbiAgICAgICAgfSBjYXRjaCAoXykge1xuICAgICAgICAgIHJldHVybiAnW0NpcmN1bGFyXSc7XG4gICAgICAgIH1cbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHJldHVybiB4O1xuICAgIH1cbiAgfSk7XG4gIGZvciAodmFyIHggPSBhcmdzW2ldOyBpIDwgbGVuOyB4ID0gYXJnc1srK2ldKSB7XG4gICAgaWYgKGlzTnVsbCh4KSB8fCAhaXNPYmplY3QoeCkpIHtcbiAgICAgIHN0ciArPSAnICcgKyB4O1xuICAgIH0gZWxzZSB7XG4gICAgICBzdHIgKz0gJyAnICsgaW5zcGVjdCh4KTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHN0cjtcbn07XG5cblxuLy8gTWFyayB0aGF0IGEgbWV0aG9kIHNob3VsZCBub3QgYmUgdXNlZC5cbi8vIFJldHVybnMgYSBtb2RpZmllZCBmdW5jdGlvbiB3aGljaCB3YXJucyBvbmNlIGJ5IGRlZmF1bHQuXG4vLyBJZiAtLW5vLWRlcHJlY2F0aW9uIGlzIHNldCwgdGhlbiBpdCBpcyBhIG5vLW9wLlxuZXhwb3J0cy5kZXByZWNhdGUgPSBmdW5jdGlvbihmbiwgbXNnKSB7XG4gIC8vIEFsbG93IGZvciBkZXByZWNhdGluZyB0aGluZ3MgaW4gdGhlIHByb2Nlc3Mgb2Ygc3RhcnRpbmcgdXAuXG4gIGlmIChpc1VuZGVmaW5lZChnbG9iYWwucHJvY2VzcykpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gZXhwb3J0cy5kZXByZWNhdGUoZm4sIG1zZykuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9O1xuICB9XG5cbiAgaWYgKHByb2Nlc3Mubm9EZXByZWNhdGlvbiA9PT0gdHJ1ZSkge1xuICAgIHJldHVybiBmbjtcbiAgfVxuXG4gIHZhciB3YXJuZWQgPSBmYWxzZTtcbiAgZnVuY3Rpb24gZGVwcmVjYXRlZCgpIHtcbiAgICBpZiAoIXdhcm5lZCkge1xuICAgICAgaWYgKHByb2Nlc3MudGhyb3dEZXByZWNhdGlvbikge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IobXNnKTtcbiAgICAgIH0gZWxzZSBpZiAocHJvY2Vzcy50cmFjZURlcHJlY2F0aW9uKSB7XG4gICAgICAgIGNvbnNvbGUudHJhY2UobXNnKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IobXNnKTtcbiAgICAgIH1cbiAgICAgIHdhcm5lZCA9IHRydWU7XG4gICAgfVxuICAgIHJldHVybiBmbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICB9XG5cbiAgcmV0dXJuIGRlcHJlY2F0ZWQ7XG59O1xuXG5cbnZhciBkZWJ1Z3MgPSB7fTtcbnZhciBkZWJ1Z0Vudmlyb247XG5leHBvcnRzLmRlYnVnbG9nID0gZnVuY3Rpb24oc2V0KSB7XG4gIGlmIChpc1VuZGVmaW5lZChkZWJ1Z0Vudmlyb24pKVxuICAgIGRlYnVnRW52aXJvbiA9IHByb2Nlc3MuZW52Lk5PREVfREVCVUcgfHwgJyc7XG4gIHNldCA9IHNldC50b1VwcGVyQ2FzZSgpO1xuICBpZiAoIWRlYnVnc1tzZXRdKSB7XG4gICAgaWYgKG5ldyBSZWdFeHAoJ1xcXFxiJyArIHNldCArICdcXFxcYicsICdpJykudGVzdChkZWJ1Z0Vudmlyb24pKSB7XG4gICAgICB2YXIgcGlkID0gcHJvY2Vzcy5waWQ7XG4gICAgICBkZWJ1Z3Nbc2V0XSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgbXNnID0gZXhwb3J0cy5mb3JtYXQuYXBwbHkoZXhwb3J0cywgYXJndW1lbnRzKTtcbiAgICAgICAgY29uc29sZS5lcnJvcignJXMgJWQ6ICVzJywgc2V0LCBwaWQsIG1zZyk7XG4gICAgICB9O1xuICAgIH0gZWxzZSB7XG4gICAgICBkZWJ1Z3Nbc2V0XSA9IGZ1bmN0aW9uKCkge307XG4gICAgfVxuICB9XG4gIHJldHVybiBkZWJ1Z3Nbc2V0XTtcbn07XG5cblxuLyoqXG4gKiBFY2hvcyB0aGUgdmFsdWUgb2YgYSB2YWx1ZS4gVHJ5cyB0byBwcmludCB0aGUgdmFsdWUgb3V0XG4gKiBpbiB0aGUgYmVzdCB3YXkgcG9zc2libGUgZ2l2ZW4gdGhlIGRpZmZlcmVudCB0eXBlcy5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqIFRoZSBvYmplY3QgdG8gcHJpbnQgb3V0LlxuICogQHBhcmFtIHtPYmplY3R9IG9wdHMgT3B0aW9uYWwgb3B0aW9ucyBvYmplY3QgdGhhdCBhbHRlcnMgdGhlIG91dHB1dC5cbiAqL1xuLyogbGVnYWN5OiBvYmosIHNob3dIaWRkZW4sIGRlcHRoLCBjb2xvcnMqL1xuZnVuY3Rpb24gaW5zcGVjdChvYmosIG9wdHMpIHtcbiAgLy8gZGVmYXVsdCBvcHRpb25zXG4gIHZhciBjdHggPSB7XG4gICAgc2VlbjogW10sXG4gICAgc3R5bGl6ZTogc3R5bGl6ZU5vQ29sb3JcbiAgfTtcbiAgLy8gbGVnYWN5Li4uXG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID49IDMpIGN0eC5kZXB0aCA9IGFyZ3VtZW50c1syXTtcbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPj0gNCkgY3R4LmNvbG9ycyA9IGFyZ3VtZW50c1szXTtcbiAgaWYgKGlzQm9vbGVhbihvcHRzKSkge1xuICAgIC8vIGxlZ2FjeS4uLlxuICAgIGN0eC5zaG93SGlkZGVuID0gb3B0cztcbiAgfSBlbHNlIGlmIChvcHRzKSB7XG4gICAgLy8gZ290IGFuIFwib3B0aW9uc1wiIG9iamVjdFxuICAgIGV4cG9ydHMuX2V4dGVuZChjdHgsIG9wdHMpO1xuICB9XG4gIC8vIHNldCBkZWZhdWx0IG9wdGlvbnNcbiAgaWYgKGlzVW5kZWZpbmVkKGN0eC5zaG93SGlkZGVuKSkgY3R4LnNob3dIaWRkZW4gPSBmYWxzZTtcbiAgaWYgKGlzVW5kZWZpbmVkKGN0eC5kZXB0aCkpIGN0eC5kZXB0aCA9IDI7XG4gIGlmIChpc1VuZGVmaW5lZChjdHguY29sb3JzKSkgY3R4LmNvbG9ycyA9IGZhbHNlO1xuICBpZiAoaXNVbmRlZmluZWQoY3R4LmN1c3RvbUluc3BlY3QpKSBjdHguY3VzdG9tSW5zcGVjdCA9IHRydWU7XG4gIGlmIChjdHguY29sb3JzKSBjdHguc3R5bGl6ZSA9IHN0eWxpemVXaXRoQ29sb3I7XG4gIHJldHVybiBmb3JtYXRWYWx1ZShjdHgsIG9iaiwgY3R4LmRlcHRoKTtcbn1cbmV4cG9ydHMuaW5zcGVjdCA9IGluc3BlY3Q7XG5cblxuLy8gaHR0cDovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9BTlNJX2VzY2FwZV9jb2RlI2dyYXBoaWNzXG5pbnNwZWN0LmNvbG9ycyA9IHtcbiAgJ2JvbGQnIDogWzEsIDIyXSxcbiAgJ2l0YWxpYycgOiBbMywgMjNdLFxuICAndW5kZXJsaW5lJyA6IFs0LCAyNF0sXG4gICdpbnZlcnNlJyA6IFs3LCAyN10sXG4gICd3aGl0ZScgOiBbMzcsIDM5XSxcbiAgJ2dyZXknIDogWzkwLCAzOV0sXG4gICdibGFjaycgOiBbMzAsIDM5XSxcbiAgJ2JsdWUnIDogWzM0LCAzOV0sXG4gICdjeWFuJyA6IFszNiwgMzldLFxuICAnZ3JlZW4nIDogWzMyLCAzOV0sXG4gICdtYWdlbnRhJyA6IFszNSwgMzldLFxuICAncmVkJyA6IFszMSwgMzldLFxuICAneWVsbG93JyA6IFszMywgMzldXG59O1xuXG4vLyBEb24ndCB1c2UgJ2JsdWUnIG5vdCB2aXNpYmxlIG9uIGNtZC5leGVcbmluc3BlY3Quc3R5bGVzID0ge1xuICAnc3BlY2lhbCc6ICdjeWFuJyxcbiAgJ251bWJlcic6ICd5ZWxsb3cnLFxuICAnYm9vbGVhbic6ICd5ZWxsb3cnLFxuICAndW5kZWZpbmVkJzogJ2dyZXknLFxuICAnbnVsbCc6ICdib2xkJyxcbiAgJ3N0cmluZyc6ICdncmVlbicsXG4gICdkYXRlJzogJ21hZ2VudGEnLFxuICAvLyBcIm5hbWVcIjogaW50ZW50aW9uYWxseSBub3Qgc3R5bGluZ1xuICAncmVnZXhwJzogJ3JlZCdcbn07XG5cblxuZnVuY3Rpb24gc3R5bGl6ZVdpdGhDb2xvcihzdHIsIHN0eWxlVHlwZSkge1xuICB2YXIgc3R5bGUgPSBpbnNwZWN0LnN0eWxlc1tzdHlsZVR5cGVdO1xuXG4gIGlmIChzdHlsZSkge1xuICAgIHJldHVybiAnXFx1MDAxYlsnICsgaW5zcGVjdC5jb2xvcnNbc3R5bGVdWzBdICsgJ20nICsgc3RyICtcbiAgICAgICAgICAgJ1xcdTAwMWJbJyArIGluc3BlY3QuY29sb3JzW3N0eWxlXVsxXSArICdtJztcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gc3RyO1xuICB9XG59XG5cblxuZnVuY3Rpb24gc3R5bGl6ZU5vQ29sb3Ioc3RyLCBzdHlsZVR5cGUpIHtcbiAgcmV0dXJuIHN0cjtcbn1cblxuXG5mdW5jdGlvbiBhcnJheVRvSGFzaChhcnJheSkge1xuICB2YXIgaGFzaCA9IHt9O1xuXG4gIGFycmF5LmZvckVhY2goZnVuY3Rpb24odmFsLCBpZHgpIHtcbiAgICBoYXNoW3ZhbF0gPSB0cnVlO1xuICB9KTtcblxuICByZXR1cm4gaGFzaDtcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRWYWx1ZShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMpIHtcbiAgLy8gUHJvdmlkZSBhIGhvb2sgZm9yIHVzZXItc3BlY2lmaWVkIGluc3BlY3QgZnVuY3Rpb25zLlxuICAvLyBDaGVjayB0aGF0IHZhbHVlIGlzIGFuIG9iamVjdCB3aXRoIGFuIGluc3BlY3QgZnVuY3Rpb24gb24gaXRcbiAgaWYgKGN0eC5jdXN0b21JbnNwZWN0ICYmXG4gICAgICB2YWx1ZSAmJlxuICAgICAgaXNGdW5jdGlvbih2YWx1ZS5pbnNwZWN0KSAmJlxuICAgICAgLy8gRmlsdGVyIG91dCB0aGUgdXRpbCBtb2R1bGUsIGl0J3MgaW5zcGVjdCBmdW5jdGlvbiBpcyBzcGVjaWFsXG4gICAgICB2YWx1ZS5pbnNwZWN0ICE9PSBleHBvcnRzLmluc3BlY3QgJiZcbiAgICAgIC8vIEFsc28gZmlsdGVyIG91dCBhbnkgcHJvdG90eXBlIG9iamVjdHMgdXNpbmcgdGhlIGNpcmN1bGFyIGNoZWNrLlxuICAgICAgISh2YWx1ZS5jb25zdHJ1Y3RvciAmJiB2YWx1ZS5jb25zdHJ1Y3Rvci5wcm90b3R5cGUgPT09IHZhbHVlKSkge1xuICAgIHZhciByZXQgPSB2YWx1ZS5pbnNwZWN0KHJlY3Vyc2VUaW1lcywgY3R4KTtcbiAgICBpZiAoIWlzU3RyaW5nKHJldCkpIHtcbiAgICAgIHJldCA9IGZvcm1hdFZhbHVlKGN0eCwgcmV0LCByZWN1cnNlVGltZXMpO1xuICAgIH1cbiAgICByZXR1cm4gcmV0O1xuICB9XG5cbiAgLy8gUHJpbWl0aXZlIHR5cGVzIGNhbm5vdCBoYXZlIHByb3BlcnRpZXNcbiAgdmFyIHByaW1pdGl2ZSA9IGZvcm1hdFByaW1pdGl2ZShjdHgsIHZhbHVlKTtcbiAgaWYgKHByaW1pdGl2ZSkge1xuICAgIHJldHVybiBwcmltaXRpdmU7XG4gIH1cblxuICAvLyBMb29rIHVwIHRoZSBrZXlzIG9mIHRoZSBvYmplY3QuXG4gIHZhciBrZXlzID0gT2JqZWN0LmtleXModmFsdWUpO1xuICB2YXIgdmlzaWJsZUtleXMgPSBhcnJheVRvSGFzaChrZXlzKTtcblxuICBpZiAoY3R4LnNob3dIaWRkZW4pIHtcbiAgICBrZXlzID0gT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXModmFsdWUpO1xuICB9XG5cbiAgLy8gSUUgZG9lc24ndCBtYWtlIGVycm9yIGZpZWxkcyBub24tZW51bWVyYWJsZVxuICAvLyBodHRwOi8vbXNkbi5taWNyb3NvZnQuY29tL2VuLXVzL2xpYnJhcnkvaWUvZHd3NTJzYnQodj12cy45NCkuYXNweFxuICBpZiAoaXNFcnJvcih2YWx1ZSlcbiAgICAgICYmIChrZXlzLmluZGV4T2YoJ21lc3NhZ2UnKSA+PSAwIHx8IGtleXMuaW5kZXhPZignZGVzY3JpcHRpb24nKSA+PSAwKSkge1xuICAgIHJldHVybiBmb3JtYXRFcnJvcih2YWx1ZSk7XG4gIH1cblxuICAvLyBTb21lIHR5cGUgb2Ygb2JqZWN0IHdpdGhvdXQgcHJvcGVydGllcyBjYW4gYmUgc2hvcnRjdXR0ZWQuXG4gIGlmIChrZXlzLmxlbmd0aCA9PT0gMCkge1xuICAgIGlmIChpc0Z1bmN0aW9uKHZhbHVlKSkge1xuICAgICAgdmFyIG5hbWUgPSB2YWx1ZS5uYW1lID8gJzogJyArIHZhbHVlLm5hbWUgOiAnJztcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZSgnW0Z1bmN0aW9uJyArIG5hbWUgKyAnXScsICdzcGVjaWFsJyk7XG4gICAgfVxuICAgIGlmIChpc1JlZ0V4cCh2YWx1ZSkpIHtcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZShSZWdFeHAucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpLCAncmVnZXhwJyk7XG4gICAgfVxuICAgIGlmIChpc0RhdGUodmFsdWUpKSB7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoRGF0ZS5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSksICdkYXRlJyk7XG4gICAgfVxuICAgIGlmIChpc0Vycm9yKHZhbHVlKSkge1xuICAgICAgcmV0dXJuIGZvcm1hdEVycm9yKHZhbHVlKTtcbiAgICB9XG4gIH1cblxuICB2YXIgYmFzZSA9ICcnLCBhcnJheSA9IGZhbHNlLCBicmFjZXMgPSBbJ3snLCAnfSddO1xuXG4gIC8vIE1ha2UgQXJyYXkgc2F5IHRoYXQgdGhleSBhcmUgQXJyYXlcbiAgaWYgKGlzQXJyYXkodmFsdWUpKSB7XG4gICAgYXJyYXkgPSB0cnVlO1xuICAgIGJyYWNlcyA9IFsnWycsICddJ107XG4gIH1cblxuICAvLyBNYWtlIGZ1bmN0aW9ucyBzYXkgdGhhdCB0aGV5IGFyZSBmdW5jdGlvbnNcbiAgaWYgKGlzRnVuY3Rpb24odmFsdWUpKSB7XG4gICAgdmFyIG4gPSB2YWx1ZS5uYW1lID8gJzogJyArIHZhbHVlLm5hbWUgOiAnJztcbiAgICBiYXNlID0gJyBbRnVuY3Rpb24nICsgbiArICddJztcbiAgfVxuXG4gIC8vIE1ha2UgUmVnRXhwcyBzYXkgdGhhdCB0aGV5IGFyZSBSZWdFeHBzXG4gIGlmIChpc1JlZ0V4cCh2YWx1ZSkpIHtcbiAgICBiYXNlID0gJyAnICsgUmVnRXhwLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKTtcbiAgfVxuXG4gIC8vIE1ha2UgZGF0ZXMgd2l0aCBwcm9wZXJ0aWVzIGZpcnN0IHNheSB0aGUgZGF0ZVxuICBpZiAoaXNEYXRlKHZhbHVlKSkge1xuICAgIGJhc2UgPSAnICcgKyBEYXRlLnByb3RvdHlwZS50b1VUQ1N0cmluZy5jYWxsKHZhbHVlKTtcbiAgfVxuXG4gIC8vIE1ha2UgZXJyb3Igd2l0aCBtZXNzYWdlIGZpcnN0IHNheSB0aGUgZXJyb3JcbiAgaWYgKGlzRXJyb3IodmFsdWUpKSB7XG4gICAgYmFzZSA9ICcgJyArIGZvcm1hdEVycm9yKHZhbHVlKTtcbiAgfVxuXG4gIGlmIChrZXlzLmxlbmd0aCA9PT0gMCAmJiAoIWFycmF5IHx8IHZhbHVlLmxlbmd0aCA9PSAwKSkge1xuICAgIHJldHVybiBicmFjZXNbMF0gKyBiYXNlICsgYnJhY2VzWzFdO1xuICB9XG5cbiAgaWYgKHJlY3Vyc2VUaW1lcyA8IDApIHtcbiAgICBpZiAoaXNSZWdFeHAodmFsdWUpKSB7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoUmVnRXhwLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKSwgJ3JlZ2V4cCcpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoJ1tPYmplY3RdJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gIH1cblxuICBjdHguc2Vlbi5wdXNoKHZhbHVlKTtcblxuICB2YXIgb3V0cHV0O1xuICBpZiAoYXJyYXkpIHtcbiAgICBvdXRwdXQgPSBmb3JtYXRBcnJheShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLCBrZXlzKTtcbiAgfSBlbHNlIHtcbiAgICBvdXRwdXQgPSBrZXlzLm1hcChmdW5jdGlvbihrZXkpIHtcbiAgICAgIHJldHVybiBmb3JtYXRQcm9wZXJ0eShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLCBrZXksIGFycmF5KTtcbiAgICB9KTtcbiAgfVxuXG4gIGN0eC5zZWVuLnBvcCgpO1xuXG4gIHJldHVybiByZWR1Y2VUb1NpbmdsZVN0cmluZyhvdXRwdXQsIGJhc2UsIGJyYWNlcyk7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0UHJpbWl0aXZlKGN0eCwgdmFsdWUpIHtcbiAgaWYgKGlzVW5kZWZpbmVkKHZhbHVlKSlcbiAgICByZXR1cm4gY3R4LnN0eWxpemUoJ3VuZGVmaW5lZCcsICd1bmRlZmluZWQnKTtcbiAgaWYgKGlzU3RyaW5nKHZhbHVlKSkge1xuICAgIHZhciBzaW1wbGUgPSAnXFwnJyArIEpTT04uc3RyaW5naWZ5KHZhbHVlKS5yZXBsYWNlKC9eXCJ8XCIkL2csICcnKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoLycvZywgXCJcXFxcJ1wiKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoL1xcXFxcIi9nLCAnXCInKSArICdcXCcnO1xuICAgIHJldHVybiBjdHguc3R5bGl6ZShzaW1wbGUsICdzdHJpbmcnKTtcbiAgfVxuICBpZiAoaXNOdW1iZXIodmFsdWUpKVxuICAgIHJldHVybiBjdHguc3R5bGl6ZSgnJyArIHZhbHVlLCAnbnVtYmVyJyk7XG4gIGlmIChpc0Jvb2xlYW4odmFsdWUpKVxuICAgIHJldHVybiBjdHguc3R5bGl6ZSgnJyArIHZhbHVlLCAnYm9vbGVhbicpO1xuICAvLyBGb3Igc29tZSByZWFzb24gdHlwZW9mIG51bGwgaXMgXCJvYmplY3RcIiwgc28gc3BlY2lhbCBjYXNlIGhlcmUuXG4gIGlmIChpc051bGwodmFsdWUpKVxuICAgIHJldHVybiBjdHguc3R5bGl6ZSgnbnVsbCcsICdudWxsJyk7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0RXJyb3IodmFsdWUpIHtcbiAgcmV0dXJuICdbJyArIEVycm9yLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKSArICddJztcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRBcnJheShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLCBrZXlzKSB7XG4gIHZhciBvdXRwdXQgPSBbXTtcbiAgZm9yICh2YXIgaSA9IDAsIGwgPSB2YWx1ZS5sZW5ndGg7IGkgPCBsOyArK2kpIHtcbiAgICBpZiAoaGFzT3duUHJvcGVydHkodmFsdWUsIFN0cmluZyhpKSkpIHtcbiAgICAgIG91dHB1dC5wdXNoKGZvcm1hdFByb3BlcnR5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsXG4gICAgICAgICAgU3RyaW5nKGkpLCB0cnVlKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG91dHB1dC5wdXNoKCcnKTtcbiAgICB9XG4gIH1cbiAga2V5cy5mb3JFYWNoKGZ1bmN0aW9uKGtleSkge1xuICAgIGlmICgha2V5Lm1hdGNoKC9eXFxkKyQvKSkge1xuICAgICAgb3V0cHV0LnB1c2goZm9ybWF0UHJvcGVydHkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cyxcbiAgICAgICAgICBrZXksIHRydWUpKTtcbiAgICB9XG4gIH0pO1xuICByZXR1cm4gb3V0cHV0O1xufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdFByb3BlcnR5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsIGtleSwgYXJyYXkpIHtcbiAgdmFyIG5hbWUsIHN0ciwgZGVzYztcbiAgZGVzYyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IodmFsdWUsIGtleSkgfHwgeyB2YWx1ZTogdmFsdWVba2V5XSB9O1xuICBpZiAoZGVzYy5nZXQpIHtcbiAgICBpZiAoZGVzYy5zZXQpIHtcbiAgICAgIHN0ciA9IGN0eC5zdHlsaXplKCdbR2V0dGVyL1NldHRlcl0nLCAnc3BlY2lhbCcpO1xuICAgIH0gZWxzZSB7XG4gICAgICBzdHIgPSBjdHguc3R5bGl6ZSgnW0dldHRlcl0nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBpZiAoZGVzYy5zZXQpIHtcbiAgICAgIHN0ciA9IGN0eC5zdHlsaXplKCdbU2V0dGVyXScsICdzcGVjaWFsJyk7XG4gICAgfVxuICB9XG4gIGlmICghaGFzT3duUHJvcGVydHkodmlzaWJsZUtleXMsIGtleSkpIHtcbiAgICBuYW1lID0gJ1snICsga2V5ICsgJ10nO1xuICB9XG4gIGlmICghc3RyKSB7XG4gICAgaWYgKGN0eC5zZWVuLmluZGV4T2YoZGVzYy52YWx1ZSkgPCAwKSB7XG4gICAgICBpZiAoaXNOdWxsKHJlY3Vyc2VUaW1lcykpIHtcbiAgICAgICAgc3RyID0gZm9ybWF0VmFsdWUoY3R4LCBkZXNjLnZhbHVlLCBudWxsKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHN0ciA9IGZvcm1hdFZhbHVlKGN0eCwgZGVzYy52YWx1ZSwgcmVjdXJzZVRpbWVzIC0gMSk7XG4gICAgICB9XG4gICAgICBpZiAoc3RyLmluZGV4T2YoJ1xcbicpID4gLTEpIHtcbiAgICAgICAgaWYgKGFycmF5KSB7XG4gICAgICAgICAgc3RyID0gc3RyLnNwbGl0KCdcXG4nKS5tYXAoZnVuY3Rpb24obGluZSkge1xuICAgICAgICAgICAgcmV0dXJuICcgICcgKyBsaW5lO1xuICAgICAgICAgIH0pLmpvaW4oJ1xcbicpLnN1YnN0cigyKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzdHIgPSAnXFxuJyArIHN0ci5zcGxpdCgnXFxuJykubWFwKGZ1bmN0aW9uKGxpbmUpIHtcbiAgICAgICAgICAgIHJldHVybiAnICAgJyArIGxpbmU7XG4gICAgICAgICAgfSkuam9pbignXFxuJyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgc3RyID0gY3R4LnN0eWxpemUoJ1tDaXJjdWxhcl0nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgfVxuICBpZiAoaXNVbmRlZmluZWQobmFtZSkpIHtcbiAgICBpZiAoYXJyYXkgJiYga2V5Lm1hdGNoKC9eXFxkKyQvKSkge1xuICAgICAgcmV0dXJuIHN0cjtcbiAgICB9XG4gICAgbmFtZSA9IEpTT04uc3RyaW5naWZ5KCcnICsga2V5KTtcbiAgICBpZiAobmFtZS5tYXRjaCgvXlwiKFthLXpBLVpfXVthLXpBLVpfMC05XSopXCIkLykpIHtcbiAgICAgIG5hbWUgPSBuYW1lLnN1YnN0cigxLCBuYW1lLmxlbmd0aCAtIDIpO1xuICAgICAgbmFtZSA9IGN0eC5zdHlsaXplKG5hbWUsICduYW1lJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG5hbWUgPSBuYW1lLnJlcGxhY2UoLycvZywgXCJcXFxcJ1wiKVxuICAgICAgICAgICAgICAgICAucmVwbGFjZSgvXFxcXFwiL2csICdcIicpXG4gICAgICAgICAgICAgICAgIC5yZXBsYWNlKC8oXlwifFwiJCkvZywgXCInXCIpO1xuICAgICAgbmFtZSA9IGN0eC5zdHlsaXplKG5hbWUsICdzdHJpbmcnKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gbmFtZSArICc6ICcgKyBzdHI7XG59XG5cblxuZnVuY3Rpb24gcmVkdWNlVG9TaW5nbGVTdHJpbmcob3V0cHV0LCBiYXNlLCBicmFjZXMpIHtcbiAgdmFyIG51bUxpbmVzRXN0ID0gMDtcbiAgdmFyIGxlbmd0aCA9IG91dHB1dC5yZWR1Y2UoZnVuY3Rpb24ocHJldiwgY3VyKSB7XG4gICAgbnVtTGluZXNFc3QrKztcbiAgICBpZiAoY3VyLmluZGV4T2YoJ1xcbicpID49IDApIG51bUxpbmVzRXN0Kys7XG4gICAgcmV0dXJuIHByZXYgKyBjdXIucmVwbGFjZSgvXFx1MDAxYlxcW1xcZFxcZD9tL2csICcnKS5sZW5ndGggKyAxO1xuICB9LCAwKTtcblxuICBpZiAobGVuZ3RoID4gNjApIHtcbiAgICByZXR1cm4gYnJhY2VzWzBdICtcbiAgICAgICAgICAgKGJhc2UgPT09ICcnID8gJycgOiBiYXNlICsgJ1xcbiAnKSArXG4gICAgICAgICAgICcgJyArXG4gICAgICAgICAgIG91dHB1dC5qb2luKCcsXFxuICAnKSArXG4gICAgICAgICAgICcgJyArXG4gICAgICAgICAgIGJyYWNlc1sxXTtcbiAgfVxuXG4gIHJldHVybiBicmFjZXNbMF0gKyBiYXNlICsgJyAnICsgb3V0cHV0LmpvaW4oJywgJykgKyAnICcgKyBicmFjZXNbMV07XG59XG5cblxuLy8gTk9URTogVGhlc2UgdHlwZSBjaGVja2luZyBmdW5jdGlvbnMgaW50ZW50aW9uYWxseSBkb24ndCB1c2UgYGluc3RhbmNlb2ZgXG4vLyBiZWNhdXNlIGl0IGlzIGZyYWdpbGUgYW5kIGNhbiBiZSBlYXNpbHkgZmFrZWQgd2l0aCBgT2JqZWN0LmNyZWF0ZSgpYC5cbmZ1bmN0aW9uIGlzQXJyYXkoYXIpIHtcbiAgcmV0dXJuIEFycmF5LmlzQXJyYXkoYXIpO1xufVxuZXhwb3J0cy5pc0FycmF5ID0gaXNBcnJheTtcblxuZnVuY3Rpb24gaXNCb29sZWFuKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ2Jvb2xlYW4nO1xufVxuZXhwb3J0cy5pc0Jvb2xlYW4gPSBpc0Jvb2xlYW47XG5cbmZ1bmN0aW9uIGlzTnVsbChhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PT0gbnVsbDtcbn1cbmV4cG9ydHMuaXNOdWxsID0gaXNOdWxsO1xuXG5mdW5jdGlvbiBpc051bGxPclVuZGVmaW5lZChhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PSBudWxsO1xufVxuZXhwb3J0cy5pc051bGxPclVuZGVmaW5lZCA9IGlzTnVsbE9yVW5kZWZpbmVkO1xuXG5mdW5jdGlvbiBpc051bWJlcihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdudW1iZXInO1xufVxuZXhwb3J0cy5pc051bWJlciA9IGlzTnVtYmVyO1xuXG5mdW5jdGlvbiBpc1N0cmluZyhhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdzdHJpbmcnO1xufVxuZXhwb3J0cy5pc1N0cmluZyA9IGlzU3RyaW5nO1xuXG5mdW5jdGlvbiBpc1N5bWJvbChhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdzeW1ib2wnO1xufVxuZXhwb3J0cy5pc1N5bWJvbCA9IGlzU3ltYm9sO1xuXG5mdW5jdGlvbiBpc1VuZGVmaW5lZChhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PT0gdm9pZCAwO1xufVxuZXhwb3J0cy5pc1VuZGVmaW5lZCA9IGlzVW5kZWZpbmVkO1xuXG5mdW5jdGlvbiBpc1JlZ0V4cChyZSkge1xuICByZXR1cm4gaXNPYmplY3QocmUpICYmIG9iamVjdFRvU3RyaW5nKHJlKSA9PT0gJ1tvYmplY3QgUmVnRXhwXSc7XG59XG5leHBvcnRzLmlzUmVnRXhwID0gaXNSZWdFeHA7XG5cbmZ1bmN0aW9uIGlzT2JqZWN0KGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ29iamVjdCcgJiYgYXJnICE9PSBudWxsO1xufVxuZXhwb3J0cy5pc09iamVjdCA9IGlzT2JqZWN0O1xuXG5mdW5jdGlvbiBpc0RhdGUoZCkge1xuICByZXR1cm4gaXNPYmplY3QoZCkgJiYgb2JqZWN0VG9TdHJpbmcoZCkgPT09ICdbb2JqZWN0IERhdGVdJztcbn1cbmV4cG9ydHMuaXNEYXRlID0gaXNEYXRlO1xuXG5mdW5jdGlvbiBpc0Vycm9yKGUpIHtcbiAgcmV0dXJuIGlzT2JqZWN0KGUpICYmXG4gICAgICAob2JqZWN0VG9TdHJpbmcoZSkgPT09ICdbb2JqZWN0IEVycm9yXScgfHwgZSBpbnN0YW5jZW9mIEVycm9yKTtcbn1cbmV4cG9ydHMuaXNFcnJvciA9IGlzRXJyb3I7XG5cbmZ1bmN0aW9uIGlzRnVuY3Rpb24oYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnZnVuY3Rpb24nO1xufVxuZXhwb3J0cy5pc0Z1bmN0aW9uID0gaXNGdW5jdGlvbjtcblxuZnVuY3Rpb24gaXNQcmltaXRpdmUoYXJnKSB7XG4gIHJldHVybiBhcmcgPT09IG51bGwgfHxcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICdib29sZWFuJyB8fFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ251bWJlcicgfHxcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICdzdHJpbmcnIHx8XG4gICAgICAgICB0eXBlb2YgYXJnID09PSAnc3ltYm9sJyB8fCAgLy8gRVM2IHN5bWJvbFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ3VuZGVmaW5lZCc7XG59XG5leHBvcnRzLmlzUHJpbWl0aXZlID0gaXNQcmltaXRpdmU7XG5cbmV4cG9ydHMuaXNCdWZmZXIgPSByZXF1aXJlKCcuL3N1cHBvcnQvaXNCdWZmZXInKTtcblxuZnVuY3Rpb24gb2JqZWN0VG9TdHJpbmcobykge1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG8pO1xufVxuXG5cbmZ1bmN0aW9uIHBhZChuKSB7XG4gIHJldHVybiBuIDwgMTAgPyAnMCcgKyBuLnRvU3RyaW5nKDEwKSA6IG4udG9TdHJpbmcoMTApO1xufVxuXG5cbnZhciBtb250aHMgPSBbJ0phbicsICdGZWInLCAnTWFyJywgJ0FwcicsICdNYXknLCAnSnVuJywgJ0p1bCcsICdBdWcnLCAnU2VwJyxcbiAgICAgICAgICAgICAgJ09jdCcsICdOb3YnLCAnRGVjJ107XG5cbi8vIDI2IEZlYiAxNjoxOTozNFxuZnVuY3Rpb24gdGltZXN0YW1wKCkge1xuICB2YXIgZCA9IG5ldyBEYXRlKCk7XG4gIHZhciB0aW1lID0gW3BhZChkLmdldEhvdXJzKCkpLFxuICAgICAgICAgICAgICBwYWQoZC5nZXRNaW51dGVzKCkpLFxuICAgICAgICAgICAgICBwYWQoZC5nZXRTZWNvbmRzKCkpXS5qb2luKCc6Jyk7XG4gIHJldHVybiBbZC5nZXREYXRlKCksIG1vbnRoc1tkLmdldE1vbnRoKCldLCB0aW1lXS5qb2luKCcgJyk7XG59XG5cblxuLy8gbG9nIGlzIGp1c3QgYSB0aGluIHdyYXBwZXIgdG8gY29uc29sZS5sb2cgdGhhdCBwcmVwZW5kcyBhIHRpbWVzdGFtcFxuZXhwb3J0cy5sb2cgPSBmdW5jdGlvbigpIHtcbiAgY29uc29sZS5sb2coJyVzIC0gJXMnLCB0aW1lc3RhbXAoKSwgZXhwb3J0cy5mb3JtYXQuYXBwbHkoZXhwb3J0cywgYXJndW1lbnRzKSk7XG59O1xuXG5cbi8qKlxuICogSW5oZXJpdCB0aGUgcHJvdG90eXBlIG1ldGhvZHMgZnJvbSBvbmUgY29uc3RydWN0b3IgaW50byBhbm90aGVyLlxuICpcbiAqIFRoZSBGdW5jdGlvbi5wcm90b3R5cGUuaW5oZXJpdHMgZnJvbSBsYW5nLmpzIHJld3JpdHRlbiBhcyBhIHN0YW5kYWxvbmVcbiAqIGZ1bmN0aW9uIChub3Qgb24gRnVuY3Rpb24ucHJvdG90eXBlKS4gTk9URTogSWYgdGhpcyBmaWxlIGlzIHRvIGJlIGxvYWRlZFxuICogZHVyaW5nIGJvb3RzdHJhcHBpbmcgdGhpcyBmdW5jdGlvbiBuZWVkcyB0byBiZSByZXdyaXR0ZW4gdXNpbmcgc29tZSBuYXRpdmVcbiAqIGZ1bmN0aW9ucyBhcyBwcm90b3R5cGUgc2V0dXAgdXNpbmcgbm9ybWFsIEphdmFTY3JpcHQgZG9lcyBub3Qgd29yayBhc1xuICogZXhwZWN0ZWQgZHVyaW5nIGJvb3RzdHJhcHBpbmcgKHNlZSBtaXJyb3IuanMgaW4gcjExNDkwMykuXG4gKlxuICogQHBhcmFtIHtmdW5jdGlvbn0gY3RvciBDb25zdHJ1Y3RvciBmdW5jdGlvbiB3aGljaCBuZWVkcyB0byBpbmhlcml0IHRoZVxuICogICAgIHByb3RvdHlwZS5cbiAqIEBwYXJhbSB7ZnVuY3Rpb259IHN1cGVyQ3RvciBDb25zdHJ1Y3RvciBmdW5jdGlvbiB0byBpbmhlcml0IHByb3RvdHlwZSBmcm9tLlxuICovXG5leHBvcnRzLmluaGVyaXRzID0gcmVxdWlyZSgnaW5oZXJpdHMnKTtcblxuZXhwb3J0cy5fZXh0ZW5kID0gZnVuY3Rpb24ob3JpZ2luLCBhZGQpIHtcbiAgLy8gRG9uJ3QgZG8gYW55dGhpbmcgaWYgYWRkIGlzbid0IGFuIG9iamVjdFxuICBpZiAoIWFkZCB8fCAhaXNPYmplY3QoYWRkKSkgcmV0dXJuIG9yaWdpbjtcblxuICB2YXIga2V5cyA9IE9iamVjdC5rZXlzKGFkZCk7XG4gIHZhciBpID0ga2V5cy5sZW5ndGg7XG4gIHdoaWxlIChpLS0pIHtcbiAgICBvcmlnaW5ba2V5c1tpXV0gPSBhZGRba2V5c1tpXV07XG4gIH1cbiAgcmV0dXJuIG9yaWdpbjtcbn07XG5cbmZ1bmN0aW9uIGhhc093blByb3BlcnR5KG9iaiwgcHJvcCkge1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwgcHJvcCk7XG59XG4iLCIvLyBHZW5lcmF0ZWQgYnkgQ29mZmVlU2NyaXB0IDEuOC4wXG52YXIgRHVtcGVyLCBJbmxpbmUsIFV0aWxzO1xuXG5VdGlscyA9IHJlcXVpcmUoJy4vVXRpbHMnKTtcblxuSW5saW5lID0gcmVxdWlyZSgnLi9JbmxpbmUnKTtcblxuRHVtcGVyID0gKGZ1bmN0aW9uKCkge1xuICBmdW5jdGlvbiBEdW1wZXIoKSB7fVxuXG4gIER1bXBlci5pbmRlbnRhdGlvbiA9IDQ7XG5cbiAgRHVtcGVyLnByb3RvdHlwZS5kdW1wID0gZnVuY3Rpb24oaW5wdXQsIGlubGluZSwgaW5kZW50LCBleGNlcHRpb25PbkludmFsaWRUeXBlLCBvYmplY3RFbmNvZGVyKSB7XG4gICAgdmFyIGtleSwgb3V0cHV0LCBwcmVmaXgsIHZhbHVlLCB3aWxsQmVJbmxpbmVkLCBfaSwgX2xlbjtcbiAgICBpZiAoaW5saW5lID09IG51bGwpIHtcbiAgICAgIGlubGluZSA9IDA7XG4gICAgfVxuICAgIGlmIChpbmRlbnQgPT0gbnVsbCkge1xuICAgICAgaW5kZW50ID0gMDtcbiAgICB9XG4gICAgaWYgKGV4Y2VwdGlvbk9uSW52YWxpZFR5cGUgPT0gbnVsbCkge1xuICAgICAgZXhjZXB0aW9uT25JbnZhbGlkVHlwZSA9IGZhbHNlO1xuICAgIH1cbiAgICBpZiAob2JqZWN0RW5jb2RlciA9PSBudWxsKSB7XG4gICAgICBvYmplY3RFbmNvZGVyID0gbnVsbDtcbiAgICB9XG4gICAgb3V0cHV0ID0gJyc7XG4gICAgcHJlZml4ID0gKGluZGVudCA/IFV0aWxzLnN0clJlcGVhdCgnICcsIGluZGVudCkgOiAnJyk7XG4gICAgaWYgKGlubGluZSA8PSAwIHx8IHR5cGVvZiBpbnB1dCAhPT0gJ29iamVjdCcgfHwgaW5wdXQgaW5zdGFuY2VvZiBEYXRlIHx8IFV0aWxzLmlzRW1wdHkoaW5wdXQpKSB7XG4gICAgICBvdXRwdXQgKz0gcHJlZml4ICsgSW5saW5lLmR1bXAoaW5wdXQsIGV4Y2VwdGlvbk9uSW52YWxpZFR5cGUsIG9iamVjdEVuY29kZXIpO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoaW5wdXQgaW5zdGFuY2VvZiBBcnJheSkge1xuICAgICAgICBmb3IgKF9pID0gMCwgX2xlbiA9IGlucHV0Lmxlbmd0aDsgX2kgPCBfbGVuOyBfaSsrKSB7XG4gICAgICAgICAgdmFsdWUgPSBpbnB1dFtfaV07XG4gICAgICAgICAgd2lsbEJlSW5saW5lZCA9IGlubGluZSAtIDEgPD0gMCB8fCB0eXBlb2YgdmFsdWUgIT09ICdvYmplY3QnIHx8IFV0aWxzLmlzRW1wdHkodmFsdWUpO1xuICAgICAgICAgIG91dHB1dCArPSBwcmVmaXggKyAnLScgKyAod2lsbEJlSW5saW5lZCA/ICcgJyA6IFwiXFxuXCIpICsgdGhpcy5kdW1wKHZhbHVlLCBpbmxpbmUgLSAxLCAod2lsbEJlSW5saW5lZCA/IDAgOiBpbmRlbnQgKyB0aGlzLmluZGVudGF0aW9uKSwgZXhjZXB0aW9uT25JbnZhbGlkVHlwZSwgb2JqZWN0RW5jb2RlcikgKyAod2lsbEJlSW5saW5lZCA/IFwiXFxuXCIgOiAnJyk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGZvciAoa2V5IGluIGlucHV0KSB7XG4gICAgICAgICAgdmFsdWUgPSBpbnB1dFtrZXldO1xuICAgICAgICAgIHdpbGxCZUlubGluZWQgPSBpbmxpbmUgLSAxIDw9IDAgfHwgdHlwZW9mIHZhbHVlICE9PSAnb2JqZWN0JyB8fCBVdGlscy5pc0VtcHR5KHZhbHVlKTtcbiAgICAgICAgICBvdXRwdXQgKz0gcHJlZml4ICsgSW5saW5lLmR1bXAoa2V5LCBleGNlcHRpb25PbkludmFsaWRUeXBlLCBvYmplY3RFbmNvZGVyKSArICc6JyArICh3aWxsQmVJbmxpbmVkID8gJyAnIDogXCJcXG5cIikgKyB0aGlzLmR1bXAodmFsdWUsIGlubGluZSAtIDEsICh3aWxsQmVJbmxpbmVkID8gMCA6IGluZGVudCArIHRoaXMuaW5kZW50YXRpb24pLCBleGNlcHRpb25PbkludmFsaWRUeXBlLCBvYmplY3RFbmNvZGVyKSArICh3aWxsQmVJbmxpbmVkID8gXCJcXG5cIiA6ICcnKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gb3V0cHV0O1xuICB9O1xuXG4gIHJldHVybiBEdW1wZXI7XG5cbn0pKCk7XG5cbm1vZHVsZS5leHBvcnRzID0gRHVtcGVyO1xuIiwiLy8gR2VuZXJhdGVkIGJ5IENvZmZlZVNjcmlwdCAxLjguMFxudmFyIEVzY2FwZXIsIFBhdHRlcm47XG5cblBhdHRlcm4gPSByZXF1aXJlKCcuL1BhdHRlcm4nKTtcblxuRXNjYXBlciA9IChmdW5jdGlvbigpIHtcbiAgdmFyIGNoO1xuXG4gIGZ1bmN0aW9uIEVzY2FwZXIoKSB7fVxuXG4gIEVzY2FwZXIuTElTVF9FU0NBUEVFUyA9IFsnXFxcXFxcXFwnLCAnXFxcXFwiJywgJ1wiJywgXCJcXHgwMFwiLCBcIlxceDAxXCIsIFwiXFx4MDJcIiwgXCJcXHgwM1wiLCBcIlxceDA0XCIsIFwiXFx4MDVcIiwgXCJcXHgwNlwiLCBcIlxceDA3XCIsIFwiXFx4MDhcIiwgXCJcXHgwOVwiLCBcIlxceDBhXCIsIFwiXFx4MGJcIiwgXCJcXHgwY1wiLCBcIlxceDBkXCIsIFwiXFx4MGVcIiwgXCJcXHgwZlwiLCBcIlxceDEwXCIsIFwiXFx4MTFcIiwgXCJcXHgxMlwiLCBcIlxceDEzXCIsIFwiXFx4MTRcIiwgXCJcXHgxNVwiLCBcIlxceDE2XCIsIFwiXFx4MTdcIiwgXCJcXHgxOFwiLCBcIlxceDE5XCIsIFwiXFx4MWFcIiwgXCJcXHgxYlwiLCBcIlxceDFjXCIsIFwiXFx4MWRcIiwgXCJcXHgxZVwiLCBcIlxceDFmXCIsIChjaCA9IFN0cmluZy5mcm9tQ2hhckNvZGUpKDB4MDA4NSksIGNoKDB4MDBBMCksIGNoKDB4MjAyOCksIGNoKDB4MjAyOSldO1xuXG4gIEVzY2FwZXIuTElTVF9FU0NBUEVEID0gWydcXFxcXCInLCAnXFxcXFxcXFwnLCAnXFxcXFwiJywgXCJcXFxcMFwiLCBcIlxcXFx4MDFcIiwgXCJcXFxceDAyXCIsIFwiXFxcXHgwM1wiLCBcIlxcXFx4MDRcIiwgXCJcXFxceDA1XCIsIFwiXFxcXHgwNlwiLCBcIlxcXFxhXCIsIFwiXFxcXGJcIiwgXCJcXFxcdFwiLCBcIlxcXFxuXCIsIFwiXFxcXHZcIiwgXCJcXFxcZlwiLCBcIlxcXFxyXCIsIFwiXFxcXHgwZVwiLCBcIlxcXFx4MGZcIiwgXCJcXFxceDEwXCIsIFwiXFxcXHgxMVwiLCBcIlxcXFx4MTJcIiwgXCJcXFxceDEzXCIsIFwiXFxcXHgxNFwiLCBcIlxcXFx4MTVcIiwgXCJcXFxceDE2XCIsIFwiXFxcXHgxN1wiLCBcIlxcXFx4MThcIiwgXCJcXFxceDE5XCIsIFwiXFxcXHgxYVwiLCBcIlxcXFxlXCIsIFwiXFxcXHgxY1wiLCBcIlxcXFx4MWRcIiwgXCJcXFxceDFlXCIsIFwiXFxcXHgxZlwiLCBcIlxcXFxOXCIsIFwiXFxcXF9cIiwgXCJcXFxcTFwiLCBcIlxcXFxQXCJdO1xuXG4gIEVzY2FwZXIuTUFQUElOR19FU0NBUEVFU19UT19FU0NBUEVEID0gKGZ1bmN0aW9uKCkge1xuICAgIHZhciBpLCBtYXBwaW5nLCBfaSwgX3JlZjtcbiAgICBtYXBwaW5nID0ge307XG4gICAgZm9yIChpID0gX2kgPSAwLCBfcmVmID0gRXNjYXBlci5MSVNUX0VTQ0FQRUVTLmxlbmd0aDsgMCA8PSBfcmVmID8gX2kgPCBfcmVmIDogX2kgPiBfcmVmOyBpID0gMCA8PSBfcmVmID8gKytfaSA6IC0tX2kpIHtcbiAgICAgIG1hcHBpbmdbRXNjYXBlci5MSVNUX0VTQ0FQRUVTW2ldXSA9IEVzY2FwZXIuTElTVF9FU0NBUEVEW2ldO1xuICAgIH1cbiAgICByZXR1cm4gbWFwcGluZztcbiAgfSkoKTtcblxuICBFc2NhcGVyLlBBVFRFUk5fQ0hBUkFDVEVSU19UT19FU0NBUEUgPSBuZXcgUGF0dGVybignW1xcXFx4MDAtXFxcXHgxZl18XFx4YzJcXHg4NXxcXHhjMlxceGEwfFxceGUyXFx4ODBcXHhhOHxcXHhlMlxceDgwXFx4YTknKTtcblxuICBFc2NhcGVyLlBBVFRFUk5fTUFQUElOR19FU0NBUEVFUyA9IG5ldyBQYXR0ZXJuKEVzY2FwZXIuTElTVF9FU0NBUEVFUy5qb2luKCd8JykpO1xuXG4gIEVzY2FwZXIuUEFUVEVSTl9TSU5HTEVfUVVPVElORyA9IG5ldyBQYXR0ZXJuKCdbXFxcXHNcXCdcIjp7fVtcXFxcXSwmKiM/XXxeWy0/fDw+PSElQGBdJyk7XG5cbiAgRXNjYXBlci5yZXF1aXJlc0RvdWJsZVF1b3RpbmcgPSBmdW5jdGlvbih2YWx1ZSkge1xuICAgIHJldHVybiB0aGlzLlBBVFRFUk5fQ0hBUkFDVEVSU19UT19FU0NBUEUudGVzdCh2YWx1ZSk7XG4gIH07XG5cbiAgRXNjYXBlci5lc2NhcGVXaXRoRG91YmxlUXVvdGVzID0gZnVuY3Rpb24odmFsdWUpIHtcbiAgICB2YXIgcmVzdWx0O1xuICAgIHJlc3VsdCA9IHRoaXMuUEFUVEVSTl9NQVBQSU5HX0VTQ0FQRUVTLnJlcGxhY2UodmFsdWUsIChmdW5jdGlvbihfdGhpcykge1xuICAgICAgcmV0dXJuIGZ1bmN0aW9uKHN0cikge1xuICAgICAgICByZXR1cm4gX3RoaXMuTUFQUElOR19FU0NBUEVFU19UT19FU0NBUEVEW3N0cl07XG4gICAgICB9O1xuICAgIH0pKHRoaXMpKTtcbiAgICByZXR1cm4gJ1wiJyArIHJlc3VsdCArICdcIic7XG4gIH07XG5cbiAgRXNjYXBlci5yZXF1aXJlc1NpbmdsZVF1b3RpbmcgPSBmdW5jdGlvbih2YWx1ZSkge1xuICAgIHJldHVybiB0aGlzLlBBVFRFUk5fU0lOR0xFX1FVT1RJTkcudGVzdCh2YWx1ZSk7XG4gIH07XG5cbiAgRXNjYXBlci5lc2NhcGVXaXRoU2luZ2xlUXVvdGVzID0gZnVuY3Rpb24odmFsdWUpIHtcbiAgICByZXR1cm4gXCInXCIgKyB2YWx1ZS5yZXBsYWNlKC8nL2csIFwiJydcIikgKyBcIidcIjtcbiAgfTtcblxuICByZXR1cm4gRXNjYXBlcjtcblxufSkoKTtcblxubW9kdWxlLmV4cG9ydHMgPSBFc2NhcGVyO1xuIiwiLy8gR2VuZXJhdGVkIGJ5IENvZmZlZVNjcmlwdCAxLjguMFxudmFyIER1bXBFeGNlcHRpb24sXG4gIF9faGFzUHJvcCA9IHt9Lmhhc093blByb3BlcnR5LFxuICBfX2V4dGVuZHMgPSBmdW5jdGlvbihjaGlsZCwgcGFyZW50KSB7IGZvciAodmFyIGtleSBpbiBwYXJlbnQpIHsgaWYgKF9faGFzUHJvcC5jYWxsKHBhcmVudCwga2V5KSkgY2hpbGRba2V5XSA9IHBhcmVudFtrZXldOyB9IGZ1bmN0aW9uIGN0b3IoKSB7IHRoaXMuY29uc3RydWN0b3IgPSBjaGlsZDsgfSBjdG9yLnByb3RvdHlwZSA9IHBhcmVudC5wcm90b3R5cGU7IGNoaWxkLnByb3RvdHlwZSA9IG5ldyBjdG9yKCk7IGNoaWxkLl9fc3VwZXJfXyA9IHBhcmVudC5wcm90b3R5cGU7IHJldHVybiBjaGlsZDsgfTtcblxuRHVtcEV4Y2VwdGlvbiA9IChmdW5jdGlvbihfc3VwZXIpIHtcbiAgX19leHRlbmRzKER1bXBFeGNlcHRpb24sIF9zdXBlcik7XG5cbiAgZnVuY3Rpb24gRHVtcEV4Y2VwdGlvbihtZXNzYWdlLCBwYXJzZWRMaW5lLCBzbmlwcGV0KSB7XG4gICAgdGhpcy5tZXNzYWdlID0gbWVzc2FnZTtcbiAgICB0aGlzLnBhcnNlZExpbmUgPSBwYXJzZWRMaW5lO1xuICAgIHRoaXMuc25pcHBldCA9IHNuaXBwZXQ7XG4gIH1cblxuICBEdW1wRXhjZXB0aW9uLnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uKCkge1xuICAgIGlmICgodGhpcy5wYXJzZWRMaW5lICE9IG51bGwpICYmICh0aGlzLnNuaXBwZXQgIT0gbnVsbCkpIHtcbiAgICAgIHJldHVybiAnPER1bXBFeGNlcHRpb24+ICcgKyB0aGlzLm1lc3NhZ2UgKyAnIChsaW5lICcgKyB0aGlzLnBhcnNlZExpbmUgKyAnOiBcXCcnICsgdGhpcy5zbmlwcGV0ICsgJ1xcJyknO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gJzxEdW1wRXhjZXB0aW9uPiAnICsgdGhpcy5tZXNzYWdlO1xuICAgIH1cbiAgfTtcblxuICByZXR1cm4gRHVtcEV4Y2VwdGlvbjtcblxufSkoRXJyb3IpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IER1bXBFeGNlcHRpb247XG4iLCIvLyBHZW5lcmF0ZWQgYnkgQ29mZmVlU2NyaXB0IDEuOC4wXG52YXIgUGFyc2VFeGNlcHRpb24sXG4gIF9faGFzUHJvcCA9IHt9Lmhhc093blByb3BlcnR5LFxuICBfX2V4dGVuZHMgPSBmdW5jdGlvbihjaGlsZCwgcGFyZW50KSB7IGZvciAodmFyIGtleSBpbiBwYXJlbnQpIHsgaWYgKF9faGFzUHJvcC5jYWxsKHBhcmVudCwga2V5KSkgY2hpbGRba2V5XSA9IHBhcmVudFtrZXldOyB9IGZ1bmN0aW9uIGN0b3IoKSB7IHRoaXMuY29uc3RydWN0b3IgPSBjaGlsZDsgfSBjdG9yLnByb3RvdHlwZSA9IHBhcmVudC5wcm90b3R5cGU7IGNoaWxkLnByb3RvdHlwZSA9IG5ldyBjdG9yKCk7IGNoaWxkLl9fc3VwZXJfXyA9IHBhcmVudC5wcm90b3R5cGU7IHJldHVybiBjaGlsZDsgfTtcblxuUGFyc2VFeGNlcHRpb24gPSAoZnVuY3Rpb24oX3N1cGVyKSB7XG4gIF9fZXh0ZW5kcyhQYXJzZUV4Y2VwdGlvbiwgX3N1cGVyKTtcblxuICBmdW5jdGlvbiBQYXJzZUV4Y2VwdGlvbihtZXNzYWdlLCBwYXJzZWRMaW5lLCBzbmlwcGV0KSB7XG4gICAgdGhpcy5tZXNzYWdlID0gbWVzc2FnZTtcbiAgICB0aGlzLnBhcnNlZExpbmUgPSBwYXJzZWRMaW5lO1xuICAgIHRoaXMuc25pcHBldCA9IHNuaXBwZXQ7XG4gIH1cblxuICBQYXJzZUV4Y2VwdGlvbi5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbigpIHtcbiAgICBpZiAoKHRoaXMucGFyc2VkTGluZSAhPSBudWxsKSAmJiAodGhpcy5zbmlwcGV0ICE9IG51bGwpKSB7XG4gICAgICByZXR1cm4gJzxQYXJzZUV4Y2VwdGlvbj4gJyArIHRoaXMubWVzc2FnZSArICcgKGxpbmUgJyArIHRoaXMucGFyc2VkTGluZSArICc6IFxcJycgKyB0aGlzLnNuaXBwZXQgKyAnXFwnKSc7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiAnPFBhcnNlRXhjZXB0aW9uPiAnICsgdGhpcy5tZXNzYWdlO1xuICAgIH1cbiAgfTtcblxuICByZXR1cm4gUGFyc2VFeGNlcHRpb247XG5cbn0pKEVycm9yKTtcblxubW9kdWxlLmV4cG9ydHMgPSBQYXJzZUV4Y2VwdGlvbjtcbiIsIi8vIEdlbmVyYXRlZCBieSBDb2ZmZWVTY3JpcHQgMS44LjBcbnZhciBEdW1wRXhjZXB0aW9uLCBFc2NhcGVyLCBJbmxpbmUsIFBhcnNlRXhjZXB0aW9uLCBQYXR0ZXJuLCBVbmVzY2FwZXIsIFV0aWxzLFxuICBfX2luZGV4T2YgPSBbXS5pbmRleE9mIHx8IGZ1bmN0aW9uKGl0ZW0pIHsgZm9yICh2YXIgaSA9IDAsIGwgPSB0aGlzLmxlbmd0aDsgaSA8IGw7IGkrKykgeyBpZiAoaSBpbiB0aGlzICYmIHRoaXNbaV0gPT09IGl0ZW0pIHJldHVybiBpOyB9IHJldHVybiAtMTsgfTtcblxuUGF0dGVybiA9IHJlcXVpcmUoJy4vUGF0dGVybicpO1xuXG5VbmVzY2FwZXIgPSByZXF1aXJlKCcuL1VuZXNjYXBlcicpO1xuXG5Fc2NhcGVyID0gcmVxdWlyZSgnLi9Fc2NhcGVyJyk7XG5cblV0aWxzID0gcmVxdWlyZSgnLi9VdGlscycpO1xuXG5QYXJzZUV4Y2VwdGlvbiA9IHJlcXVpcmUoJy4vRXhjZXB0aW9uL1BhcnNlRXhjZXB0aW9uJyk7XG5cbkR1bXBFeGNlcHRpb24gPSByZXF1aXJlKCcuL0V4Y2VwdGlvbi9EdW1wRXhjZXB0aW9uJyk7XG5cbklubGluZSA9IChmdW5jdGlvbigpIHtcbiAgZnVuY3Rpb24gSW5saW5lKCkge31cblxuICBJbmxpbmUuUkVHRVhfUVVPVEVEX1NUUklORyA9ICcoPzpcIig/OlteXCJcXFxcXFxcXF0qKD86XFxcXFxcXFwuW15cIlxcXFxcXFxcXSopKilcInxcXCcoPzpbXlxcJ10qKD86XFwnXFwnW15cXCddKikqKVxcJyknO1xuXG4gIElubGluZS5QQVRURVJOX1RSQUlMSU5HX0NPTU1FTlRTID0gbmV3IFBhdHRlcm4oJ15cXFxccyojLiokJyk7XG5cbiAgSW5saW5lLlBBVFRFUk5fUVVPVEVEX1NDQUxBUiA9IG5ldyBQYXR0ZXJuKCdeJyArIElubGluZS5SRUdFWF9RVU9URURfU1RSSU5HKTtcblxuICBJbmxpbmUuUEFUVEVSTl9USE9VU0FORF9OVU1FUklDX1NDQUxBUiA9IG5ldyBQYXR0ZXJuKCdeKC18XFxcXCspP1swLTksXSsoXFxcXC5bMC05XSspPyQnKTtcblxuICBJbmxpbmUuUEFUVEVSTl9TQ0FMQVJfQllfREVMSU1JVEVSUyA9IHt9O1xuXG4gIElubGluZS5zZXR0aW5ncyA9IHt9O1xuXG4gIElubGluZS5jb25maWd1cmUgPSBmdW5jdGlvbihleGNlcHRpb25PbkludmFsaWRUeXBlLCBvYmplY3REZWNvZGVyKSB7XG4gICAgaWYgKGV4Y2VwdGlvbk9uSW52YWxpZFR5cGUgPT0gbnVsbCkge1xuICAgICAgZXhjZXB0aW9uT25JbnZhbGlkVHlwZSA9IG51bGw7XG4gICAgfVxuICAgIGlmIChvYmplY3REZWNvZGVyID09IG51bGwpIHtcbiAgICAgIG9iamVjdERlY29kZXIgPSBudWxsO1xuICAgIH1cbiAgICB0aGlzLnNldHRpbmdzLmV4Y2VwdGlvbk9uSW52YWxpZFR5cGUgPSBleGNlcHRpb25PbkludmFsaWRUeXBlO1xuICAgIHRoaXMuc2V0dGluZ3Mub2JqZWN0RGVjb2RlciA9IG9iamVjdERlY29kZXI7XG4gIH07XG5cbiAgSW5saW5lLnBhcnNlID0gZnVuY3Rpb24odmFsdWUsIGV4Y2VwdGlvbk9uSW52YWxpZFR5cGUsIG9iamVjdERlY29kZXIpIHtcbiAgICB2YXIgY29udGV4dCwgcmVzdWx0O1xuICAgIGlmIChleGNlcHRpb25PbkludmFsaWRUeXBlID09IG51bGwpIHtcbiAgICAgIGV4Y2VwdGlvbk9uSW52YWxpZFR5cGUgPSBmYWxzZTtcbiAgICB9XG4gICAgaWYgKG9iamVjdERlY29kZXIgPT0gbnVsbCkge1xuICAgICAgb2JqZWN0RGVjb2RlciA9IG51bGw7XG4gICAgfVxuICAgIHRoaXMuc2V0dGluZ3MuZXhjZXB0aW9uT25JbnZhbGlkVHlwZSA9IGV4Y2VwdGlvbk9uSW52YWxpZFR5cGU7XG4gICAgdGhpcy5zZXR0aW5ncy5vYmplY3REZWNvZGVyID0gb2JqZWN0RGVjb2RlcjtcbiAgICBpZiAodmFsdWUgPT0gbnVsbCkge1xuICAgICAgcmV0dXJuICcnO1xuICAgIH1cbiAgICB2YWx1ZSA9IFV0aWxzLnRyaW0odmFsdWUpO1xuICAgIGlmICgwID09PSB2YWx1ZS5sZW5ndGgpIHtcbiAgICAgIHJldHVybiAnJztcbiAgICB9XG4gICAgY29udGV4dCA9IHtcbiAgICAgIGV4Y2VwdGlvbk9uSW52YWxpZFR5cGU6IGV4Y2VwdGlvbk9uSW52YWxpZFR5cGUsXG4gICAgICBvYmplY3REZWNvZGVyOiBvYmplY3REZWNvZGVyLFxuICAgICAgaTogMFxuICAgIH07XG4gICAgc3dpdGNoICh2YWx1ZS5jaGFyQXQoMCkpIHtcbiAgICAgIGNhc2UgJ1snOlxuICAgICAgICByZXN1bHQgPSB0aGlzLnBhcnNlU2VxdWVuY2UodmFsdWUsIGNvbnRleHQpO1xuICAgICAgICArK2NvbnRleHQuaTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICd7JzpcbiAgICAgICAgcmVzdWx0ID0gdGhpcy5wYXJzZU1hcHBpbmcodmFsdWUsIGNvbnRleHQpO1xuICAgICAgICArK2NvbnRleHQuaTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICByZXN1bHQgPSB0aGlzLnBhcnNlU2NhbGFyKHZhbHVlLCBudWxsLCBbJ1wiJywgXCInXCJdLCBjb250ZXh0KTtcbiAgICB9XG4gICAgaWYgKHRoaXMuUEFUVEVSTl9UUkFJTElOR19DT01NRU5UUy5yZXBsYWNlKHZhbHVlLnNsaWNlKGNvbnRleHQuaSksICcnKSAhPT0gJycpIHtcbiAgICAgIHRocm93IG5ldyBQYXJzZUV4Y2VwdGlvbignVW5leHBlY3RlZCBjaGFyYWN0ZXJzIG5lYXIgXCInICsgdmFsdWUuc2xpY2UoY29udGV4dC5pKSArICdcIi4nKTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfTtcblxuICBJbmxpbmUuZHVtcCA9IGZ1bmN0aW9uKHZhbHVlLCBleGNlcHRpb25PbkludmFsaWRUeXBlLCBvYmplY3RFbmNvZGVyKSB7XG4gICAgdmFyIHJlc3VsdCwgdHlwZSwgX3JlZjtcbiAgICBpZiAoZXhjZXB0aW9uT25JbnZhbGlkVHlwZSA9PSBudWxsKSB7XG4gICAgICBleGNlcHRpb25PbkludmFsaWRUeXBlID0gZmFsc2U7XG4gICAgfVxuICAgIGlmIChvYmplY3RFbmNvZGVyID09IG51bGwpIHtcbiAgICAgIG9iamVjdEVuY29kZXIgPSBudWxsO1xuICAgIH1cbiAgICBpZiAodmFsdWUgPT0gbnVsbCkge1xuICAgICAgcmV0dXJuICdudWxsJztcbiAgICB9XG4gICAgdHlwZSA9IHR5cGVvZiB2YWx1ZTtcbiAgICBpZiAodHlwZSA9PT0gJ29iamVjdCcpIHtcbiAgICAgIGlmICh2YWx1ZSBpbnN0YW5jZW9mIERhdGUpIHtcbiAgICAgICAgcmV0dXJuIHZhbHVlLnRvSVNPU3RyaW5nKCk7XG4gICAgICB9IGVsc2UgaWYgKG9iamVjdEVuY29kZXIgIT0gbnVsbCkge1xuICAgICAgICByZXN1bHQgPSBvYmplY3RFbmNvZGVyKHZhbHVlKTtcbiAgICAgICAgaWYgKHR5cGVvZiByZXN1bHQgPT09ICdzdHJpbmcnIHx8IChyZXN1bHQgIT0gbnVsbCkpIHtcbiAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gdGhpcy5kdW1wT2JqZWN0KHZhbHVlKTtcbiAgICB9XG4gICAgaWYgKHR5cGUgPT09ICdib29sZWFuJykge1xuICAgICAgcmV0dXJuICh2YWx1ZSA/ICd0cnVlJyA6ICdmYWxzZScpO1xuICAgIH1cbiAgICBpZiAoVXRpbHMuaXNEaWdpdHModmFsdWUpKSB7XG4gICAgICByZXR1cm4gKHR5cGUgPT09ICdzdHJpbmcnID8gXCInXCIgKyB2YWx1ZSArIFwiJ1wiIDogU3RyaW5nKHBhcnNlSW50KHZhbHVlKSkpO1xuICAgIH1cbiAgICBpZiAoVXRpbHMuaXNOdW1lcmljKHZhbHVlKSkge1xuICAgICAgcmV0dXJuICh0eXBlID09PSAnc3RyaW5nJyA/IFwiJ1wiICsgdmFsdWUgKyBcIidcIiA6IFN0cmluZyhwYXJzZUZsb2F0KHZhbHVlKSkpO1xuICAgIH1cbiAgICBpZiAodHlwZSA9PT0gJ251bWJlcicpIHtcbiAgICAgIHJldHVybiAodmFsdWUgPT09IEluZmluaXR5ID8gJy5JbmYnIDogKHZhbHVlID09PSAtSW5maW5pdHkgPyAnLS5JbmYnIDogKGlzTmFOKHZhbHVlKSA/ICcuTmFOJyA6IHZhbHVlKSkpO1xuICAgIH1cbiAgICBpZiAoRXNjYXBlci5yZXF1aXJlc0RvdWJsZVF1b3RpbmcodmFsdWUpKSB7XG4gICAgICByZXR1cm4gRXNjYXBlci5lc2NhcGVXaXRoRG91YmxlUXVvdGVzKHZhbHVlKTtcbiAgICB9XG4gICAgaWYgKEVzY2FwZXIucmVxdWlyZXNTaW5nbGVRdW90aW5nKHZhbHVlKSkge1xuICAgICAgcmV0dXJuIEVzY2FwZXIuZXNjYXBlV2l0aFNpbmdsZVF1b3Rlcyh2YWx1ZSk7XG4gICAgfVxuICAgIGlmICgnJyA9PT0gdmFsdWUpIHtcbiAgICAgIHJldHVybiAnXCJcIic7XG4gICAgfVxuICAgIGlmIChVdGlscy5QQVRURVJOX0RBVEUudGVzdCh2YWx1ZSkpIHtcbiAgICAgIHJldHVybiBcIidcIiArIHZhbHVlICsgXCInXCI7XG4gICAgfVxuICAgIGlmICgoX3JlZiA9IHZhbHVlLnRvTG93ZXJDYXNlKCkpID09PSAnbnVsbCcgfHwgX3JlZiA9PT0gJ34nIHx8IF9yZWYgPT09ICd0cnVlJyB8fCBfcmVmID09PSAnZmFsc2UnKSB7XG4gICAgICByZXR1cm4gXCInXCIgKyB2YWx1ZSArIFwiJ1wiO1xuICAgIH1cbiAgICByZXR1cm4gdmFsdWU7XG4gIH07XG5cbiAgSW5saW5lLmR1bXBPYmplY3QgPSBmdW5jdGlvbih2YWx1ZSwgZXhjZXB0aW9uT25JbnZhbGlkVHlwZSwgb2JqZWN0U3VwcG9ydCkge1xuICAgIHZhciBrZXksIG91dHB1dCwgdmFsLCBfaSwgX2xlbjtcbiAgICBpZiAob2JqZWN0U3VwcG9ydCA9PSBudWxsKSB7XG4gICAgICBvYmplY3RTdXBwb3J0ID0gbnVsbDtcbiAgICB9XG4gICAgaWYgKHZhbHVlIGluc3RhbmNlb2YgQXJyYXkpIHtcbiAgICAgIG91dHB1dCA9IFtdO1xuICAgICAgZm9yIChfaSA9IDAsIF9sZW4gPSB2YWx1ZS5sZW5ndGg7IF9pIDwgX2xlbjsgX2krKykge1xuICAgICAgICB2YWwgPSB2YWx1ZVtfaV07XG4gICAgICAgIG91dHB1dC5wdXNoKHRoaXMuZHVtcCh2YWwpKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiAnWycgKyBvdXRwdXQuam9pbignLCAnKSArICddJztcbiAgICB9IGVsc2Uge1xuICAgICAgb3V0cHV0ID0gW107XG4gICAgICBmb3IgKGtleSBpbiB2YWx1ZSkge1xuICAgICAgICB2YWwgPSB2YWx1ZVtrZXldO1xuICAgICAgICBvdXRwdXQucHVzaCh0aGlzLmR1bXAoa2V5KSArICc6ICcgKyB0aGlzLmR1bXAodmFsKSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gJ3snICsgb3V0cHV0LmpvaW4oJywgJykgKyAnfSc7XG4gICAgfVxuICB9O1xuXG4gIElubGluZS5wYXJzZVNjYWxhciA9IGZ1bmN0aW9uKHNjYWxhciwgZGVsaW1pdGVycywgc3RyaW5nRGVsaW1pdGVycywgY29udGV4dCwgZXZhbHVhdGUpIHtcbiAgICB2YXIgaSwgam9pbmVkRGVsaW1pdGVycywgbWF0Y2gsIG91dHB1dCwgcGF0dGVybiwgc3RycG9zLCB0bXAsIF9yZWYsIF9yZWYxO1xuICAgIGlmIChkZWxpbWl0ZXJzID09IG51bGwpIHtcbiAgICAgIGRlbGltaXRlcnMgPSBudWxsO1xuICAgIH1cbiAgICBpZiAoc3RyaW5nRGVsaW1pdGVycyA9PSBudWxsKSB7XG4gICAgICBzdHJpbmdEZWxpbWl0ZXJzID0gWydcIicsIFwiJ1wiXTtcbiAgICB9XG4gICAgaWYgKGNvbnRleHQgPT0gbnVsbCkge1xuICAgICAgY29udGV4dCA9IG51bGw7XG4gICAgfVxuICAgIGlmIChldmFsdWF0ZSA9PSBudWxsKSB7XG4gICAgICBldmFsdWF0ZSA9IHRydWU7XG4gICAgfVxuICAgIGlmIChjb250ZXh0ID09IG51bGwpIHtcbiAgICAgIGNvbnRleHQgPSB7XG4gICAgICAgIGV4Y2VwdGlvbk9uSW52YWxpZFR5cGU6IHRoaXMuc2V0dGluZ3MuZXhjZXB0aW9uT25JbnZhbGlkVHlwZSxcbiAgICAgICAgb2JqZWN0RGVjb2RlcjogdGhpcy5zZXR0aW5ncy5vYmplY3REZWNvZGVyLFxuICAgICAgICBpOiAwXG4gICAgICB9O1xuICAgIH1cbiAgICBpID0gY29udGV4dC5pO1xuICAgIGlmIChfcmVmID0gc2NhbGFyLmNoYXJBdChpKSwgX19pbmRleE9mLmNhbGwoc3RyaW5nRGVsaW1pdGVycywgX3JlZikgPj0gMCkge1xuICAgICAgb3V0cHV0ID0gdGhpcy5wYXJzZVF1b3RlZFNjYWxhcihzY2FsYXIsIGNvbnRleHQpO1xuICAgICAgaSA9IGNvbnRleHQuaTtcbiAgICAgIGlmIChkZWxpbWl0ZXJzICE9IG51bGwpIHtcbiAgICAgICAgdG1wID0gVXRpbHMubHRyaW0oc2NhbGFyLnNsaWNlKGkpLCAnICcpO1xuICAgICAgICBpZiAoIShfcmVmMSA9IHRtcC5jaGFyQXQoMCksIF9faW5kZXhPZi5jYWxsKGRlbGltaXRlcnMsIF9yZWYxKSA+PSAwKSkge1xuICAgICAgICAgIHRocm93IG5ldyBQYXJzZUV4Y2VwdGlvbignVW5leHBlY3RlZCBjaGFyYWN0ZXJzICgnICsgc2NhbGFyLnNsaWNlKGkpICsgJykuJyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKCFkZWxpbWl0ZXJzKSB7XG4gICAgICAgIG91dHB1dCA9IHNjYWxhci5zbGljZShpKTtcbiAgICAgICAgaSArPSBvdXRwdXQubGVuZ3RoO1xuICAgICAgICBzdHJwb3MgPSBvdXRwdXQuaW5kZXhPZignICMnKTtcbiAgICAgICAgaWYgKHN0cnBvcyAhPT0gLTEpIHtcbiAgICAgICAgICBvdXRwdXQgPSBVdGlscy5ydHJpbShvdXRwdXQuc2xpY2UoMCwgc3RycG9zKSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGpvaW5lZERlbGltaXRlcnMgPSBkZWxpbWl0ZXJzLmpvaW4oJ3wnKTtcbiAgICAgICAgcGF0dGVybiA9IHRoaXMuUEFUVEVSTl9TQ0FMQVJfQllfREVMSU1JVEVSU1tqb2luZWREZWxpbWl0ZXJzXTtcbiAgICAgICAgaWYgKHBhdHRlcm4gPT0gbnVsbCkge1xuICAgICAgICAgIHBhdHRlcm4gPSBuZXcgUGF0dGVybignXiguKz8pKCcgKyBqb2luZWREZWxpbWl0ZXJzICsgJyknKTtcbiAgICAgICAgICB0aGlzLlBBVFRFUk5fU0NBTEFSX0JZX0RFTElNSVRFUlNbam9pbmVkRGVsaW1pdGVyc10gPSBwYXR0ZXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmIChtYXRjaCA9IHBhdHRlcm4uZXhlYyhzY2FsYXIuc2xpY2UoaSkpKSB7XG4gICAgICAgICAgb3V0cHV0ID0gbWF0Y2hbMV07XG4gICAgICAgICAgaSArPSBvdXRwdXQubGVuZ3RoO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRocm93IG5ldyBQYXJzZUV4Y2VwdGlvbignTWFsZm9ybWVkIGlubGluZSBZQU1MIHN0cmluZyAoJyArIHNjYWxhciArICcpLicpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAoZXZhbHVhdGUpIHtcbiAgICAgICAgb3V0cHV0ID0gdGhpcy5ldmFsdWF0ZVNjYWxhcihvdXRwdXQsIGNvbnRleHQpO1xuICAgICAgfVxuICAgIH1cbiAgICBjb250ZXh0LmkgPSBpO1xuICAgIHJldHVybiBvdXRwdXQ7XG4gIH07XG5cbiAgSW5saW5lLnBhcnNlUXVvdGVkU2NhbGFyID0gZnVuY3Rpb24oc2NhbGFyLCBjb250ZXh0KSB7XG4gICAgdmFyIGksIG1hdGNoLCBvdXRwdXQ7XG4gICAgaSA9IGNvbnRleHQuaTtcbiAgICBpZiAoIShtYXRjaCA9IHRoaXMuUEFUVEVSTl9RVU9URURfU0NBTEFSLmV4ZWMoc2NhbGFyLnNsaWNlKGkpKSkpIHtcbiAgICAgIHRocm93IG5ldyBQYXJzZUV4Y2VwdGlvbignTWFsZm9ybWVkIGlubGluZSBZQU1MIHN0cmluZyAoJyArIHNjYWxhci5zbGljZShpKSArICcpLicpO1xuICAgIH1cbiAgICBvdXRwdXQgPSBtYXRjaFswXS5zdWJzdHIoMSwgbWF0Y2hbMF0ubGVuZ3RoIC0gMik7XG4gICAgaWYgKCdcIicgPT09IHNjYWxhci5jaGFyQXQoaSkpIHtcbiAgICAgIG91dHB1dCA9IFVuZXNjYXBlci51bmVzY2FwZURvdWJsZVF1b3RlZFN0cmluZyhvdXRwdXQpO1xuICAgIH0gZWxzZSB7XG4gICAgICBvdXRwdXQgPSBVbmVzY2FwZXIudW5lc2NhcGVTaW5nbGVRdW90ZWRTdHJpbmcob3V0cHV0KTtcbiAgICB9XG4gICAgaSArPSBtYXRjaFswXS5sZW5ndGg7XG4gICAgY29udGV4dC5pID0gaTtcbiAgICByZXR1cm4gb3V0cHV0O1xuICB9O1xuXG4gIElubGluZS5wYXJzZVNlcXVlbmNlID0gZnVuY3Rpb24oc2VxdWVuY2UsIGNvbnRleHQpIHtcbiAgICB2YXIgZSwgaSwgaXNRdW90ZWQsIGxlbiwgb3V0cHV0LCB2YWx1ZSwgX3JlZjtcbiAgICBvdXRwdXQgPSBbXTtcbiAgICBsZW4gPSBzZXF1ZW5jZS5sZW5ndGg7XG4gICAgaSA9IGNvbnRleHQuaTtcbiAgICBpICs9IDE7XG4gICAgd2hpbGUgKGkgPCBsZW4pIHtcbiAgICAgIGNvbnRleHQuaSA9IGk7XG4gICAgICBzd2l0Y2ggKHNlcXVlbmNlLmNoYXJBdChpKSkge1xuICAgICAgICBjYXNlICdbJzpcbiAgICAgICAgICBvdXRwdXQucHVzaCh0aGlzLnBhcnNlU2VxdWVuY2Uoc2VxdWVuY2UsIGNvbnRleHQpKTtcbiAgICAgICAgICBpID0gY29udGV4dC5pO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICd7JzpcbiAgICAgICAgICBvdXRwdXQucHVzaCh0aGlzLnBhcnNlTWFwcGluZyhzZXF1ZW5jZSwgY29udGV4dCkpO1xuICAgICAgICAgIGkgPSBjb250ZXh0Lmk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ10nOlxuICAgICAgICAgIHJldHVybiBvdXRwdXQ7XG4gICAgICAgIGNhc2UgJywnOlxuICAgICAgICBjYXNlICcgJzpcbiAgICAgICAgY2FzZSBcIlxcblwiOlxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIGlzUXVvdGVkID0gKChfcmVmID0gc2VxdWVuY2UuY2hhckF0KGkpKSA9PT0gJ1wiJyB8fCBfcmVmID09PSBcIidcIik7XG4gICAgICAgICAgdmFsdWUgPSB0aGlzLnBhcnNlU2NhbGFyKHNlcXVlbmNlLCBbJywnLCAnXSddLCBbJ1wiJywgXCInXCJdLCBjb250ZXh0KTtcbiAgICAgICAgICBpID0gY29udGV4dC5pO1xuICAgICAgICAgIGlmICghaXNRdW90ZWQgJiYgdHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJyAmJiAodmFsdWUuaW5kZXhPZignOiAnKSAhPT0gLTEgfHwgdmFsdWUuaW5kZXhPZihcIjpcXG5cIikgIT09IC0xKSkge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgdmFsdWUgPSB0aGlzLnBhcnNlTWFwcGluZygneycgKyB2YWx1ZSArICd9Jyk7XG4gICAgICAgICAgICB9IGNhdGNoIChfZXJyb3IpIHtcbiAgICAgICAgICAgICAgZSA9IF9lcnJvcjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgb3V0cHV0LnB1c2godmFsdWUpO1xuICAgICAgICAgIC0taTtcbiAgICAgIH1cbiAgICAgICsraTtcbiAgICB9XG4gICAgdGhyb3cgbmV3IFBhcnNlRXhjZXB0aW9uKCdNYWxmb3JtZWQgaW5saW5lIFlBTUwgc3RyaW5nICcgKyBzZXF1ZW5jZSk7XG4gIH07XG5cbiAgSW5saW5lLnBhcnNlTWFwcGluZyA9IGZ1bmN0aW9uKG1hcHBpbmcsIGNvbnRleHQpIHtcbiAgICB2YXIgZG9uZSwgaSwga2V5LCBsZW4sIG91dHB1dCwgc2hvdWxkQ29udGludWVXaGlsZUxvb3AsIHZhbHVlO1xuICAgIG91dHB1dCA9IHt9O1xuICAgIGxlbiA9IG1hcHBpbmcubGVuZ3RoO1xuICAgIGkgPSBjb250ZXh0Lmk7XG4gICAgaSArPSAxO1xuICAgIHNob3VsZENvbnRpbnVlV2hpbGVMb29wID0gZmFsc2U7XG4gICAgd2hpbGUgKGkgPCBsZW4pIHtcbiAgICAgIGNvbnRleHQuaSA9IGk7XG4gICAgICBzd2l0Y2ggKG1hcHBpbmcuY2hhckF0KGkpKSB7XG4gICAgICAgIGNhc2UgJyAnOlxuICAgICAgICBjYXNlICcsJzpcbiAgICAgICAgY2FzZSBcIlxcblwiOlxuICAgICAgICAgICsraTtcbiAgICAgICAgICBjb250ZXh0LmkgPSBpO1xuICAgICAgICAgIHNob3VsZENvbnRpbnVlV2hpbGVMb29wID0gdHJ1ZTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnfSc6XG4gICAgICAgICAgcmV0dXJuIG91dHB1dDtcbiAgICAgIH1cbiAgICAgIGlmIChzaG91bGRDb250aW51ZVdoaWxlTG9vcCkge1xuICAgICAgICBzaG91bGRDb250aW51ZVdoaWxlTG9vcCA9IGZhbHNlO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIGtleSA9IHRoaXMucGFyc2VTY2FsYXIobWFwcGluZywgWyc6JywgJyAnLCBcIlxcblwiXSwgWydcIicsIFwiJ1wiXSwgY29udGV4dCwgZmFsc2UpO1xuICAgICAgaSA9IGNvbnRleHQuaTtcbiAgICAgIGRvbmUgPSBmYWxzZTtcbiAgICAgIHdoaWxlIChpIDwgbGVuKSB7XG4gICAgICAgIGNvbnRleHQuaSA9IGk7XG4gICAgICAgIHN3aXRjaCAobWFwcGluZy5jaGFyQXQoaSkpIHtcbiAgICAgICAgICBjYXNlICdbJzpcbiAgICAgICAgICAgIHZhbHVlID0gdGhpcy5wYXJzZVNlcXVlbmNlKG1hcHBpbmcsIGNvbnRleHQpO1xuICAgICAgICAgICAgaSA9IGNvbnRleHQuaTtcbiAgICAgICAgICAgIGlmIChvdXRwdXRba2V5XSA9PT0gdm9pZCAwKSB7XG4gICAgICAgICAgICAgIG91dHB1dFtrZXldID0gdmFsdWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBkb25lID0gdHJ1ZTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgJ3snOlxuICAgICAgICAgICAgdmFsdWUgPSB0aGlzLnBhcnNlTWFwcGluZyhtYXBwaW5nLCBjb250ZXh0KTtcbiAgICAgICAgICAgIGkgPSBjb250ZXh0Lmk7XG4gICAgICAgICAgICBpZiAob3V0cHV0W2tleV0gPT09IHZvaWQgMCkge1xuICAgICAgICAgICAgICBvdXRwdXRba2V5XSA9IHZhbHVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZG9uZSA9IHRydWU7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlICc6JzpcbiAgICAgICAgICBjYXNlICcgJzpcbiAgICAgICAgICBjYXNlIFwiXFxuXCI6XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgdmFsdWUgPSB0aGlzLnBhcnNlU2NhbGFyKG1hcHBpbmcsIFsnLCcsICd9J10sIFsnXCInLCBcIidcIl0sIGNvbnRleHQpO1xuICAgICAgICAgICAgaSA9IGNvbnRleHQuaTtcbiAgICAgICAgICAgIGlmIChvdXRwdXRba2V5XSA9PT0gdm9pZCAwKSB7XG4gICAgICAgICAgICAgIG91dHB1dFtrZXldID0gdmFsdWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBkb25lID0gdHJ1ZTtcbiAgICAgICAgICAgIC0taTtcbiAgICAgICAgfVxuICAgICAgICArK2k7XG4gICAgICAgIGlmIChkb25lKSB7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgdGhyb3cgbmV3IFBhcnNlRXhjZXB0aW9uKCdNYWxmb3JtZWQgaW5saW5lIFlBTUwgc3RyaW5nICcgKyBtYXBwaW5nKTtcbiAgfTtcblxuICBJbmxpbmUuZXZhbHVhdGVTY2FsYXIgPSBmdW5jdGlvbihzY2FsYXIsIGNvbnRleHQpIHtcbiAgICB2YXIgY2FzdCwgZGF0ZSwgZXhjZXB0aW9uT25JbnZhbGlkVHlwZSwgZmlyc3RDaGFyLCBmaXJzdFNwYWNlLCBmaXJzdFdvcmQsIG9iamVjdERlY29kZXIsIHJhdywgc2NhbGFyTG93ZXIsIHN1YlZhbHVlLCB0cmltbWVkU2NhbGFyO1xuICAgIHNjYWxhciA9IFV0aWxzLnRyaW0oc2NhbGFyKTtcbiAgICBzY2FsYXJMb3dlciA9IHNjYWxhci50b0xvd2VyQ2FzZSgpO1xuICAgIHN3aXRjaCAoc2NhbGFyTG93ZXIpIHtcbiAgICAgIGNhc2UgJ251bGwnOlxuICAgICAgY2FzZSAnJzpcbiAgICAgIGNhc2UgJ34nOlxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIGNhc2UgJ3RydWUnOlxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIGNhc2UgJ2ZhbHNlJzpcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgY2FzZSAnLmluZic6XG4gICAgICAgIHJldHVybiBJbmZpbml0eTtcbiAgICAgIGNhc2UgJy5uYW4nOlxuICAgICAgICByZXR1cm4gTmFOO1xuICAgICAgY2FzZSAnLS5pbmYnOlxuICAgICAgICByZXR1cm4gSW5maW5pdHk7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICBmaXJzdENoYXIgPSBzY2FsYXJMb3dlci5jaGFyQXQoMCk7XG4gICAgICAgIHN3aXRjaCAoZmlyc3RDaGFyKSB7XG4gICAgICAgICAgY2FzZSAnISc6XG4gICAgICAgICAgICBmaXJzdFNwYWNlID0gc2NhbGFyLmluZGV4T2YoJyAnKTtcbiAgICAgICAgICAgIGlmIChmaXJzdFNwYWNlID09PSAtMSkge1xuICAgICAgICAgICAgICBmaXJzdFdvcmQgPSBzY2FsYXJMb3dlcjtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGZpcnN0V29yZCA9IHNjYWxhckxvd2VyLnNsaWNlKDAsIGZpcnN0U3BhY2UpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc3dpdGNoIChmaXJzdFdvcmQpIHtcbiAgICAgICAgICAgICAgY2FzZSAnISc6XG4gICAgICAgICAgICAgICAgaWYgKGZpcnN0U3BhY2UgIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICByZXR1cm4gcGFyc2VJbnQodGhpcy5wYXJzZVNjYWxhcihzY2FsYXIuc2xpY2UoMikpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICAgIGNhc2UgJyFzdHInOlxuICAgICAgICAgICAgICAgIHJldHVybiBVdGlscy5sdHJpbShzY2FsYXIuc2xpY2UoNCkpO1xuICAgICAgICAgICAgICBjYXNlICchIXN0cic6XG4gICAgICAgICAgICAgICAgcmV0dXJuIFV0aWxzLmx0cmltKHNjYWxhci5zbGljZSg1KSk7XG4gICAgICAgICAgICAgIGNhc2UgJyEhaW50JzpcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyc2VJbnQodGhpcy5wYXJzZVNjYWxhcihzY2FsYXIuc2xpY2UoNSkpKTtcbiAgICAgICAgICAgICAgY2FzZSAnISFib29sJzpcbiAgICAgICAgICAgICAgICByZXR1cm4gVXRpbHMucGFyc2VCb29sZWFuKHRoaXMucGFyc2VTY2FsYXIoc2NhbGFyLnNsaWNlKDYpKSwgZmFsc2UpO1xuICAgICAgICAgICAgICBjYXNlICchIWZsb2F0JzpcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyc2VGbG9hdCh0aGlzLnBhcnNlU2NhbGFyKHNjYWxhci5zbGljZSg3KSkpO1xuICAgICAgICAgICAgICBjYXNlICchIXRpbWVzdGFtcCc6XG4gICAgICAgICAgICAgICAgcmV0dXJuIFV0aWxzLnN0cmluZ1RvRGF0ZShVdGlscy5sdHJpbShzY2FsYXIuc2xpY2UoMTEpKSk7XG4gICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgaWYgKGNvbnRleHQgPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgY29udGV4dCA9IHtcbiAgICAgICAgICAgICAgICAgICAgZXhjZXB0aW9uT25JbnZhbGlkVHlwZTogdGhpcy5zZXR0aW5ncy5leGNlcHRpb25PbkludmFsaWRUeXBlLFxuICAgICAgICAgICAgICAgICAgICBvYmplY3REZWNvZGVyOiB0aGlzLnNldHRpbmdzLm9iamVjdERlY29kZXIsXG4gICAgICAgICAgICAgICAgICAgIGk6IDBcbiAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIG9iamVjdERlY29kZXIgPSBjb250ZXh0Lm9iamVjdERlY29kZXIsIGV4Y2VwdGlvbk9uSW52YWxpZFR5cGUgPSBjb250ZXh0LmV4Y2VwdGlvbk9uSW52YWxpZFR5cGU7XG4gICAgICAgICAgICAgICAgaWYgKG9iamVjdERlY29kZXIpIHtcbiAgICAgICAgICAgICAgICAgIHRyaW1tZWRTY2FsYXIgPSBVdGlscy5ydHJpbShzY2FsYXIpO1xuICAgICAgICAgICAgICAgICAgZmlyc3RTcGFjZSA9IHRyaW1tZWRTY2FsYXIuaW5kZXhPZignICcpO1xuICAgICAgICAgICAgICAgICAgaWYgKGZpcnN0U3BhY2UgPT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBvYmplY3REZWNvZGVyKHRyaW1tZWRTY2FsYXIsIG51bGwpO1xuICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgc3ViVmFsdWUgPSBVdGlscy5sdHJpbSh0cmltbWVkU2NhbGFyLnNsaWNlKGZpcnN0U3BhY2UgKyAxKSk7XG4gICAgICAgICAgICAgICAgICAgIGlmICghKHN1YlZhbHVlLmxlbmd0aCA+IDApKSB7XG4gICAgICAgICAgICAgICAgICAgICAgc3ViVmFsdWUgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBvYmplY3REZWNvZGVyKHRyaW1tZWRTY2FsYXIuc2xpY2UoMCwgZmlyc3RTcGFjZSksIHN1YlZhbHVlKTtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGV4Y2VwdGlvbk9uSW52YWxpZFR5cGUpIHtcbiAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBQYXJzZUV4Y2VwdGlvbignQ3VzdG9tIG9iamVjdCBzdXBwb3J0IHdoZW4gcGFyc2luZyBhIFlBTUwgZmlsZSBoYXMgYmVlbiBkaXNhYmxlZC4nKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlICcwJzpcbiAgICAgICAgICAgIGlmICgnMHgnID09PSBzY2FsYXIuc2xpY2UoMCwgMikpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIFV0aWxzLmhleERlYyhzY2FsYXIpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChVdGlscy5pc0RpZ2l0cyhzY2FsYXIpKSB7XG4gICAgICAgICAgICAgIHJldHVybiBVdGlscy5vY3REZWMoc2NhbGFyKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoVXRpbHMuaXNOdW1lcmljKHNjYWxhcikpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIHBhcnNlRmxvYXQoc2NhbGFyKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHJldHVybiBzY2FsYXI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlICcrJzpcbiAgICAgICAgICAgIGlmIChVdGlscy5pc0RpZ2l0cyhzY2FsYXIpKSB7XG4gICAgICAgICAgICAgIHJhdyA9IHNjYWxhcjtcbiAgICAgICAgICAgICAgY2FzdCA9IHBhcnNlSW50KHJhdyk7XG4gICAgICAgICAgICAgIGlmIChyYXcgPT09IFN0cmluZyhjYXN0KSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBjYXN0O1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiByYXc7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSBpZiAoVXRpbHMuaXNOdW1lcmljKHNjYWxhcikpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIHBhcnNlRmxvYXQoc2NhbGFyKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodGhpcy5QQVRURVJOX1RIT1VTQU5EX05VTUVSSUNfU0NBTEFSLnRlc3Qoc2NhbGFyKSkge1xuICAgICAgICAgICAgICByZXR1cm4gcGFyc2VGbG9hdChzY2FsYXIucmVwbGFjZSgnLCcsICcnKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gc2NhbGFyO1xuICAgICAgICAgIGNhc2UgJy0nOlxuICAgICAgICAgICAgaWYgKFV0aWxzLmlzRGlnaXRzKHNjYWxhci5zbGljZSgxKSkpIHtcbiAgICAgICAgICAgICAgaWYgKCcwJyA9PT0gc2NhbGFyLmNoYXJBdCgxKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiAtVXRpbHMub2N0RGVjKHNjYWxhci5zbGljZSgxKSk7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmF3ID0gc2NhbGFyLnNsaWNlKDEpO1xuICAgICAgICAgICAgICAgIGNhc3QgPSBwYXJzZUludChyYXcpO1xuICAgICAgICAgICAgICAgIGlmIChyYXcgPT09IFN0cmluZyhjYXN0KSkge1xuICAgICAgICAgICAgICAgICAgcmV0dXJuIC1jYXN0O1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICByZXR1cm4gLXJhdztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSBpZiAoVXRpbHMuaXNOdW1lcmljKHNjYWxhcikpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIHBhcnNlRmxvYXQoc2NhbGFyKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodGhpcy5QQVRURVJOX1RIT1VTQU5EX05VTUVSSUNfU0NBTEFSLnRlc3Qoc2NhbGFyKSkge1xuICAgICAgICAgICAgICByZXR1cm4gcGFyc2VGbG9hdChzY2FsYXIucmVwbGFjZSgnLCcsICcnKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gc2NhbGFyO1xuICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICBpZiAoZGF0ZSA9IFV0aWxzLnN0cmluZ1RvRGF0ZShzY2FsYXIpKSB7XG4gICAgICAgICAgICAgIHJldHVybiBkYXRlO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChVdGlscy5pc051bWVyaWMoc2NhbGFyKSkge1xuICAgICAgICAgICAgICByZXR1cm4gcGFyc2VGbG9hdChzY2FsYXIpO1xuICAgICAgICAgICAgfSBlbHNlIGlmICh0aGlzLlBBVFRFUk5fVEhPVVNBTkRfTlVNRVJJQ19TQ0FMQVIudGVzdChzY2FsYXIpKSB7XG4gICAgICAgICAgICAgIHJldHVybiBwYXJzZUZsb2F0KHNjYWxhci5yZXBsYWNlKCcsJywgJycpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBzY2FsYXI7XG4gICAgICAgIH1cbiAgICB9XG4gIH07XG5cbiAgcmV0dXJuIElubGluZTtcblxufSkoKTtcblxubW9kdWxlLmV4cG9ydHMgPSBJbmxpbmU7XG4iLCIvLyBHZW5lcmF0ZWQgYnkgQ29mZmVlU2NyaXB0IDEuOC4wXG52YXIgSW5saW5lLCBQYXJzZUV4Y2VwdGlvbiwgUGFyc2VyLCBQYXR0ZXJuLCBVdGlscztcblxuSW5saW5lID0gcmVxdWlyZSgnLi9JbmxpbmUnKTtcblxuUGF0dGVybiA9IHJlcXVpcmUoJy4vUGF0dGVybicpO1xuXG5VdGlscyA9IHJlcXVpcmUoJy4vVXRpbHMnKTtcblxuUGFyc2VFeGNlcHRpb24gPSByZXF1aXJlKCcuL0V4Y2VwdGlvbi9QYXJzZUV4Y2VwdGlvbicpO1xuXG5QYXJzZXIgPSAoZnVuY3Rpb24oKSB7XG4gIFBhcnNlci5wcm90b3R5cGUuUEFUVEVSTl9GT0xERURfU0NBTEFSX0FMTCA9IG5ldyBQYXR0ZXJuKCdeKD86KD88dHlwZT4hW15cXFxcfD5dKilcXFxccyspPyg/PHNlcGFyYXRvcj5cXFxcfHw+KSg/PG1vZGlmaWVycz5cXFxcK3xcXFxcLXxcXFxcZCt8XFxcXCtcXFxcZCt8XFxcXC1cXFxcZCt8XFxcXGQrXFxcXCt8XFxcXGQrXFxcXC0pPyg/PGNvbW1lbnRzPiArIy4qKT8kJyk7XG5cbiAgUGFyc2VyLnByb3RvdHlwZS5QQVRURVJOX0ZPTERFRF9TQ0FMQVJfRU5EID0gbmV3IFBhdHRlcm4oJyg/PHNlcGFyYXRvcj5cXFxcfHw+KSg/PG1vZGlmaWVycz5cXFxcK3xcXFxcLXxcXFxcZCt8XFxcXCtcXFxcZCt8XFxcXC1cXFxcZCt8XFxcXGQrXFxcXCt8XFxcXGQrXFxcXC0pPyg/PGNvbW1lbnRzPiArIy4qKT8kJyk7XG5cbiAgUGFyc2VyLnByb3RvdHlwZS5QQVRURVJOX1NFUVVFTkNFX0lURU0gPSBuZXcgUGF0dGVybignXlxcXFwtKCg/PGxlYWRzcGFjZXM+XFxcXHMrKSg/PHZhbHVlPi4rPykpP1xcXFxzKiQnKTtcblxuICBQYXJzZXIucHJvdG90eXBlLlBBVFRFUk5fQU5DSE9SX1ZBTFVFID0gbmV3IFBhdHRlcm4oJ14mKD88cmVmPlteIF0rKSAqKD88dmFsdWU+LiopJyk7XG5cbiAgUGFyc2VyLnByb3RvdHlwZS5QQVRURVJOX0NPTVBBQ1RfTk9UQVRJT04gPSBuZXcgUGF0dGVybignXig/PGtleT4nICsgSW5saW5lLlJFR0VYX1FVT1RFRF9TVFJJTkcgKyAnfFteIFxcJ1wiXFxcXHtcXFxcW10uKj8pICpcXFxcOihcXFxccysoPzx2YWx1ZT4uKz8pKT9cXFxccyokJyk7XG5cbiAgUGFyc2VyLnByb3RvdHlwZS5QQVRURVJOX01BUFBJTkdfSVRFTSA9IG5ldyBQYXR0ZXJuKCdeKD88a2V5PicgKyBJbmxpbmUuUkVHRVhfUVVPVEVEX1NUUklORyArICd8W14gXFwnXCJcXFxcW1xcXFx7XS4qPykgKlxcXFw6KFxcXFxzKyg/PHZhbHVlPi4rPykpP1xcXFxzKiQnKTtcblxuICBQYXJzZXIucHJvdG90eXBlLlBBVFRFUk5fREVDSU1BTCA9IG5ldyBQYXR0ZXJuKCdcXFxcZCsnKTtcblxuICBQYXJzZXIucHJvdG90eXBlLlBBVFRFUk5fSU5ERU5UX1NQQUNFUyA9IG5ldyBQYXR0ZXJuKCdeICsnKTtcblxuICBQYXJzZXIucHJvdG90eXBlLlBBVFRFUk5fVFJBSUxJTkdfTElORVMgPSBuZXcgUGF0dGVybignKFxcbiopJCcpO1xuXG4gIFBhcnNlci5wcm90b3R5cGUuUEFUVEVSTl9ZQU1MX0hFQURFUiA9IG5ldyBQYXR0ZXJuKCdeXFxcXCVZQU1MWzogXVtcXFxcZFxcXFwuXSsuKlxcbicpO1xuXG4gIFBhcnNlci5wcm90b3R5cGUuUEFUVEVSTl9MRUFESU5HX0NPTU1FTlRTID0gbmV3IFBhdHRlcm4oJ14oXFxcXCMuKj9cXG4pKycpO1xuXG4gIFBhcnNlci5wcm90b3R5cGUuUEFUVEVSTl9ET0NVTUVOVF9NQVJLRVJfU1RBUlQgPSBuZXcgUGF0dGVybignXlxcXFwtXFxcXC1cXFxcLS4qP1xcbicpO1xuXG4gIFBhcnNlci5wcm90b3R5cGUuUEFUVEVSTl9ET0NVTUVOVF9NQVJLRVJfRU5EID0gbmV3IFBhdHRlcm4oJ15cXFxcLlxcXFwuXFxcXC5cXFxccyokJyk7XG5cbiAgUGFyc2VyLnByb3RvdHlwZS5QQVRURVJOX0ZPTERFRF9TQ0FMQVJfQllfSU5ERU5UQVRJT04gPSB7fTtcblxuICBQYXJzZXIucHJvdG90eXBlLkNPTlRFWFRfTk9ORSA9IDA7XG5cbiAgUGFyc2VyLnByb3RvdHlwZS5DT05URVhUX1NFUVVFTkNFID0gMTtcblxuICBQYXJzZXIucHJvdG90eXBlLkNPTlRFWFRfTUFQUElORyA9IDI7XG5cbiAgZnVuY3Rpb24gUGFyc2VyKG9mZnNldCkge1xuICAgIHRoaXMub2Zmc2V0ID0gb2Zmc2V0ICE9IG51bGwgPyBvZmZzZXQgOiAwO1xuICAgIHRoaXMubGluZXMgPSBbXTtcbiAgICB0aGlzLmN1cnJlbnRMaW5lTmIgPSAtMTtcbiAgICB0aGlzLmN1cnJlbnRMaW5lID0gJyc7XG4gICAgdGhpcy5yZWZzID0ge307XG4gIH1cblxuICBQYXJzZXIucHJvdG90eXBlLnBhcnNlID0gZnVuY3Rpb24odmFsdWUsIGV4Y2VwdGlvbk9uSW52YWxpZFR5cGUsIG9iamVjdERlY29kZXIpIHtcbiAgICB2YXIgYWxpYXMsIGFsbG93T3ZlcndyaXRlLCBibG9jaywgYywgY29udGV4dCwgZGF0YSwgZSwgZmlyc3QsIGksIGluZGVudCwgaXNSZWYsIGssIGtleSwgbGFzdEtleSwgbGluZUNvdW50LCBtYXRjaGVzLCBtZXJnZU5vZGUsIHBhcnNlZCwgcGFyc2VkSXRlbSwgcGFyc2VyLCByZWZOYW1lLCByZWZWYWx1ZSwgdmFsLCB2YWx1ZXMsIF9pLCBfaiwgX2ssIF9sLCBfbGVuLCBfbGVuMSwgX2xlbjIsIF9sZW4zLCBfbmFtZSwgX3JlZiwgX3JlZjEsIF9yZWYyO1xuICAgIGlmIChleGNlcHRpb25PbkludmFsaWRUeXBlID09IG51bGwpIHtcbiAgICAgIGV4Y2VwdGlvbk9uSW52YWxpZFR5cGUgPSBmYWxzZTtcbiAgICB9XG4gICAgaWYgKG9iamVjdERlY29kZXIgPT0gbnVsbCkge1xuICAgICAgb2JqZWN0RGVjb2RlciA9IG51bGw7XG4gICAgfVxuICAgIHRoaXMuY3VycmVudExpbmVOYiA9IC0xO1xuICAgIHRoaXMuY3VycmVudExpbmUgPSAnJztcbiAgICB0aGlzLmxpbmVzID0gdGhpcy5jbGVhbnVwKHZhbHVlKS5zcGxpdChcIlxcblwiKTtcbiAgICBkYXRhID0gbnVsbDtcbiAgICBjb250ZXh0ID0gdGhpcy5DT05URVhUX05PTkU7XG4gICAgYWxsb3dPdmVyd3JpdGUgPSBmYWxzZTtcbiAgICB3aGlsZSAodGhpcy5tb3ZlVG9OZXh0TGluZSgpKSB7XG4gICAgICBpZiAodGhpcy5pc0N1cnJlbnRMaW5lRW1wdHkoKSkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIGlmIChcIlxcdFwiID09PSB0aGlzLmN1cnJlbnRMaW5lWzBdKSB7XG4gICAgICAgIHRocm93IG5ldyBQYXJzZUV4Y2VwdGlvbignQSBZQU1MIGZpbGUgY2Fubm90IGNvbnRhaW4gdGFicyBhcyBpbmRlbnRhdGlvbi4nLCB0aGlzLmdldFJlYWxDdXJyZW50TGluZU5iKCkgKyAxLCB0aGlzLmN1cnJlbnRMaW5lKTtcbiAgICAgIH1cbiAgICAgIGlzUmVmID0gbWVyZ2VOb2RlID0gZmFsc2U7XG4gICAgICBpZiAodmFsdWVzID0gdGhpcy5QQVRURVJOX1NFUVVFTkNFX0lURU0uZXhlYyh0aGlzLmN1cnJlbnRMaW5lKSkge1xuICAgICAgICBpZiAodGhpcy5DT05URVhUX01BUFBJTkcgPT09IGNvbnRleHQpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgUGFyc2VFeGNlcHRpb24oJ1lvdSBjYW5ub3QgZGVmaW5lIGEgc2VxdWVuY2UgaXRlbSB3aGVuIGluIGEgbWFwcGluZycpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnRleHQgPSB0aGlzLkNPTlRFWFRfU0VRVUVOQ0U7XG4gICAgICAgIGlmIChkYXRhID09IG51bGwpIHtcbiAgICAgICAgICBkYXRhID0gW107XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCh2YWx1ZXMudmFsdWUgIT0gbnVsbCkgJiYgKG1hdGNoZXMgPSB0aGlzLlBBVFRFUk5fQU5DSE9SX1ZBTFVFLmV4ZWModmFsdWVzLnZhbHVlKSkpIHtcbiAgICAgICAgICBpc1JlZiA9IG1hdGNoZXMucmVmO1xuICAgICAgICAgIHZhbHVlcy52YWx1ZSA9IG1hdGNoZXMudmFsdWU7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCEodmFsdWVzLnZhbHVlICE9IG51bGwpIHx8ICcnID09PSBVdGlscy50cmltKHZhbHVlcy52YWx1ZSwgJyAnKSB8fCBVdGlscy5sdHJpbSh2YWx1ZXMudmFsdWUsICcgJykuaW5kZXhPZignIycpID09PSAwKSB7XG4gICAgICAgICAgaWYgKHRoaXMuY3VycmVudExpbmVOYiA8IHRoaXMubGluZXMubGVuZ3RoIC0gMSAmJiAhdGhpcy5pc05leHRMaW5lVW5JbmRlbnRlZENvbGxlY3Rpb24oKSkge1xuICAgICAgICAgICAgYyA9IHRoaXMuZ2V0UmVhbEN1cnJlbnRMaW5lTmIoKSArIDE7XG4gICAgICAgICAgICBwYXJzZXIgPSBuZXcgUGFyc2VyKGMpO1xuICAgICAgICAgICAgcGFyc2VyLnJlZnMgPSB0aGlzLnJlZnM7XG4gICAgICAgICAgICBkYXRhLnB1c2gocGFyc2VyLnBhcnNlKHRoaXMuZ2V0TmV4dEVtYmVkQmxvY2sobnVsbCwgdHJ1ZSksIGV4Y2VwdGlvbk9uSW52YWxpZFR5cGUsIG9iamVjdERlY29kZXIpKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZGF0YS5wdXNoKG51bGwpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBpZiAoKChfcmVmID0gdmFsdWVzLmxlYWRzcGFjZXMpICE9IG51bGwgPyBfcmVmLmxlbmd0aCA6IHZvaWQgMCkgJiYgKG1hdGNoZXMgPSB0aGlzLlBBVFRFUk5fQ09NUEFDVF9OT1RBVElPTi5leGVjKHZhbHVlcy52YWx1ZSkpKSB7XG4gICAgICAgICAgICBjID0gdGhpcy5nZXRSZWFsQ3VycmVudExpbmVOYigpO1xuICAgICAgICAgICAgcGFyc2VyID0gbmV3IFBhcnNlcihjKTtcbiAgICAgICAgICAgIHBhcnNlci5yZWZzID0gdGhpcy5yZWZzO1xuICAgICAgICAgICAgYmxvY2sgPSB2YWx1ZXMudmFsdWU7XG4gICAgICAgICAgICBpbmRlbnQgPSB0aGlzLmdldEN1cnJlbnRMaW5lSW5kZW50YXRpb24oKTtcbiAgICAgICAgICAgIGlmICh0aGlzLmlzTmV4dExpbmVJbmRlbnRlZChmYWxzZSkpIHtcbiAgICAgICAgICAgICAgYmxvY2sgKz0gXCJcXG5cIiArIHRoaXMuZ2V0TmV4dEVtYmVkQmxvY2soaW5kZW50ICsgdmFsdWVzLmxlYWRzcGFjZXMubGVuZ3RoICsgMSwgdHJ1ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBkYXRhLnB1c2gocGFyc2VyLnBhcnNlKGJsb2NrLCBleGNlcHRpb25PbkludmFsaWRUeXBlLCBvYmplY3REZWNvZGVyKSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGRhdGEucHVzaCh0aGlzLnBhcnNlVmFsdWUodmFsdWVzLnZhbHVlLCBleGNlcHRpb25PbkludmFsaWRUeXBlLCBvYmplY3REZWNvZGVyKSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKCh2YWx1ZXMgPSB0aGlzLlBBVFRFUk5fTUFQUElOR19JVEVNLmV4ZWModGhpcy5jdXJyZW50TGluZSkpICYmIHZhbHVlcy5rZXkuaW5kZXhPZignICMnKSA9PT0gLTEpIHtcbiAgICAgICAgaWYgKHRoaXMuQ09OVEVYVF9TRVFVRU5DRSA9PT0gY29udGV4dCkge1xuICAgICAgICAgIHRocm93IG5ldyBQYXJzZUV4Y2VwdGlvbignWW91IGNhbm5vdCBkZWZpbmUgYSBtYXBwaW5nIGl0ZW0gd2hlbiBpbiBhIHNlcXVlbmNlJyk7XG4gICAgICAgIH1cbiAgICAgICAgY29udGV4dCA9IHRoaXMuQ09OVEVYVF9NQVBQSU5HO1xuICAgICAgICBpZiAoZGF0YSA9PSBudWxsKSB7XG4gICAgICAgICAgZGF0YSA9IHt9O1xuICAgICAgICB9XG4gICAgICAgIElubGluZS5jb25maWd1cmUoZXhjZXB0aW9uT25JbnZhbGlkVHlwZSwgb2JqZWN0RGVjb2Rlcik7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAga2V5ID0gSW5saW5lLnBhcnNlU2NhbGFyKHZhbHVlcy5rZXkpO1xuICAgICAgICB9IGNhdGNoIChfZXJyb3IpIHtcbiAgICAgICAgICBlID0gX2Vycm9yO1xuICAgICAgICAgIGUucGFyc2VkTGluZSA9IHRoaXMuZ2V0UmVhbEN1cnJlbnRMaW5lTmIoKSArIDE7XG4gICAgICAgICAgZS5zbmlwcGV0ID0gdGhpcy5jdXJyZW50TGluZTtcbiAgICAgICAgICB0aHJvdyBlO1xuICAgICAgICB9XG4gICAgICAgIGlmICgnPDwnID09PSBrZXkpIHtcbiAgICAgICAgICBtZXJnZU5vZGUgPSB0cnVlO1xuICAgICAgICAgIGFsbG93T3ZlcndyaXRlID0gdHJ1ZTtcbiAgICAgICAgICBpZiAoKChfcmVmMSA9IHZhbHVlcy52YWx1ZSkgIT0gbnVsbCA/IF9yZWYxLmluZGV4T2YoJyonKSA6IHZvaWQgMCkgPT09IDApIHtcbiAgICAgICAgICAgIHJlZk5hbWUgPSB2YWx1ZXMudmFsdWUuc2xpY2UoMSk7XG4gICAgICAgICAgICBpZiAodGhpcy5yZWZzW3JlZk5hbWVdID09IG51bGwpIHtcbiAgICAgICAgICAgICAgdGhyb3cgbmV3IFBhcnNlRXhjZXB0aW9uKCdSZWZlcmVuY2UgXCInICsgcmVmTmFtZSArICdcIiBkb2VzIG5vdCBleGlzdC4nLCB0aGlzLmdldFJlYWxDdXJyZW50TGluZU5iKCkgKyAxLCB0aGlzLmN1cnJlbnRMaW5lKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJlZlZhbHVlID0gdGhpcy5yZWZzW3JlZk5hbWVdO1xuICAgICAgICAgICAgaWYgKHR5cGVvZiByZWZWYWx1ZSAhPT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgICAgdGhyb3cgbmV3IFBhcnNlRXhjZXB0aW9uKCdZQU1MIG1lcmdlIGtleXMgdXNlZCB3aXRoIGEgc2NhbGFyIHZhbHVlIGluc3RlYWQgb2YgYW4gb2JqZWN0LicsIHRoaXMuZ2V0UmVhbEN1cnJlbnRMaW5lTmIoKSArIDEsIHRoaXMuY3VycmVudExpbmUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHJlZlZhbHVlIGluc3RhbmNlb2YgQXJyYXkpIHtcbiAgICAgICAgICAgICAgZm9yIChpID0gX2kgPSAwLCBfbGVuID0gcmVmVmFsdWUubGVuZ3RoOyBfaSA8IF9sZW47IGkgPSArK19pKSB7XG4gICAgICAgICAgICAgICAgdmFsdWUgPSByZWZWYWx1ZVtpXTtcbiAgICAgICAgICAgICAgICBpZiAoZGF0YVtfbmFtZSA9IFN0cmluZyhpKV0gPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgZGF0YVtfbmFtZV0gPSB2YWx1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGZvciAoa2V5IGluIHJlZlZhbHVlKSB7XG4gICAgICAgICAgICAgICAgdmFsdWUgPSByZWZWYWx1ZVtrZXldO1xuICAgICAgICAgICAgICAgIGlmIChkYXRhW2tleV0gPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgZGF0YVtrZXldID0gdmFsdWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlmICgodmFsdWVzLnZhbHVlICE9IG51bGwpICYmIHZhbHVlcy52YWx1ZSAhPT0gJycpIHtcbiAgICAgICAgICAgICAgdmFsdWUgPSB2YWx1ZXMudmFsdWU7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICB2YWx1ZSA9IHRoaXMuZ2V0TmV4dEVtYmVkQmxvY2soKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGMgPSB0aGlzLmdldFJlYWxDdXJyZW50TGluZU5iKCkgKyAxO1xuICAgICAgICAgICAgcGFyc2VyID0gbmV3IFBhcnNlcihjKTtcbiAgICAgICAgICAgIHBhcnNlci5yZWZzID0gdGhpcy5yZWZzO1xuICAgICAgICAgICAgcGFyc2VkID0gcGFyc2VyLnBhcnNlKHZhbHVlLCBleGNlcHRpb25PbkludmFsaWRUeXBlKTtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgcGFyc2VkICE9PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgICB0aHJvdyBuZXcgUGFyc2VFeGNlcHRpb24oJ1lBTUwgbWVyZ2Uga2V5cyB1c2VkIHdpdGggYSBzY2FsYXIgdmFsdWUgaW5zdGVhZCBvZiBhbiBvYmplY3QuJywgdGhpcy5nZXRSZWFsQ3VycmVudExpbmVOYigpICsgMSwgdGhpcy5jdXJyZW50TGluZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAocGFyc2VkIGluc3RhbmNlb2YgQXJyYXkpIHtcbiAgICAgICAgICAgICAgZm9yIChfaiA9IDAsIF9sZW4xID0gcGFyc2VkLmxlbmd0aDsgX2ogPCBfbGVuMTsgX2orKykge1xuICAgICAgICAgICAgICAgIHBhcnNlZEl0ZW0gPSBwYXJzZWRbX2pdO1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgcGFyc2VkSXRlbSAhPT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBQYXJzZUV4Y2VwdGlvbignTWVyZ2UgaXRlbXMgbXVzdCBiZSBvYmplY3RzLicsIHRoaXMuZ2V0UmVhbEN1cnJlbnRMaW5lTmIoKSArIDEsIHBhcnNlZEl0ZW0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAocGFyc2VkSXRlbSBpbnN0YW5jZW9mIEFycmF5KSB7XG4gICAgICAgICAgICAgICAgICBmb3IgKGkgPSBfayA9IDAsIF9sZW4yID0gcGFyc2VkSXRlbS5sZW5ndGg7IF9rIDwgX2xlbjI7IGkgPSArK19rKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhbHVlID0gcGFyc2VkSXRlbVtpXTtcbiAgICAgICAgICAgICAgICAgICAgayA9IFN0cmluZyhpKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFkYXRhLmhhc093blByb3BlcnR5KGspKSB7XG4gICAgICAgICAgICAgICAgICAgICAgZGF0YVtrXSA9IHZhbHVlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgIGZvciAoa2V5IGluIHBhcnNlZEl0ZW0pIHtcbiAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSBwYXJzZWRJdGVtW2tleV07XG4gICAgICAgICAgICAgICAgICAgIGlmICghZGF0YS5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgZGF0YVtrZXldID0gdmFsdWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGZvciAoa2V5IGluIHBhcnNlZCkge1xuICAgICAgICAgICAgICAgIHZhbHVlID0gcGFyc2VkW2tleV07XG4gICAgICAgICAgICAgICAgaWYgKCFkYXRhLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgICAgICAgICAgIGRhdGFba2V5XSA9IHZhbHVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmICgodmFsdWVzLnZhbHVlICE9IG51bGwpICYmIChtYXRjaGVzID0gdGhpcy5QQVRURVJOX0FOQ0hPUl9WQUxVRS5leGVjKHZhbHVlcy52YWx1ZSkpKSB7XG4gICAgICAgICAgaXNSZWYgPSBtYXRjaGVzLnJlZjtcbiAgICAgICAgICB2YWx1ZXMudmFsdWUgPSBtYXRjaGVzLnZhbHVlO1xuICAgICAgICB9XG4gICAgICAgIGlmIChtZXJnZU5vZGUpIHtcblxuICAgICAgICB9IGVsc2UgaWYgKCEodmFsdWVzLnZhbHVlICE9IG51bGwpIHx8ICcnID09PSBVdGlscy50cmltKHZhbHVlcy52YWx1ZSwgJyAnKSB8fCBVdGlscy5sdHJpbSh2YWx1ZXMudmFsdWUsICcgJykuaW5kZXhPZignIycpID09PSAwKSB7XG4gICAgICAgICAgaWYgKCEodGhpcy5pc05leHRMaW5lSW5kZW50ZWQoKSkgJiYgISh0aGlzLmlzTmV4dExpbmVVbkluZGVudGVkQ29sbGVjdGlvbigpKSkge1xuICAgICAgICAgICAgaWYgKGFsbG93T3ZlcndyaXRlIHx8IGRhdGFba2V5XSA9PT0gdm9pZCAwKSB7XG4gICAgICAgICAgICAgIGRhdGFba2V5XSA9IG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGMgPSB0aGlzLmdldFJlYWxDdXJyZW50TGluZU5iKCkgKyAxO1xuICAgICAgICAgICAgcGFyc2VyID0gbmV3IFBhcnNlcihjKTtcbiAgICAgICAgICAgIHBhcnNlci5yZWZzID0gdGhpcy5yZWZzO1xuICAgICAgICAgICAgdmFsID0gcGFyc2VyLnBhcnNlKHRoaXMuZ2V0TmV4dEVtYmVkQmxvY2soKSwgZXhjZXB0aW9uT25JbnZhbGlkVHlwZSwgb2JqZWN0RGVjb2Rlcik7XG4gICAgICAgICAgICBpZiAoYWxsb3dPdmVyd3JpdGUgfHwgZGF0YVtrZXldID09PSB2b2lkIDApIHtcbiAgICAgICAgICAgICAgZGF0YVtrZXldID0gdmFsO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB2YWwgPSB0aGlzLnBhcnNlVmFsdWUodmFsdWVzLnZhbHVlLCBleGNlcHRpb25PbkludmFsaWRUeXBlLCBvYmplY3REZWNvZGVyKTtcbiAgICAgICAgICBpZiAoYWxsb3dPdmVyd3JpdGUgfHwgZGF0YVtrZXldID09PSB2b2lkIDApIHtcbiAgICAgICAgICAgIGRhdGFba2V5XSA9IHZhbDtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGxpbmVDb3VudCA9IHRoaXMubGluZXMubGVuZ3RoO1xuICAgICAgICBpZiAoMSA9PT0gbGluZUNvdW50IHx8ICgyID09PSBsaW5lQ291bnQgJiYgVXRpbHMuaXNFbXB0eSh0aGlzLmxpbmVzWzFdKSkpIHtcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgdmFsdWUgPSBJbmxpbmUucGFyc2UodGhpcy5saW5lc1swXSwgZXhjZXB0aW9uT25JbnZhbGlkVHlwZSwgb2JqZWN0RGVjb2Rlcik7XG4gICAgICAgICAgfSBjYXRjaCAoX2Vycm9yKSB7XG4gICAgICAgICAgICBlID0gX2Vycm9yO1xuICAgICAgICAgICAgZS5wYXJzZWRMaW5lID0gdGhpcy5nZXRSZWFsQ3VycmVudExpbmVOYigpICsgMTtcbiAgICAgICAgICAgIGUuc25pcHBldCA9IHRoaXMuY3VycmVudExpbmU7XG4gICAgICAgICAgICB0aHJvdyBlO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAodHlwZW9mIHZhbHVlID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgaWYgKHZhbHVlIGluc3RhbmNlb2YgQXJyYXkpIHtcbiAgICAgICAgICAgICAgZmlyc3QgPSB2YWx1ZVswXTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGZvciAoa2V5IGluIHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgZmlyc3QgPSB2YWx1ZVtrZXldO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodHlwZW9mIGZpcnN0ID09PSAnc3RyaW5nJyAmJiBmaXJzdC5pbmRleE9mKCcqJykgPT09IDApIHtcbiAgICAgICAgICAgICAgZGF0YSA9IFtdO1xuICAgICAgICAgICAgICBmb3IgKF9sID0gMCwgX2xlbjMgPSB2YWx1ZS5sZW5ndGg7IF9sIDwgX2xlbjM7IF9sKyspIHtcbiAgICAgICAgICAgICAgICBhbGlhcyA9IHZhbHVlW19sXTtcbiAgICAgICAgICAgICAgICBkYXRhLnB1c2godGhpcy5yZWZzW2FsaWFzLnNsaWNlKDEpXSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgdmFsdWUgPSBkYXRhO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICAgIH0gZWxzZSBpZiAoKF9yZWYyID0gVXRpbHMubHRyaW0odmFsdWUpLmNoYXJBdCgwKSkgPT09ICdbJyB8fCBfcmVmMiA9PT0gJ3snKSB7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHJldHVybiBJbmxpbmUucGFyc2UodmFsdWUsIGV4Y2VwdGlvbk9uSW52YWxpZFR5cGUsIG9iamVjdERlY29kZXIpO1xuICAgICAgICAgIH0gY2F0Y2ggKF9lcnJvcikge1xuICAgICAgICAgICAgZSA9IF9lcnJvcjtcbiAgICAgICAgICAgIGUucGFyc2VkTGluZSA9IHRoaXMuZ2V0UmVhbEN1cnJlbnRMaW5lTmIoKSArIDE7XG4gICAgICAgICAgICBlLnNuaXBwZXQgPSB0aGlzLmN1cnJlbnRMaW5lO1xuICAgICAgICAgICAgdGhyb3cgZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdGhyb3cgbmV3IFBhcnNlRXhjZXB0aW9uKCdVbmFibGUgdG8gcGFyc2UuJywgdGhpcy5nZXRSZWFsQ3VycmVudExpbmVOYigpICsgMSwgdGhpcy5jdXJyZW50TGluZSk7XG4gICAgICB9XG4gICAgICBpZiAoaXNSZWYpIHtcbiAgICAgICAgaWYgKGRhdGEgaW5zdGFuY2VvZiBBcnJheSkge1xuICAgICAgICAgIHRoaXMucmVmc1tpc1JlZl0gPSBkYXRhW2RhdGEubGVuZ3RoIC0gMV07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbGFzdEtleSA9IG51bGw7XG4gICAgICAgICAgZm9yIChrZXkgaW4gZGF0YSkge1xuICAgICAgICAgICAgbGFzdEtleSA9IGtleTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdGhpcy5yZWZzW2lzUmVmXSA9IGRhdGFbbGFzdEtleV07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKFV0aWxzLmlzRW1wdHkoZGF0YSkpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gZGF0YTtcbiAgICB9XG4gIH07XG5cbiAgUGFyc2VyLnByb3RvdHlwZS5nZXRSZWFsQ3VycmVudExpbmVOYiA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLmN1cnJlbnRMaW5lTmIgKyB0aGlzLm9mZnNldDtcbiAgfTtcblxuICBQYXJzZXIucHJvdG90eXBlLmdldEN1cnJlbnRMaW5lSW5kZW50YXRpb24gPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5jdXJyZW50TGluZS5sZW5ndGggLSBVdGlscy5sdHJpbSh0aGlzLmN1cnJlbnRMaW5lLCAnICcpLmxlbmd0aDtcbiAgfTtcblxuICBQYXJzZXIucHJvdG90eXBlLmdldE5leHRFbWJlZEJsb2NrID0gZnVuY3Rpb24oaW5kZW50YXRpb24sIGluY2x1ZGVVbmluZGVudGVkQ29sbGVjdGlvbikge1xuICAgIHZhciBkYXRhLCBpbmRlbnQsIGlzSXRVbmluZGVudGVkQ29sbGVjdGlvbiwgbmV3SW5kZW50LCByZW1vdmVDb21tZW50cywgcmVtb3ZlQ29tbWVudHNQYXR0ZXJuLCB1bmluZGVudGVkRW1iZWRCbG9jaztcbiAgICBpZiAoaW5kZW50YXRpb24gPT0gbnVsbCkge1xuICAgICAgaW5kZW50YXRpb24gPSBudWxsO1xuICAgIH1cbiAgICBpZiAoaW5jbHVkZVVuaW5kZW50ZWRDb2xsZWN0aW9uID09IG51bGwpIHtcbiAgICAgIGluY2x1ZGVVbmluZGVudGVkQ29sbGVjdGlvbiA9IGZhbHNlO1xuICAgIH1cbiAgICB0aGlzLm1vdmVUb05leHRMaW5lKCk7XG4gICAgaWYgKGluZGVudGF0aW9uID09IG51bGwpIHtcbiAgICAgIG5ld0luZGVudCA9IHRoaXMuZ2V0Q3VycmVudExpbmVJbmRlbnRhdGlvbigpO1xuICAgICAgdW5pbmRlbnRlZEVtYmVkQmxvY2sgPSB0aGlzLmlzU3RyaW5nVW5JbmRlbnRlZENvbGxlY3Rpb25JdGVtKHRoaXMuY3VycmVudExpbmUpO1xuICAgICAgaWYgKCEodGhpcy5pc0N1cnJlbnRMaW5lRW1wdHkoKSkgJiYgMCA9PT0gbmV3SW5kZW50ICYmICF1bmluZGVudGVkRW1iZWRCbG9jaykge1xuICAgICAgICB0aHJvdyBuZXcgUGFyc2VFeGNlcHRpb24oJ0luZGVudGF0aW9uIHByb2JsZW0uJywgdGhpcy5nZXRSZWFsQ3VycmVudExpbmVOYigpICsgMSwgdGhpcy5jdXJyZW50TGluZSk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIG5ld0luZGVudCA9IGluZGVudGF0aW9uO1xuICAgIH1cbiAgICBkYXRhID0gW3RoaXMuY3VycmVudExpbmUuc2xpY2UobmV3SW5kZW50KV07XG4gICAgaWYgKCFpbmNsdWRlVW5pbmRlbnRlZENvbGxlY3Rpb24pIHtcbiAgICAgIGlzSXRVbmluZGVudGVkQ29sbGVjdGlvbiA9IHRoaXMuaXNTdHJpbmdVbkluZGVudGVkQ29sbGVjdGlvbkl0ZW0odGhpcy5jdXJyZW50TGluZSk7XG4gICAgfVxuICAgIHJlbW92ZUNvbW1lbnRzUGF0dGVybiA9IHRoaXMuUEFUVEVSTl9GT0xERURfU0NBTEFSX0VORDtcbiAgICByZW1vdmVDb21tZW50cyA9ICFyZW1vdmVDb21tZW50c1BhdHRlcm4udGVzdCh0aGlzLmN1cnJlbnRMaW5lKTtcbiAgICB3aGlsZSAodGhpcy5tb3ZlVG9OZXh0TGluZSgpKSB7XG4gICAgICBpbmRlbnQgPSB0aGlzLmdldEN1cnJlbnRMaW5lSW5kZW50YXRpb24oKTtcbiAgICAgIGlmIChpbmRlbnQgPT09IG5ld0luZGVudCkge1xuICAgICAgICByZW1vdmVDb21tZW50cyA9ICFyZW1vdmVDb21tZW50c1BhdHRlcm4udGVzdCh0aGlzLmN1cnJlbnRMaW5lKTtcbiAgICAgIH1cbiAgICAgIGlmIChpc0l0VW5pbmRlbnRlZENvbGxlY3Rpb24gJiYgIXRoaXMuaXNTdHJpbmdVbkluZGVudGVkQ29sbGVjdGlvbkl0ZW0odGhpcy5jdXJyZW50TGluZSkgJiYgaW5kZW50ID09PSBuZXdJbmRlbnQpIHtcbiAgICAgICAgdGhpcy5tb3ZlVG9QcmV2aW91c0xpbmUoKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBpZiAodGhpcy5pc0N1cnJlbnRMaW5lQmxhbmsoKSkge1xuICAgICAgICBkYXRhLnB1c2godGhpcy5jdXJyZW50TGluZS5zbGljZShuZXdJbmRlbnQpKTtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBpZiAocmVtb3ZlQ29tbWVudHMgJiYgdGhpcy5pc0N1cnJlbnRMaW5lQ29tbWVudCgpKSB7XG4gICAgICAgIGlmIChpbmRlbnQgPT09IG5ld0luZGVudCkge1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAoaW5kZW50ID49IG5ld0luZGVudCkge1xuICAgICAgICBkYXRhLnB1c2godGhpcy5jdXJyZW50TGluZS5zbGljZShuZXdJbmRlbnQpKTtcbiAgICAgIH0gZWxzZSBpZiAoVXRpbHMubHRyaW0odGhpcy5jdXJyZW50TGluZSkuY2hhckF0KDApID09PSAnIycpIHtcblxuICAgICAgfSBlbHNlIGlmICgwID09PSBpbmRlbnQpIHtcbiAgICAgICAgdGhpcy5tb3ZlVG9QcmV2aW91c0xpbmUoKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyBuZXcgUGFyc2VFeGNlcHRpb24oJ0luZGVudGF0aW9uIHByb2JsZW0uJywgdGhpcy5nZXRSZWFsQ3VycmVudExpbmVOYigpICsgMSwgdGhpcy5jdXJyZW50TGluZSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBkYXRhLmpvaW4oXCJcXG5cIik7XG4gIH07XG5cbiAgUGFyc2VyLnByb3RvdHlwZS5tb3ZlVG9OZXh0TGluZSA9IGZ1bmN0aW9uKCkge1xuICAgIGlmICh0aGlzLmN1cnJlbnRMaW5lTmIgPj0gdGhpcy5saW5lcy5sZW5ndGggLSAxKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHRoaXMuY3VycmVudExpbmUgPSB0aGlzLmxpbmVzWysrdGhpcy5jdXJyZW50TGluZU5iXTtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfTtcblxuICBQYXJzZXIucHJvdG90eXBlLm1vdmVUb1ByZXZpb3VzTGluZSA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuY3VycmVudExpbmUgPSB0aGlzLmxpbmVzWy0tdGhpcy5jdXJyZW50TGluZU5iXTtcbiAgfTtcblxuICBQYXJzZXIucHJvdG90eXBlLnBhcnNlVmFsdWUgPSBmdW5jdGlvbih2YWx1ZSwgZXhjZXB0aW9uT25JbnZhbGlkVHlwZSwgb2JqZWN0RGVjb2Rlcikge1xuICAgIHZhciBlLCBmb2xkZWRJbmRlbnQsIG1hdGNoZXMsIG1vZGlmaWVycywgcG9zLCB2YWwsIF9yZWYsIF9yZWYxO1xuICAgIGlmICgwID09PSB2YWx1ZS5pbmRleE9mKCcqJykpIHtcbiAgICAgIHBvcyA9IHZhbHVlLmluZGV4T2YoJyMnKTtcbiAgICAgIGlmIChwb3MgIT09IC0xKSB7XG4gICAgICAgIHZhbHVlID0gdmFsdWUuc3Vic3RyKDEsIHBvcyAtIDIpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdmFsdWUgPSB2YWx1ZS5zbGljZSgxKTtcbiAgICAgIH1cbiAgICAgIGlmICh0aGlzLnJlZnNbdmFsdWVdID09PSB2b2lkIDApIHtcbiAgICAgICAgdGhyb3cgbmV3IFBhcnNlRXhjZXB0aW9uKCdSZWZlcmVuY2UgXCInICsgdmFsdWUgKyAnXCIgZG9lcyBub3QgZXhpc3QuJywgdGhpcy5jdXJyZW50TGluZSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gdGhpcy5yZWZzW3ZhbHVlXTtcbiAgICB9XG4gICAgaWYgKG1hdGNoZXMgPSB0aGlzLlBBVFRFUk5fRk9MREVEX1NDQUxBUl9BTEwuZXhlYyh2YWx1ZSkpIHtcbiAgICAgIG1vZGlmaWVycyA9IChfcmVmID0gbWF0Y2hlcy5tb2RpZmllcnMpICE9IG51bGwgPyBfcmVmIDogJyc7XG4gICAgICBmb2xkZWRJbmRlbnQgPSBNYXRoLmFicyhwYXJzZUludChtb2RpZmllcnMpKTtcbiAgICAgIGlmIChpc05hTihmb2xkZWRJbmRlbnQpKSB7XG4gICAgICAgIGZvbGRlZEluZGVudCA9IDA7XG4gICAgICB9XG4gICAgICB2YWwgPSB0aGlzLnBhcnNlRm9sZGVkU2NhbGFyKG1hdGNoZXMuc2VwYXJhdG9yLCB0aGlzLlBBVFRFUk5fREVDSU1BTC5yZXBsYWNlKG1vZGlmaWVycywgJycpLCBmb2xkZWRJbmRlbnQpO1xuICAgICAgaWYgKG1hdGNoZXMudHlwZSAhPSBudWxsKSB7XG4gICAgICAgIElubGluZS5jb25maWd1cmUoZXhjZXB0aW9uT25JbnZhbGlkVHlwZSwgb2JqZWN0RGVjb2Rlcik7XG4gICAgICAgIHJldHVybiBJbmxpbmUucGFyc2VTY2FsYXIobWF0Y2hlcy50eXBlICsgJyAnICsgdmFsKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiB2YWw7XG4gICAgICB9XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICByZXR1cm4gSW5saW5lLnBhcnNlKHZhbHVlLCBleGNlcHRpb25PbkludmFsaWRUeXBlLCBvYmplY3REZWNvZGVyKTtcbiAgICB9IGNhdGNoIChfZXJyb3IpIHtcbiAgICAgIGUgPSBfZXJyb3I7XG4gICAgICBpZiAoKChfcmVmMSA9IHZhbHVlLmNoYXJBdCgwKSkgPT09ICdbJyB8fCBfcmVmMSA9PT0gJ3snKSAmJiBlIGluc3RhbmNlb2YgUGFyc2VFeGNlcHRpb24gJiYgdGhpcy5pc05leHRMaW5lSW5kZW50ZWQoKSkge1xuICAgICAgICB2YWx1ZSArPSBcIlxcblwiICsgdGhpcy5nZXROZXh0RW1iZWRCbG9jaygpO1xuICAgICAgICB0cnkge1xuICAgICAgICAgIHJldHVybiBJbmxpbmUucGFyc2UodmFsdWUsIGV4Y2VwdGlvbk9uSW52YWxpZFR5cGUsIG9iamVjdERlY29kZXIpO1xuICAgICAgICB9IGNhdGNoIChfZXJyb3IpIHtcbiAgICAgICAgICBlID0gX2Vycm9yO1xuICAgICAgICAgIGUucGFyc2VkTGluZSA9IHRoaXMuZ2V0UmVhbEN1cnJlbnRMaW5lTmIoKSArIDE7XG4gICAgICAgICAgZS5zbmlwcGV0ID0gdGhpcy5jdXJyZW50TGluZTtcbiAgICAgICAgICB0aHJvdyBlO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBlLnBhcnNlZExpbmUgPSB0aGlzLmdldFJlYWxDdXJyZW50TGluZU5iKCkgKyAxO1xuICAgICAgICBlLnNuaXBwZXQgPSB0aGlzLmN1cnJlbnRMaW5lO1xuICAgICAgICB0aHJvdyBlO1xuICAgICAgfVxuICAgIH1cbiAgfTtcblxuICBQYXJzZXIucHJvdG90eXBlLnBhcnNlRm9sZGVkU2NhbGFyID0gZnVuY3Rpb24oc2VwYXJhdG9yLCBpbmRpY2F0b3IsIGluZGVudGF0aW9uKSB7XG4gICAgdmFyIGlzQ3VycmVudExpbmVCbGFuaywgbGluZSwgbWF0Y2hlcywgbmV3VGV4dCwgbm90RU9GLCBwYXR0ZXJuLCB0ZXh0LCBfaSwgX2xlbiwgX3JlZjtcbiAgICBpZiAoaW5kaWNhdG9yID09IG51bGwpIHtcbiAgICAgIGluZGljYXRvciA9ICcnO1xuICAgIH1cbiAgICBpZiAoaW5kZW50YXRpb24gPT0gbnVsbCkge1xuICAgICAgaW5kZW50YXRpb24gPSAwO1xuICAgIH1cbiAgICBub3RFT0YgPSB0aGlzLm1vdmVUb05leHRMaW5lKCk7XG4gICAgaWYgKCFub3RFT0YpIHtcbiAgICAgIHJldHVybiAnJztcbiAgICB9XG4gICAgaXNDdXJyZW50TGluZUJsYW5rID0gdGhpcy5pc0N1cnJlbnRMaW5lQmxhbmsoKTtcbiAgICB0ZXh0ID0gJyc7XG4gICAgd2hpbGUgKG5vdEVPRiAmJiBpc0N1cnJlbnRMaW5lQmxhbmspIHtcbiAgICAgIGlmIChub3RFT0YgPSB0aGlzLm1vdmVUb05leHRMaW5lKCkpIHtcbiAgICAgICAgdGV4dCArPSBcIlxcblwiO1xuICAgICAgICBpc0N1cnJlbnRMaW5lQmxhbmsgPSB0aGlzLmlzQ3VycmVudExpbmVCbGFuaygpO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAoMCA9PT0gaW5kZW50YXRpb24pIHtcbiAgICAgIGlmIChtYXRjaGVzID0gdGhpcy5QQVRURVJOX0lOREVOVF9TUEFDRVMuZXhlYyh0aGlzLmN1cnJlbnRMaW5lKSkge1xuICAgICAgICBpbmRlbnRhdGlvbiA9IG1hdGNoZXNbMF0ubGVuZ3RoO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAoaW5kZW50YXRpb24gPiAwKSB7XG4gICAgICBwYXR0ZXJuID0gdGhpcy5QQVRURVJOX0ZPTERFRF9TQ0FMQVJfQllfSU5ERU5UQVRJT05baW5kZW50YXRpb25dO1xuICAgICAgaWYgKHBhdHRlcm4gPT0gbnVsbCkge1xuICAgICAgICBwYXR0ZXJuID0gbmV3IFBhdHRlcm4oJ14geycgKyBpbmRlbnRhdGlvbiArICd9KC4qKSQnKTtcbiAgICAgICAgUGFyc2VyLnByb3RvdHlwZS5QQVRURVJOX0ZPTERFRF9TQ0FMQVJfQllfSU5ERU5UQVRJT05baW5kZW50YXRpb25dID0gcGF0dGVybjtcbiAgICAgIH1cbiAgICAgIHdoaWxlIChub3RFT0YgJiYgKGlzQ3VycmVudExpbmVCbGFuayB8fCAobWF0Y2hlcyA9IHBhdHRlcm4uZXhlYyh0aGlzLmN1cnJlbnRMaW5lKSkpKSB7XG4gICAgICAgIGlmIChpc0N1cnJlbnRMaW5lQmxhbmspIHtcbiAgICAgICAgICB0ZXh0ICs9IHRoaXMuY3VycmVudExpbmUuc2xpY2UoaW5kZW50YXRpb24pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRleHQgKz0gbWF0Y2hlc1sxXTtcbiAgICAgICAgfVxuICAgICAgICBpZiAobm90RU9GID0gdGhpcy5tb3ZlVG9OZXh0TGluZSgpKSB7XG4gICAgICAgICAgdGV4dCArPSBcIlxcblwiO1xuICAgICAgICAgIGlzQ3VycmVudExpbmVCbGFuayA9IHRoaXMuaXNDdXJyZW50TGluZUJsYW5rKCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKG5vdEVPRikge1xuICAgICAgdGV4dCArPSBcIlxcblwiO1xuICAgIH1cbiAgICBpZiAobm90RU9GKSB7XG4gICAgICB0aGlzLm1vdmVUb1ByZXZpb3VzTGluZSgpO1xuICAgIH1cbiAgICBpZiAoJz4nID09PSBzZXBhcmF0b3IpIHtcbiAgICAgIG5ld1RleHQgPSAnJztcbiAgICAgIF9yZWYgPSB0ZXh0LnNwbGl0KFwiXFxuXCIpO1xuICAgICAgZm9yIChfaSA9IDAsIF9sZW4gPSBfcmVmLmxlbmd0aDsgX2kgPCBfbGVuOyBfaSsrKSB7XG4gICAgICAgIGxpbmUgPSBfcmVmW19pXTtcbiAgICAgICAgaWYgKGxpbmUubGVuZ3RoID09PSAwIHx8IGxpbmUuY2hhckF0KDApID09PSAnICcpIHtcbiAgICAgICAgICBuZXdUZXh0ID0gVXRpbHMucnRyaW0obmV3VGV4dCwgJyAnKSArIGxpbmUgKyBcIlxcblwiO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIG5ld1RleHQgKz0gbGluZSArICcgJztcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgdGV4dCA9IG5ld1RleHQ7XG4gICAgfVxuICAgIGlmICgnKycgIT09IGluZGljYXRvcikge1xuICAgICAgdGV4dCA9IFV0aWxzLnJ0cmltKHRleHQpO1xuICAgIH1cbiAgICBpZiAoJycgPT09IGluZGljYXRvcikge1xuICAgICAgdGV4dCA9IHRoaXMuUEFUVEVSTl9UUkFJTElOR19MSU5FUy5yZXBsYWNlKHRleHQsIFwiXFxuXCIpO1xuICAgIH0gZWxzZSBpZiAoJy0nID09PSBpbmRpY2F0b3IpIHtcbiAgICAgIHRleHQgPSB0aGlzLlBBVFRFUk5fVFJBSUxJTkdfTElORVMucmVwbGFjZSh0ZXh0LCAnJyk7XG4gICAgfVxuICAgIHJldHVybiB0ZXh0O1xuICB9O1xuXG4gIFBhcnNlci5wcm90b3R5cGUuaXNOZXh0TGluZUluZGVudGVkID0gZnVuY3Rpb24oaWdub3JlQ29tbWVudHMpIHtcbiAgICB2YXIgRU9GLCBjdXJyZW50SW5kZW50YXRpb24sIHJldDtcbiAgICBpZiAoaWdub3JlQ29tbWVudHMgPT0gbnVsbCkge1xuICAgICAgaWdub3JlQ29tbWVudHMgPSB0cnVlO1xuICAgIH1cbiAgICBjdXJyZW50SW5kZW50YXRpb24gPSB0aGlzLmdldEN1cnJlbnRMaW5lSW5kZW50YXRpb24oKTtcbiAgICBFT0YgPSAhdGhpcy5tb3ZlVG9OZXh0TGluZSgpO1xuICAgIGlmIChpZ25vcmVDb21tZW50cykge1xuICAgICAgd2hpbGUgKCFFT0YgJiYgdGhpcy5pc0N1cnJlbnRMaW5lRW1wdHkoKSkge1xuICAgICAgICBFT0YgPSAhdGhpcy5tb3ZlVG9OZXh0TGluZSgpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICB3aGlsZSAoIUVPRiAmJiB0aGlzLmlzQ3VycmVudExpbmVCbGFuaygpKSB7XG4gICAgICAgIEVPRiA9ICF0aGlzLm1vdmVUb05leHRMaW5lKCk7XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChFT0YpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgcmV0ID0gZmFsc2U7XG4gICAgaWYgKHRoaXMuZ2V0Q3VycmVudExpbmVJbmRlbnRhdGlvbigpID4gY3VycmVudEluZGVudGF0aW9uKSB7XG4gICAgICByZXQgPSB0cnVlO1xuICAgIH1cbiAgICB0aGlzLm1vdmVUb1ByZXZpb3VzTGluZSgpO1xuICAgIHJldHVybiByZXQ7XG4gIH07XG5cbiAgUGFyc2VyLnByb3RvdHlwZS5pc0N1cnJlbnRMaW5lRW1wdHkgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgdHJpbW1lZExpbmU7XG4gICAgdHJpbW1lZExpbmUgPSBVdGlscy50cmltKHRoaXMuY3VycmVudExpbmUsICcgJyk7XG4gICAgcmV0dXJuIHRyaW1tZWRMaW5lLmxlbmd0aCA9PT0gMCB8fCB0cmltbWVkTGluZS5jaGFyQXQoMCkgPT09ICcjJztcbiAgfTtcblxuICBQYXJzZXIucHJvdG90eXBlLmlzQ3VycmVudExpbmVCbGFuayA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiAnJyA9PT0gVXRpbHMudHJpbSh0aGlzLmN1cnJlbnRMaW5lLCAnICcpO1xuICB9O1xuXG4gIFBhcnNlci5wcm90b3R5cGUuaXNDdXJyZW50TGluZUNvbW1lbnQgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgbHRyaW1tZWRMaW5lO1xuICAgIGx0cmltbWVkTGluZSA9IFV0aWxzLmx0cmltKHRoaXMuY3VycmVudExpbmUsICcgJyk7XG4gICAgcmV0dXJuIGx0cmltbWVkTGluZS5jaGFyQXQoMCkgPT09ICcjJztcbiAgfTtcblxuICBQYXJzZXIucHJvdG90eXBlLmNsZWFudXAgPSBmdW5jdGlvbih2YWx1ZSkge1xuICAgIHZhciBjb3VudCwgaSwgaW5kZW50LCBsaW5lLCBsaW5lcywgc21hbGxlc3RJbmRlbnQsIHRyaW1tZWRWYWx1ZSwgX2ksIF9qLCBfbGVuLCBfbGVuMSwgX3JlZiwgX3JlZjEsIF9yZWYyO1xuICAgIGlmICh2YWx1ZS5pbmRleE9mKFwiXFxyXCIpICE9PSAtMSkge1xuICAgICAgdmFsdWUgPSB2YWx1ZS5zcGxpdChcIlxcclxcblwiKS5qb2luKFwiXFxuXCIpLnNwbGl0KFwiXFxyXCIpLmpvaW4oXCJcXG5cIik7XG4gICAgfVxuICAgIGNvdW50ID0gMDtcbiAgICBfcmVmID0gdGhpcy5QQVRURVJOX1lBTUxfSEVBREVSLnJlcGxhY2VBbGwodmFsdWUsICcnKSwgdmFsdWUgPSBfcmVmWzBdLCBjb3VudCA9IF9yZWZbMV07XG4gICAgdGhpcy5vZmZzZXQgKz0gY291bnQ7XG4gICAgX3JlZjEgPSB0aGlzLlBBVFRFUk5fTEVBRElOR19DT01NRU5UUy5yZXBsYWNlQWxsKHZhbHVlLCAnJywgMSksIHRyaW1tZWRWYWx1ZSA9IF9yZWYxWzBdLCBjb3VudCA9IF9yZWYxWzFdO1xuICAgIGlmIChjb3VudCA9PT0gMSkge1xuICAgICAgdGhpcy5vZmZzZXQgKz0gVXRpbHMuc3ViU3RyQ291bnQodmFsdWUsIFwiXFxuXCIpIC0gVXRpbHMuc3ViU3RyQ291bnQodHJpbW1lZFZhbHVlLCBcIlxcblwiKTtcbiAgICAgIHZhbHVlID0gdHJpbW1lZFZhbHVlO1xuICAgIH1cbiAgICBfcmVmMiA9IHRoaXMuUEFUVEVSTl9ET0NVTUVOVF9NQVJLRVJfU1RBUlQucmVwbGFjZUFsbCh2YWx1ZSwgJycsIDEpLCB0cmltbWVkVmFsdWUgPSBfcmVmMlswXSwgY291bnQgPSBfcmVmMlsxXTtcbiAgICBpZiAoY291bnQgPT09IDEpIHtcbiAgICAgIHRoaXMub2Zmc2V0ICs9IFV0aWxzLnN1YlN0ckNvdW50KHZhbHVlLCBcIlxcblwiKSAtIFV0aWxzLnN1YlN0ckNvdW50KHRyaW1tZWRWYWx1ZSwgXCJcXG5cIik7XG4gICAgICB2YWx1ZSA9IHRyaW1tZWRWYWx1ZTtcbiAgICAgIHZhbHVlID0gdGhpcy5QQVRURVJOX0RPQ1VNRU5UX01BUktFUl9FTkQucmVwbGFjZSh2YWx1ZSwgJycpO1xuICAgIH1cbiAgICBsaW5lcyA9IHZhbHVlLnNwbGl0KFwiXFxuXCIpO1xuICAgIHNtYWxsZXN0SW5kZW50ID0gLTE7XG4gICAgZm9yIChfaSA9IDAsIF9sZW4gPSBsaW5lcy5sZW5ndGg7IF9pIDwgX2xlbjsgX2krKykge1xuICAgICAgbGluZSA9IGxpbmVzW19pXTtcbiAgICAgIGluZGVudCA9IGxpbmUubGVuZ3RoIC0gVXRpbHMubHRyaW0obGluZSkubGVuZ3RoO1xuICAgICAgaWYgKHNtYWxsZXN0SW5kZW50ID09PSAtMSB8fCBpbmRlbnQgPCBzbWFsbGVzdEluZGVudCkge1xuICAgICAgICBzbWFsbGVzdEluZGVudCA9IGluZGVudDtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKHNtYWxsZXN0SW5kZW50ID4gMCkge1xuICAgICAgZm9yIChpID0gX2ogPSAwLCBfbGVuMSA9IGxpbmVzLmxlbmd0aDsgX2ogPCBfbGVuMTsgaSA9ICsrX2opIHtcbiAgICAgICAgbGluZSA9IGxpbmVzW2ldO1xuICAgICAgICBsaW5lc1tpXSA9IGxpbmUuc2xpY2Uoc21hbGxlc3RJbmRlbnQpO1xuICAgICAgfVxuICAgICAgdmFsdWUgPSBsaW5lcy5qb2luKFwiXFxuXCIpO1xuICAgIH1cbiAgICByZXR1cm4gdmFsdWU7XG4gIH07XG5cbiAgUGFyc2VyLnByb3RvdHlwZS5pc05leHRMaW5lVW5JbmRlbnRlZENvbGxlY3Rpb24gPSBmdW5jdGlvbihjdXJyZW50SW5kZW50YXRpb24pIHtcbiAgICB2YXIgbm90RU9GLCByZXQ7XG4gICAgaWYgKGN1cnJlbnRJbmRlbnRhdGlvbiA9PSBudWxsKSB7XG4gICAgICBjdXJyZW50SW5kZW50YXRpb24gPSBudWxsO1xuICAgIH1cbiAgICBpZiAoY3VycmVudEluZGVudGF0aW9uID09IG51bGwpIHtcbiAgICAgIGN1cnJlbnRJbmRlbnRhdGlvbiA9IHRoaXMuZ2V0Q3VycmVudExpbmVJbmRlbnRhdGlvbigpO1xuICAgIH1cbiAgICBub3RFT0YgPSB0aGlzLm1vdmVUb05leHRMaW5lKCk7XG4gICAgd2hpbGUgKG5vdEVPRiAmJiB0aGlzLmlzQ3VycmVudExpbmVFbXB0eSgpKSB7XG4gICAgICBub3RFT0YgPSB0aGlzLm1vdmVUb05leHRMaW5lKCk7XG4gICAgfVxuICAgIGlmIChmYWxzZSA9PT0gbm90RU9GKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHJldCA9IGZhbHNlO1xuICAgIGlmICh0aGlzLmdldEN1cnJlbnRMaW5lSW5kZW50YXRpb24oKSA9PT0gY3VycmVudEluZGVudGF0aW9uICYmIHRoaXMuaXNTdHJpbmdVbkluZGVudGVkQ29sbGVjdGlvbkl0ZW0odGhpcy5jdXJyZW50TGluZSkpIHtcbiAgICAgIHJldCA9IHRydWU7XG4gICAgfVxuICAgIHRoaXMubW92ZVRvUHJldmlvdXNMaW5lKCk7XG4gICAgcmV0dXJuIHJldDtcbiAgfTtcblxuICBQYXJzZXIucHJvdG90eXBlLmlzU3RyaW5nVW5JbmRlbnRlZENvbGxlY3Rpb25JdGVtID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuY3VycmVudExpbmUgPT09ICctJyB8fCB0aGlzLmN1cnJlbnRMaW5lLnNsaWNlKDAsIDIpID09PSAnLSAnO1xuICB9O1xuXG4gIHJldHVybiBQYXJzZXI7XG5cbn0pKCk7XG5cbm1vZHVsZS5leHBvcnRzID0gUGFyc2VyO1xuIiwiLy8gR2VuZXJhdGVkIGJ5IENvZmZlZVNjcmlwdCAxLjguMFxudmFyIFBhdHRlcm47XG5cblBhdHRlcm4gPSAoZnVuY3Rpb24oKSB7XG4gIFBhdHRlcm4ucHJvdG90eXBlLnJlZ2V4ID0gbnVsbDtcblxuICBQYXR0ZXJuLnByb3RvdHlwZS5yYXdSZWdleCA9IG51bGw7XG5cbiAgUGF0dGVybi5wcm90b3R5cGUuY2xlYW5lZFJlZ2V4ID0gbnVsbDtcblxuICBQYXR0ZXJuLnByb3RvdHlwZS5tYXBwaW5nID0gbnVsbDtcblxuICBmdW5jdGlvbiBQYXR0ZXJuKHJhd1JlZ2V4LCBtb2RpZmllcnMpIHtcbiAgICB2YXIgY2FwdHVyaW5nQnJhY2tldE51bWJlciwgY2xlYW5lZFJlZ2V4LCBpLCBsZW4sIG1hcHBpbmcsIG5hbWUsIHBhcnQsIHN1YkNoYXIsIF9jaGFyO1xuICAgIGlmIChtb2RpZmllcnMgPT0gbnVsbCkge1xuICAgICAgbW9kaWZpZXJzID0gJyc7XG4gICAgfVxuICAgIGNsZWFuZWRSZWdleCA9ICcnO1xuICAgIGxlbiA9IHJhd1JlZ2V4Lmxlbmd0aDtcbiAgICBtYXBwaW5nID0gbnVsbDtcbiAgICBjYXB0dXJpbmdCcmFja2V0TnVtYmVyID0gMDtcbiAgICBpID0gMDtcbiAgICB3aGlsZSAoaSA8IGxlbikge1xuICAgICAgX2NoYXIgPSByYXdSZWdleC5jaGFyQXQoaSk7XG4gICAgICBpZiAoX2NoYXIgPT09ICdcXFxcJykge1xuICAgICAgICBjbGVhbmVkUmVnZXggKz0gcmF3UmVnZXguc2xpY2UoaSwgKyhpICsgMSkgKyAxIHx8IDllOSk7XG4gICAgICAgIGkrKztcbiAgICAgIH0gZWxzZSBpZiAoX2NoYXIgPT09ICcoJykge1xuICAgICAgICBpZiAoaSA8IGxlbiAtIDIpIHtcbiAgICAgICAgICBwYXJ0ID0gcmF3UmVnZXguc2xpY2UoaSwgKyhpICsgMikgKyAxIHx8IDllOSk7XG4gICAgICAgICAgaWYgKHBhcnQgPT09ICcoPzonKSB7XG4gICAgICAgICAgICBpICs9IDI7XG4gICAgICAgICAgICBjbGVhbmVkUmVnZXggKz0gcGFydDtcbiAgICAgICAgICB9IGVsc2UgaWYgKHBhcnQgPT09ICcoPzwnKSB7XG4gICAgICAgICAgICBjYXB0dXJpbmdCcmFja2V0TnVtYmVyKys7XG4gICAgICAgICAgICBpICs9IDI7XG4gICAgICAgICAgICBuYW1lID0gJyc7XG4gICAgICAgICAgICB3aGlsZSAoaSArIDEgPCBsZW4pIHtcbiAgICAgICAgICAgICAgc3ViQ2hhciA9IHJhd1JlZ2V4LmNoYXJBdChpICsgMSk7XG4gICAgICAgICAgICAgIGlmIChzdWJDaGFyID09PSAnPicpIHtcbiAgICAgICAgICAgICAgICBjbGVhbmVkUmVnZXggKz0gJygnO1xuICAgICAgICAgICAgICAgIGkrKztcbiAgICAgICAgICAgICAgICBpZiAobmFtZS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICBpZiAobWFwcGluZyA9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIG1hcHBpbmcgPSB7fTtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIG1hcHBpbmdbbmFtZV0gPSBjYXB0dXJpbmdCcmFja2V0TnVtYmVyO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBuYW1lICs9IHN1YkNoYXI7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgaSsrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjbGVhbmVkUmVnZXggKz0gX2NoYXI7XG4gICAgICAgICAgICBjYXB0dXJpbmdCcmFja2V0TnVtYmVyKys7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGNsZWFuZWRSZWdleCArPSBfY2hhcjtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY2xlYW5lZFJlZ2V4ICs9IF9jaGFyO1xuICAgICAgfVxuICAgICAgaSsrO1xuICAgIH1cbiAgICB0aGlzLnJhd1JlZ2V4ID0gcmF3UmVnZXg7XG4gICAgdGhpcy5jbGVhbmVkUmVnZXggPSBjbGVhbmVkUmVnZXg7XG4gICAgdGhpcy5yZWdleCA9IG5ldyBSZWdFeHAodGhpcy5jbGVhbmVkUmVnZXgsICdnJyArIG1vZGlmaWVycy5yZXBsYWNlKCdnJywgJycpKTtcbiAgICB0aGlzLm1hcHBpbmcgPSBtYXBwaW5nO1xuICB9XG5cbiAgUGF0dGVybi5wcm90b3R5cGUuZXhlYyA9IGZ1bmN0aW9uKHN0cikge1xuICAgIHZhciBpbmRleCwgbWF0Y2hlcywgbmFtZSwgX3JlZjtcbiAgICB0aGlzLnJlZ2V4Lmxhc3RJbmRleCA9IDA7XG4gICAgbWF0Y2hlcyA9IHRoaXMucmVnZXguZXhlYyhzdHIpO1xuICAgIGlmIChtYXRjaGVzID09IG51bGwpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICBpZiAodGhpcy5tYXBwaW5nICE9IG51bGwpIHtcbiAgICAgIF9yZWYgPSB0aGlzLm1hcHBpbmc7XG4gICAgICBmb3IgKG5hbWUgaW4gX3JlZikge1xuICAgICAgICBpbmRleCA9IF9yZWZbbmFtZV07XG4gICAgICAgIG1hdGNoZXNbbmFtZV0gPSBtYXRjaGVzW2luZGV4XTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG1hdGNoZXM7XG4gIH07XG5cbiAgUGF0dGVybi5wcm90b3R5cGUudGVzdCA9IGZ1bmN0aW9uKHN0cikge1xuICAgIHRoaXMucmVnZXgubGFzdEluZGV4ID0gMDtcbiAgICByZXR1cm4gdGhpcy5yZWdleC50ZXN0KHN0cik7XG4gIH07XG5cbiAgUGF0dGVybi5wcm90b3R5cGUucmVwbGFjZSA9IGZ1bmN0aW9uKHN0ciwgcmVwbGFjZW1lbnQpIHtcbiAgICB0aGlzLnJlZ2V4Lmxhc3RJbmRleCA9IDA7XG4gICAgcmV0dXJuIHN0ci5yZXBsYWNlKHRoaXMucmVnZXgsIHJlcGxhY2VtZW50KTtcbiAgfTtcblxuICBQYXR0ZXJuLnByb3RvdHlwZS5yZXBsYWNlQWxsID0gZnVuY3Rpb24oc3RyLCByZXBsYWNlbWVudCwgbGltaXQpIHtcbiAgICB2YXIgY291bnQ7XG4gICAgaWYgKGxpbWl0ID09IG51bGwpIHtcbiAgICAgIGxpbWl0ID0gMDtcbiAgICB9XG4gICAgdGhpcy5yZWdleC5sYXN0SW5kZXggPSAwO1xuICAgIGNvdW50ID0gMDtcbiAgICB3aGlsZSAodGhpcy5yZWdleC50ZXN0KHN0cikgJiYgKGxpbWl0ID09PSAwIHx8IGNvdW50IDwgbGltaXQpKSB7XG4gICAgICB0aGlzLnJlZ2V4Lmxhc3RJbmRleCA9IDA7XG4gICAgICBzdHIgPSBzdHIucmVwbGFjZSh0aGlzLnJlZ2V4LCAnJyk7XG4gICAgICBjb3VudCsrO1xuICAgIH1cbiAgICByZXR1cm4gW3N0ciwgY291bnRdO1xuICB9O1xuXG4gIHJldHVybiBQYXR0ZXJuO1xuXG59KSgpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFBhdHRlcm47XG4iLCIvLyBHZW5lcmF0ZWQgYnkgQ29mZmVlU2NyaXB0IDEuOC4wXG52YXIgUGF0dGVybiwgVW5lc2NhcGVyLCBVdGlscztcblxuVXRpbHMgPSByZXF1aXJlKCcuL1V0aWxzJyk7XG5cblBhdHRlcm4gPSByZXF1aXJlKCcuL1BhdHRlcm4nKTtcblxuVW5lc2NhcGVyID0gKGZ1bmN0aW9uKCkge1xuICBmdW5jdGlvbiBVbmVzY2FwZXIoKSB7fVxuXG4gIFVuZXNjYXBlci5QQVRURVJOX0VTQ0FQRURfQ0hBUkFDVEVSID0gbmV3IFBhdHRlcm4oJ1xcXFxcXFxcKFswYWJ0XFx0bnZmcmUgXCJcXFxcL1xcXFxcXFxcTl9MUF18eFswLTlhLWZBLUZdezJ9fHVbMC05YS1mQS1GXXs0fXxVWzAtOWEtZkEtRl17OH0pJyk7XG5cbiAgVW5lc2NhcGVyLnVuZXNjYXBlU2luZ2xlUXVvdGVkU3RyaW5nID0gZnVuY3Rpb24odmFsdWUpIHtcbiAgICByZXR1cm4gdmFsdWUucmVwbGFjZSgvXFwnXFwnL2csICdcXCcnKTtcbiAgfTtcblxuICBVbmVzY2FwZXIudW5lc2NhcGVEb3VibGVRdW90ZWRTdHJpbmcgPSBmdW5jdGlvbih2YWx1ZSkge1xuICAgIGlmICh0aGlzLl91bmVzY2FwZUNhbGxiYWNrID09IG51bGwpIHtcbiAgICAgIHRoaXMuX3VuZXNjYXBlQ2FsbGJhY2sgPSAoZnVuY3Rpb24oX3RoaXMpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKHN0cikge1xuICAgICAgICAgIHJldHVybiBfdGhpcy51bmVzY2FwZUNoYXJhY3RlcihzdHIpO1xuICAgICAgICB9O1xuICAgICAgfSkodGhpcyk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLlBBVFRFUk5fRVNDQVBFRF9DSEFSQUNURVIucmVwbGFjZSh2YWx1ZSwgdGhpcy5fdW5lc2NhcGVDYWxsYmFjayk7XG4gIH07XG5cbiAgVW5lc2NhcGVyLnVuZXNjYXBlQ2hhcmFjdGVyID0gZnVuY3Rpb24odmFsdWUpIHtcbiAgICB2YXIgY2g7XG4gICAgY2ggPSBTdHJpbmcuZnJvbUNoYXJDb2RlO1xuICAgIHN3aXRjaCAodmFsdWUuY2hhckF0KDEpKSB7XG4gICAgICBjYXNlICcwJzpcbiAgICAgICAgcmV0dXJuIGNoKDApO1xuICAgICAgY2FzZSAnYSc6XG4gICAgICAgIHJldHVybiBjaCg3KTtcbiAgICAgIGNhc2UgJ2InOlxuICAgICAgICByZXR1cm4gY2goOCk7XG4gICAgICBjYXNlICd0JzpcbiAgICAgICAgcmV0dXJuIFwiXFx0XCI7XG4gICAgICBjYXNlIFwiXFx0XCI6XG4gICAgICAgIHJldHVybiBcIlxcdFwiO1xuICAgICAgY2FzZSAnbic6XG4gICAgICAgIHJldHVybiBcIlxcblwiO1xuICAgICAgY2FzZSAndic6XG4gICAgICAgIHJldHVybiBjaCgxMSk7XG4gICAgICBjYXNlICdmJzpcbiAgICAgICAgcmV0dXJuIGNoKDEyKTtcbiAgICAgIGNhc2UgJ3InOlxuICAgICAgICByZXR1cm4gY2goMTMpO1xuICAgICAgY2FzZSAnZSc6XG4gICAgICAgIHJldHVybiBjaCgyNyk7XG4gICAgICBjYXNlICcgJzpcbiAgICAgICAgcmV0dXJuICcgJztcbiAgICAgIGNhc2UgJ1wiJzpcbiAgICAgICAgcmV0dXJuICdcIic7XG4gICAgICBjYXNlICcvJzpcbiAgICAgICAgcmV0dXJuICcvJztcbiAgICAgIGNhc2UgJ1xcXFwnOlxuICAgICAgICByZXR1cm4gJ1xcXFwnO1xuICAgICAgY2FzZSAnTic6XG4gICAgICAgIHJldHVybiBjaCgweDAwODUpO1xuICAgICAgY2FzZSAnXyc6XG4gICAgICAgIHJldHVybiBjaCgweDAwQTApO1xuICAgICAgY2FzZSAnTCc6XG4gICAgICAgIHJldHVybiBjaCgweDIwMjgpO1xuICAgICAgY2FzZSAnUCc6XG4gICAgICAgIHJldHVybiBjaCgweDIwMjkpO1xuICAgICAgY2FzZSAneCc6XG4gICAgICAgIHJldHVybiBVdGlscy51dGY4Y2hyKFV0aWxzLmhleERlYyh2YWx1ZS5zdWJzdHIoMiwgMikpKTtcbiAgICAgIGNhc2UgJ3UnOlxuICAgICAgICByZXR1cm4gVXRpbHMudXRmOGNocihVdGlscy5oZXhEZWModmFsdWUuc3Vic3RyKDIsIDQpKSk7XG4gICAgICBjYXNlICdVJzpcbiAgICAgICAgcmV0dXJuIFV0aWxzLnV0ZjhjaHIoVXRpbHMuaGV4RGVjKHZhbHVlLnN1YnN0cigyLCA4KSkpO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgcmV0dXJuICcnO1xuICAgIH1cbiAgfTtcblxuICByZXR1cm4gVW5lc2NhcGVyO1xuXG59KSgpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFVuZXNjYXBlcjtcbiIsIi8vIEdlbmVyYXRlZCBieSBDb2ZmZWVTY3JpcHQgMS44LjBcbnZhciBQYXR0ZXJuLCBVdGlscztcblxuUGF0dGVybiA9IHJlcXVpcmUoJy4vUGF0dGVybicpO1xuXG5VdGlscyA9IChmdW5jdGlvbigpIHtcbiAgZnVuY3Rpb24gVXRpbHMoKSB7fVxuXG4gIFV0aWxzLlJFR0VYX0xFRlRfVFJJTV9CWV9DSEFSID0ge307XG5cbiAgVXRpbHMuUkVHRVhfUklHSFRfVFJJTV9CWV9DSEFSID0ge307XG5cbiAgVXRpbHMuUkVHRVhfU1BBQ0VTID0gL1xccysvZztcblxuICBVdGlscy5SRUdFWF9ESUdJVFMgPSAvXlxcZCskLztcblxuICBVdGlscy5SRUdFWF9PQ1RBTCA9IC9bXjAtN10vZ2k7XG5cbiAgVXRpbHMuUkVHRVhfSEVYQURFQ0lNQUwgPSAvW15hLWYwLTldL2dpO1xuXG4gIFV0aWxzLlBBVFRFUk5fREFURSA9IG5ldyBQYXR0ZXJuKCdeJyArICcoPzx5ZWFyPlswLTldWzAtOV1bMC05XVswLTldKScgKyAnLSg/PG1vbnRoPlswLTldWzAtOV0/KScgKyAnLSg/PGRheT5bMC05XVswLTldPyknICsgJyg/Oig/OltUdF18WyBcXHRdKyknICsgJyg/PGhvdXI+WzAtOV1bMC05XT8pJyArICc6KD88bWludXRlPlswLTldWzAtOV0pJyArICc6KD88c2Vjb25kPlswLTldWzAtOV0pJyArICcoPzpcXC4oPzxmcmFjdGlvbj5bMC05XSopKT8nICsgJyg/OlsgXFx0XSooPzx0ej5afCg/PHR6X3NpZ24+Wy0rXSkoPzx0el9ob3VyPlswLTldWzAtOV0/KScgKyAnKD86Oig/PHR6X21pbnV0ZT5bMC05XVswLTldKSk/KSk/KT8nICsgJyQnLCAnaScpO1xuXG4gIFV0aWxzLkxPQ0FMX1RJTUVaT05FX09GRlNFVCA9IG5ldyBEYXRlKCkuZ2V0VGltZXpvbmVPZmZzZXQoKSAqIDYwICogMTAwMDtcblxuICBVdGlscy50cmltID0gZnVuY3Rpb24oc3RyLCBfY2hhcikge1xuICAgIHZhciByZWdleExlZnQsIHJlZ2V4UmlnaHQ7XG4gICAgaWYgKF9jaGFyID09IG51bGwpIHtcbiAgICAgIF9jaGFyID0gJ1xcXFxzJztcbiAgICB9XG4gICAgcmV0dXJuIHN0ci50cmltKCk7XG4gICAgcmVnZXhMZWZ0ID0gdGhpcy5SRUdFWF9MRUZUX1RSSU1fQllfQ0hBUltfY2hhcl07XG4gICAgaWYgKHJlZ2V4TGVmdCA9PSBudWxsKSB7XG4gICAgICB0aGlzLlJFR0VYX0xFRlRfVFJJTV9CWV9DSEFSW19jaGFyXSA9IHJlZ2V4TGVmdCA9IG5ldyBSZWdFeHAoJ14nICsgX2NoYXIgKyAnJyArIF9jaGFyICsgJyonKTtcbiAgICB9XG4gICAgcmVnZXhMZWZ0Lmxhc3RJbmRleCA9IDA7XG4gICAgcmVnZXhSaWdodCA9IHRoaXMuUkVHRVhfUklHSFRfVFJJTV9CWV9DSEFSW19jaGFyXTtcbiAgICBpZiAocmVnZXhSaWdodCA9PSBudWxsKSB7XG4gICAgICB0aGlzLlJFR0VYX1JJR0hUX1RSSU1fQllfQ0hBUltfY2hhcl0gPSByZWdleFJpZ2h0ID0gbmV3IFJlZ0V4cChfY2hhciArICcnICsgX2NoYXIgKyAnKiQnKTtcbiAgICB9XG4gICAgcmVnZXhSaWdodC5sYXN0SW5kZXggPSAwO1xuICAgIHJldHVybiBzdHIucmVwbGFjZShyZWdleExlZnQsICcnKS5yZXBsYWNlKHJlZ2V4UmlnaHQsICcnKTtcbiAgfTtcblxuICBVdGlscy5sdHJpbSA9IGZ1bmN0aW9uKHN0ciwgX2NoYXIpIHtcbiAgICB2YXIgcmVnZXhMZWZ0O1xuICAgIGlmIChfY2hhciA9PSBudWxsKSB7XG4gICAgICBfY2hhciA9ICdcXFxccyc7XG4gICAgfVxuICAgIHJlZ2V4TGVmdCA9IHRoaXMuUkVHRVhfTEVGVF9UUklNX0JZX0NIQVJbX2NoYXJdO1xuICAgIGlmIChyZWdleExlZnQgPT0gbnVsbCkge1xuICAgICAgdGhpcy5SRUdFWF9MRUZUX1RSSU1fQllfQ0hBUltfY2hhcl0gPSByZWdleExlZnQgPSBuZXcgUmVnRXhwKCdeJyArIF9jaGFyICsgJycgKyBfY2hhciArICcqJyk7XG4gICAgfVxuICAgIHJlZ2V4TGVmdC5sYXN0SW5kZXggPSAwO1xuICAgIHJldHVybiBzdHIucmVwbGFjZShyZWdleExlZnQsICcnKTtcbiAgfTtcblxuICBVdGlscy5ydHJpbSA9IGZ1bmN0aW9uKHN0ciwgX2NoYXIpIHtcbiAgICB2YXIgcmVnZXhSaWdodDtcbiAgICBpZiAoX2NoYXIgPT0gbnVsbCkge1xuICAgICAgX2NoYXIgPSAnXFxcXHMnO1xuICAgIH1cbiAgICByZWdleFJpZ2h0ID0gdGhpcy5SRUdFWF9SSUdIVF9UUklNX0JZX0NIQVJbX2NoYXJdO1xuICAgIGlmIChyZWdleFJpZ2h0ID09IG51bGwpIHtcbiAgICAgIHRoaXMuUkVHRVhfUklHSFRfVFJJTV9CWV9DSEFSW19jaGFyXSA9IHJlZ2V4UmlnaHQgPSBuZXcgUmVnRXhwKF9jaGFyICsgJycgKyBfY2hhciArICcqJCcpO1xuICAgIH1cbiAgICByZWdleFJpZ2h0Lmxhc3RJbmRleCA9IDA7XG4gICAgcmV0dXJuIHN0ci5yZXBsYWNlKHJlZ2V4UmlnaHQsICcnKTtcbiAgfTtcblxuICBVdGlscy5pc0VtcHR5ID0gZnVuY3Rpb24odmFsdWUpIHtcbiAgICByZXR1cm4gIXZhbHVlIHx8IHZhbHVlID09PSAnJyB8fCB2YWx1ZSA9PT0gJzAnIHx8ICh2YWx1ZSBpbnN0YW5jZW9mIEFycmF5ICYmIHZhbHVlLmxlbmd0aCA9PT0gMCk7XG4gIH07XG5cbiAgVXRpbHMuc3ViU3RyQ291bnQgPSBmdW5jdGlvbihzdHJpbmcsIHN1YlN0cmluZywgc3RhcnQsIGxlbmd0aCkge1xuICAgIHZhciBjLCBpLCBsZW4sIHN1YmxlbiwgX2k7XG4gICAgYyA9IDA7XG4gICAgc3RyaW5nID0gJycgKyBzdHJpbmc7XG4gICAgc3ViU3RyaW5nID0gJycgKyBzdWJTdHJpbmc7XG4gICAgaWYgKHN0YXJ0ICE9IG51bGwpIHtcbiAgICAgIHN0cmluZyA9IHN0cmluZy5zbGljZShzdGFydCk7XG4gICAgfVxuICAgIGlmIChsZW5ndGggIT0gbnVsbCkge1xuICAgICAgc3RyaW5nID0gc3RyaW5nLnNsaWNlKDAsIGxlbmd0aCk7XG4gICAgfVxuICAgIGxlbiA9IHN0cmluZy5sZW5ndGg7XG4gICAgc3VibGVuID0gc3ViU3RyaW5nLmxlbmd0aDtcbiAgICBmb3IgKGkgPSBfaSA9IDA7IDAgPD0gbGVuID8gX2kgPCBsZW4gOiBfaSA+IGxlbjsgaSA9IDAgPD0gbGVuID8gKytfaSA6IC0tX2kpIHtcbiAgICAgIGlmIChzdWJTdHJpbmcgPT09IHN0cmluZy5zbGljZShpLCBzdWJsZW4pKSB7XG4gICAgICAgIGMrKztcbiAgICAgICAgaSArPSBzdWJsZW4gLSAxO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gYztcbiAgfTtcblxuICBVdGlscy5pc0RpZ2l0cyA9IGZ1bmN0aW9uKGlucHV0KSB7XG4gICAgdGhpcy5SRUdFWF9ESUdJVFMubGFzdEluZGV4ID0gMDtcbiAgICByZXR1cm4gdGhpcy5SRUdFWF9ESUdJVFMudGVzdChpbnB1dCk7XG4gIH07XG5cbiAgVXRpbHMub2N0RGVjID0gZnVuY3Rpb24oaW5wdXQpIHtcbiAgICB0aGlzLlJFR0VYX09DVEFMLmxhc3RJbmRleCA9IDA7XG4gICAgcmV0dXJuIHBhcnNlSW50KChpbnB1dCArICcnKS5yZXBsYWNlKHRoaXMuUkVHRVhfT0NUQUwsICcnKSwgOCk7XG4gIH07XG5cbiAgVXRpbHMuaGV4RGVjID0gZnVuY3Rpb24oaW5wdXQpIHtcbiAgICB0aGlzLlJFR0VYX0hFWEFERUNJTUFMLmxhc3RJbmRleCA9IDA7XG4gICAgaW5wdXQgPSB0aGlzLnRyaW0oaW5wdXQpO1xuICAgIGlmICgoaW5wdXQgKyAnJykuc2xpY2UoMCwgMikgPT09ICcweCcpIHtcbiAgICAgIGlucHV0ID0gKGlucHV0ICsgJycpLnNsaWNlKDIpO1xuICAgIH1cbiAgICByZXR1cm4gcGFyc2VJbnQoKGlucHV0ICsgJycpLnJlcGxhY2UodGhpcy5SRUdFWF9IRVhBREVDSU1BTCwgJycpLCAxNik7XG4gIH07XG5cbiAgVXRpbHMudXRmOGNociA9IGZ1bmN0aW9uKGMpIHtcbiAgICB2YXIgY2g7XG4gICAgY2ggPSBTdHJpbmcuZnJvbUNoYXJDb2RlO1xuICAgIGlmICgweDgwID4gKGMgJT0gMHgyMDAwMDApKSB7XG4gICAgICByZXR1cm4gY2goYyk7XG4gICAgfVxuICAgIGlmICgweDgwMCA+IGMpIHtcbiAgICAgIHJldHVybiBjaCgweEMwIHwgYyA+PiA2KSArIGNoKDB4ODAgfCBjICYgMHgzRik7XG4gICAgfVxuICAgIGlmICgweDEwMDAwID4gYykge1xuICAgICAgcmV0dXJuIGNoKDB4RTAgfCBjID4+IDEyKSArIGNoKDB4ODAgfCBjID4+IDYgJiAweDNGKSArIGNoKDB4ODAgfCBjICYgMHgzRik7XG4gICAgfVxuICAgIHJldHVybiBjaCgweEYwIHwgYyA+PiAxOCkgKyBjaCgweDgwIHwgYyA+PiAxMiAmIDB4M0YpICsgY2goMHg4MCB8IGMgPj4gNiAmIDB4M0YpICsgY2goMHg4MCB8IGMgJiAweDNGKTtcbiAgfTtcblxuICBVdGlscy5wYXJzZUJvb2xlYW4gPSBmdW5jdGlvbihpbnB1dCwgc3RyaWN0KSB7XG4gICAgdmFyIGxvd2VySW5wdXQ7XG4gICAgaWYgKHN0cmljdCA9PSBudWxsKSB7XG4gICAgICBzdHJpY3QgPSB0cnVlO1xuICAgIH1cbiAgICBpZiAodHlwZW9mIGlucHV0ID09PSAnc3RyaW5nJykge1xuICAgICAgbG93ZXJJbnB1dCA9IGlucHV0LnRvTG93ZXJDYXNlKCk7XG4gICAgICBpZiAoIXN0cmljdCkge1xuICAgICAgICBpZiAobG93ZXJJbnB1dCA9PT0gJ25vJykge1xuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKGxvd2VySW5wdXQgPT09ICcwJykge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICBpZiAobG93ZXJJbnB1dCA9PT0gJ2ZhbHNlJykge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICBpZiAobG93ZXJJbnB1dCA9PT0gJycpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIHJldHVybiAhIWlucHV0O1xuICB9O1xuXG4gIFV0aWxzLmlzTnVtZXJpYyA9IGZ1bmN0aW9uKGlucHV0KSB7XG4gICAgdGhpcy5SRUdFWF9TUEFDRVMubGFzdEluZGV4ID0gMDtcbiAgICByZXR1cm4gdHlwZW9mIGlucHV0ID09PSAnbnVtYmVyJyB8fCB0eXBlb2YgaW5wdXQgPT09ICdzdHJpbmcnICYmICFpc05hTihpbnB1dCkgJiYgaW5wdXQucmVwbGFjZSh0aGlzLlJFR0VYX1NQQUNFUywgJycpICE9PSAnJztcbiAgfTtcblxuICBVdGlscy5zdHJpbmdUb0RhdGUgPSBmdW5jdGlvbihzdHIpIHtcbiAgICB2YXIgZGF0ZSwgZGF5LCBmcmFjdGlvbiwgaG91ciwgaW5mbywgbWludXRlLCBtb250aCwgc2Vjb25kLCB0el9ob3VyLCB0el9taW51dGUsIHR6X29mZnNldCwgeWVhcjtcbiAgICBpZiAoIShzdHIgIT0gbnVsbCA/IHN0ci5sZW5ndGggOiB2b2lkIDApKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgaW5mbyA9IHRoaXMuUEFUVEVSTl9EQVRFLmV4ZWMoc3RyKTtcbiAgICBpZiAoIWluZm8pIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICB5ZWFyID0gcGFyc2VJbnQoaW5mby55ZWFyLCAxMCk7XG4gICAgbW9udGggPSBwYXJzZUludChpbmZvLm1vbnRoLCAxMCkgLSAxO1xuICAgIGRheSA9IHBhcnNlSW50KGluZm8uZGF5LCAxMCk7XG4gICAgaWYgKGluZm8uaG91ciA9PSBudWxsKSB7XG4gICAgICBkYXRlID0gbmV3IERhdGUoRGF0ZS5VVEMoeWVhciwgbW9udGgsIGRheSkpO1xuICAgICAgcmV0dXJuIGRhdGU7XG4gICAgfVxuICAgIGhvdXIgPSBwYXJzZUludChpbmZvLmhvdXIsIDEwKTtcbiAgICBtaW51dGUgPSBwYXJzZUludChpbmZvLm1pbnV0ZSwgMTApO1xuICAgIHNlY29uZCA9IHBhcnNlSW50KGluZm8uc2Vjb25kLCAxMCk7XG4gICAgaWYgKGluZm8uZnJhY3Rpb24gIT0gbnVsbCkge1xuICAgICAgZnJhY3Rpb24gPSBpbmZvLmZyYWN0aW9uLnNsaWNlKDAsIDMpO1xuICAgICAgd2hpbGUgKGZyYWN0aW9uLmxlbmd0aCA8IDMpIHtcbiAgICAgICAgZnJhY3Rpb24gKz0gJzAnO1xuICAgICAgfVxuICAgICAgZnJhY3Rpb24gPSBwYXJzZUludChmcmFjdGlvbiwgMTApO1xuICAgIH0gZWxzZSB7XG4gICAgICBmcmFjdGlvbiA9IDA7XG4gICAgfVxuICAgIGlmIChpbmZvLnR6ICE9IG51bGwpIHtcbiAgICAgIHR6X2hvdXIgPSBwYXJzZUludChpbmZvLnR6X2hvdXIsIDEwKTtcbiAgICAgIGlmIChpbmZvLnR6X21pbnV0ZSAhPSBudWxsKSB7XG4gICAgICAgIHR6X21pbnV0ZSA9IHBhcnNlSW50KGluZm8udHpfbWludXRlLCAxMCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0el9taW51dGUgPSAwO1xuICAgICAgfVxuICAgICAgdHpfb2Zmc2V0ID0gKHR6X2hvdXIgKiA2MCArIHR6X21pbnV0ZSkgKiA2MDAwMDtcbiAgICAgIGlmICgnLScgPT09IGluZm8udHpfc2lnbikge1xuICAgICAgICB0el9vZmZzZXQgKj0gLTE7XG4gICAgICB9XG4gICAgfVxuICAgIGRhdGUgPSBuZXcgRGF0ZShEYXRlLlVUQyh5ZWFyLCBtb250aCwgZGF5LCBob3VyLCBtaW51dGUsIHNlY29uZCwgZnJhY3Rpb24pKTtcbiAgICBpZiAodHpfb2Zmc2V0KSB7XG4gICAgICBkYXRlLnNldFRpbWUoZGF0ZS5nZXRUaW1lKCkgKyB0el9vZmZzZXQpO1xuICAgIH1cbiAgICByZXR1cm4gZGF0ZTtcbiAgfTtcblxuICBVdGlscy5zdHJSZXBlYXQgPSBmdW5jdGlvbihzdHIsIG51bWJlcikge1xuICAgIHZhciBpLCByZXM7XG4gICAgcmVzID0gJyc7XG4gICAgaSA9IDA7XG4gICAgd2hpbGUgKGkgPCBudW1iZXIpIHtcbiAgICAgIHJlcyArPSBzdHI7XG4gICAgICBpKys7XG4gICAgfVxuICAgIHJldHVybiByZXM7XG4gIH07XG5cbiAgVXRpbHMuZ2V0U3RyaW5nRnJvbUZpbGUgPSBmdW5jdGlvbihwYXRoLCBjYWxsYmFjaykge1xuICAgIHZhciBkYXRhLCBmcywgbmFtZSwgcmVxLCB4aHIsIF9pLCBfbGVuLCBfcmVmO1xuICAgIGlmIChjYWxsYmFjayA9PSBudWxsKSB7XG4gICAgICBjYWxsYmFjayA9IG51bGw7XG4gICAgfVxuICAgIHhociA9IG51bGw7XG4gICAgaWYgKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgJiYgd2luZG93ICE9PSBudWxsKSB7XG4gICAgICBpZiAod2luZG93LlhNTEh0dHBSZXF1ZXN0KSB7XG4gICAgICAgIHhociA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuICAgICAgfSBlbHNlIGlmICh3aW5kb3cuQWN0aXZlWE9iamVjdCkge1xuICAgICAgICBfcmVmID0gW1wiTXN4bWwyLlhNTEhUVFAuNi4wXCIsIFwiTXN4bWwyLlhNTEhUVFAuMy4wXCIsIFwiTXN4bWwyLlhNTEhUVFBcIiwgXCJNaWNyb3NvZnQuWE1MSFRUUFwiXTtcbiAgICAgICAgZm9yIChfaSA9IDAsIF9sZW4gPSBfcmVmLmxlbmd0aDsgX2kgPCBfbGVuOyBfaSsrKSB7XG4gICAgICAgICAgbmFtZSA9IF9yZWZbX2ldO1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICB4aHIgPSBuZXcgQWN0aXZlWE9iamVjdChuYW1lKTtcbiAgICAgICAgICB9IGNhdGNoIChfZXJyb3IpIHt9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKHhociAhPSBudWxsKSB7XG4gICAgICBpZiAoY2FsbGJhY2sgIT0gbnVsbCkge1xuICAgICAgICB4aHIub25yZWFkeXN0YXRlY2hhbmdlID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgaWYgKHhoci5yZWFkeVN0YXRlID09PSA0KSB7XG4gICAgICAgICAgICBpZiAoeGhyLnN0YXR1cyA9PT0gMjAwIHx8IHhoci5zdGF0dXMgPT09IDApIHtcbiAgICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKHhoci5yZXNwb25zZVRleHQpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKG51bGwpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgeGhyLm9wZW4oJ0dFVCcsIHBhdGgsIHRydWUpO1xuICAgICAgICByZXR1cm4geGhyLnNlbmQobnVsbCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB4aHIub3BlbignR0VUJywgcGF0aCwgZmFsc2UpO1xuICAgICAgICB4aHIuc2VuZChudWxsKTtcbiAgICAgICAgaWYgKHhoci5zdGF0dXMgPT09IDIwMCB8fCB4aHIuc3RhdHVzID09PSAwKSB7XG4gICAgICAgICAgcmV0dXJuIHhoci5yZXNwb25zZVRleHQ7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHJlcSA9IHJlcXVpcmU7XG4gICAgICBmcyA9IHJlcSgnZnMnKTtcbiAgICAgIGlmIChjYWxsYmFjayAhPSBudWxsKSB7XG4gICAgICAgIHJldHVybiBmcy5yZWFkRmlsZShwYXRoLCBmdW5jdGlvbihlcnIsIGRhdGEpIHtcbiAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICByZXR1cm4gY2FsbGJhY2sobnVsbCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayhTdHJpbmcoZGF0YSkpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBkYXRhID0gZnMucmVhZEZpbGVTeW5jKHBhdGgpO1xuICAgICAgICBpZiAoZGF0YSAhPSBudWxsKSB7XG4gICAgICAgICAgcmV0dXJuIFN0cmluZyhkYXRhKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH1cbiAgICB9XG4gIH07XG5cbiAgcmV0dXJuIFV0aWxzO1xuXG59KSgpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFV0aWxzO1xuIiwiLy8gR2VuZXJhdGVkIGJ5IENvZmZlZVNjcmlwdCAxLjguMFxudmFyIER1bXBlciwgUGFyc2VyLCBVdGlscywgWWFtbDtcblxuUGFyc2VyID0gcmVxdWlyZSgnLi9QYXJzZXInKTtcblxuRHVtcGVyID0gcmVxdWlyZSgnLi9EdW1wZXInKTtcblxuVXRpbHMgPSByZXF1aXJlKCcuL1V0aWxzJyk7XG5cbllhbWwgPSAoZnVuY3Rpb24oKSB7XG4gIGZ1bmN0aW9uIFlhbWwoKSB7fVxuXG4gIFlhbWwucGFyc2UgPSBmdW5jdGlvbihpbnB1dCwgZXhjZXB0aW9uT25JbnZhbGlkVHlwZSwgb2JqZWN0RGVjb2Rlcikge1xuICAgIGlmIChleGNlcHRpb25PbkludmFsaWRUeXBlID09IG51bGwpIHtcbiAgICAgIGV4Y2VwdGlvbk9uSW52YWxpZFR5cGUgPSBmYWxzZTtcbiAgICB9XG4gICAgaWYgKG9iamVjdERlY29kZXIgPT0gbnVsbCkge1xuICAgICAgb2JqZWN0RGVjb2RlciA9IG51bGw7XG4gICAgfVxuICAgIHJldHVybiBuZXcgUGFyc2VyKCkucGFyc2UoaW5wdXQsIGV4Y2VwdGlvbk9uSW52YWxpZFR5cGUsIG9iamVjdERlY29kZXIpO1xuICB9O1xuXG4gIFlhbWwucGFyc2VGaWxlID0gZnVuY3Rpb24ocGF0aCwgY2FsbGJhY2ssIGV4Y2VwdGlvbk9uSW52YWxpZFR5cGUsIG9iamVjdERlY29kZXIpIHtcbiAgICB2YXIgaW5wdXQ7XG4gICAgaWYgKGNhbGxiYWNrID09IG51bGwpIHtcbiAgICAgIGNhbGxiYWNrID0gbnVsbDtcbiAgICB9XG4gICAgaWYgKGV4Y2VwdGlvbk9uSW52YWxpZFR5cGUgPT0gbnVsbCkge1xuICAgICAgZXhjZXB0aW9uT25JbnZhbGlkVHlwZSA9IGZhbHNlO1xuICAgIH1cbiAgICBpZiAob2JqZWN0RGVjb2RlciA9PSBudWxsKSB7XG4gICAgICBvYmplY3REZWNvZGVyID0gbnVsbDtcbiAgICB9XG4gICAgaWYgKGNhbGxiYWNrICE9IG51bGwpIHtcbiAgICAgIHJldHVybiBVdGlscy5nZXRTdHJpbmdGcm9tRmlsZShwYXRoLCAoZnVuY3Rpb24oX3RoaXMpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKGlucHV0KSB7XG4gICAgICAgICAgdmFyIHJlc3VsdDtcbiAgICAgICAgICByZXN1bHQgPSBudWxsO1xuICAgICAgICAgIGlmIChpbnB1dCAhPSBudWxsKSB7XG4gICAgICAgICAgICByZXN1bHQgPSBfdGhpcy5wYXJzZShpbnB1dCwgZXhjZXB0aW9uT25JbnZhbGlkVHlwZSwgb2JqZWN0RGVjb2Rlcik7XG4gICAgICAgICAgfVxuICAgICAgICAgIGNhbGxiYWNrKHJlc3VsdCk7XG4gICAgICAgIH07XG4gICAgICB9KSh0aGlzKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlucHV0ID0gVXRpbHMuZ2V0U3RyaW5nRnJvbUZpbGUocGF0aCk7XG4gICAgICBpZiAoaW5wdXQgIT0gbnVsbCkge1xuICAgICAgICByZXR1cm4gdGhpcy5wYXJzZShpbnB1dCwgZXhjZXB0aW9uT25JbnZhbGlkVHlwZSwgb2JqZWN0RGVjb2Rlcik7XG4gICAgICB9XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gIH07XG5cbiAgWWFtbC5kdW1wID0gZnVuY3Rpb24oaW5wdXQsIGlubGluZSwgaW5kZW50LCBleGNlcHRpb25PbkludmFsaWRUeXBlLCBvYmplY3RFbmNvZGVyKSB7XG4gICAgdmFyIHlhbWw7XG4gICAgaWYgKGlubGluZSA9PSBudWxsKSB7XG4gICAgICBpbmxpbmUgPSAyO1xuICAgIH1cbiAgICBpZiAoaW5kZW50ID09IG51bGwpIHtcbiAgICAgIGluZGVudCA9IDQ7XG4gICAgfVxuICAgIGlmIChleGNlcHRpb25PbkludmFsaWRUeXBlID09IG51bGwpIHtcbiAgICAgIGV4Y2VwdGlvbk9uSW52YWxpZFR5cGUgPSBmYWxzZTtcbiAgICB9XG4gICAgaWYgKG9iamVjdEVuY29kZXIgPT0gbnVsbCkge1xuICAgICAgb2JqZWN0RW5jb2RlciA9IG51bGw7XG4gICAgfVxuICAgIHlhbWwgPSBuZXcgRHVtcGVyKCk7XG4gICAgeWFtbC5pbmRlbnRhdGlvbiA9IGluZGVudDtcbiAgICByZXR1cm4geWFtbC5kdW1wKGlucHV0LCBpbmxpbmUsIDAsIGV4Y2VwdGlvbk9uSW52YWxpZFR5cGUsIG9iamVjdEVuY29kZXIpO1xuICB9O1xuXG4gIFlhbWwucmVnaXN0ZXIgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgcmVxdWlyZV9oYW5kbGVyO1xuICAgIHJlcXVpcmVfaGFuZGxlciA9IGZ1bmN0aW9uKG1vZHVsZSwgZmlsZW5hbWUpIHtcbiAgICAgIHJldHVybiBtb2R1bGUuZXhwb3J0cyA9IFlBTUwucGFyc2VGaWxlKGZpbGVuYW1lKTtcbiAgICB9O1xuICAgIGlmICgodHlwZW9mIHJlcXVpcmUgIT09IFwidW5kZWZpbmVkXCIgJiYgcmVxdWlyZSAhPT0gbnVsbCA/IHJlcXVpcmUuZXh0ZW5zaW9ucyA6IHZvaWQgMCkgIT0gbnVsbCkge1xuICAgICAgcmVxdWlyZS5leHRlbnNpb25zWycueW1sJ10gPSByZXF1aXJlX2hhbmRsZXI7XG4gICAgICByZXR1cm4gcmVxdWlyZS5leHRlbnNpb25zWycueWFtbCddID0gcmVxdWlyZV9oYW5kbGVyO1xuICAgIH1cbiAgfTtcblxuICBZYW1sLnN0cmluZ2lmeSA9IGZ1bmN0aW9uKGlucHV0LCBpbmxpbmUsIGluZGVudCwgZXhjZXB0aW9uT25JbnZhbGlkVHlwZSwgb2JqZWN0RW5jb2Rlcikge1xuICAgIHJldHVybiB0aGlzLmR1bXAoaW5wdXQsIGlubGluZSwgaW5kZW50LCBleGNlcHRpb25PbkludmFsaWRUeXBlLCBvYmplY3RFbmNvZGVyKTtcbiAgfTtcblxuICBZYW1sLmxvYWQgPSBmdW5jdGlvbihwYXRoLCBjYWxsYmFjaywgZXhjZXB0aW9uT25JbnZhbGlkVHlwZSwgb2JqZWN0RGVjb2Rlcikge1xuICAgIHJldHVybiB0aGlzLnBhcnNlRmlsZShwYXRoLCBjYWxsYmFjaywgZXhjZXB0aW9uT25JbnZhbGlkVHlwZSwgb2JqZWN0RGVjb2Rlcik7XG4gIH07XG5cbiAgcmV0dXJuIFlhbWw7XG5cbn0pKCk7XG5cbmlmICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiICYmIHdpbmRvdyAhPT0gbnVsbCkge1xuICB3aW5kb3cuWUFNTCA9IFlhbWw7XG59XG5cbmlmICh0eXBlb2Ygd2luZG93ID09PSBcInVuZGVmaW5lZFwiIHx8IHdpbmRvdyA9PT0gbnVsbCkge1xuICB0aGlzLllBTUwgPSBZYW1sO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFlhbWw7XG4iLCJpbXBvcnQgVHJlZU5vZGUgZnJvbSAnLi9qcy9UcmVlTm9kZS5qcyc7XG5pbXBvcnQgKiBhcyB1dGlscyBmcm9tICcuL2pzL1V0aWwuanMnO1xuaW1wb3J0IHBhcnNlTGlzdCBmcm9tICcuL2pzL1BhcnNlci5qcyc7XG5cbnZhciBZQU1MID0gcmVxdWlyZSgneWFtbGpzJyk7XG5cbnZhciB2bSA9IG5ldyBWdWUoe1xuICAgIGVsOiAnLmNvbnRlbnQnLFxuICAgIGRhdGE6IHtcbiAgICAgICAgc291cmNlQ29kZTogJ1NvbWV0aGluZyBzb21ldGhpbmcnLFxuICAgICAgICBjdXJyZW50VHJlZTogdW5kZWZpbmVkXG4gICAgfSxcbiAgICBtZXRob2RzOiB7XG4gICAgICAgIHBhcnNlU291cmNlOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIlBhcnNpbmcuLi5cIik7XG5cbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgLy92YXIgcGFyc2VkID0gWUFNTC5wYXJzZSh0aGlzLnNvdXJjZUNvZGUpO1xuICAgICAgICAgICAgICAgIHZhciBwYXJzZWQgPSBwYXJzZUxpc3QodGhpcy5zb3VyY2VDb2RlKTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiV29vcHMhIEVycm9yIHBhcnNpbmdcIik7XG5cbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cblxuICAgICAgICAgICAgaWYgKHBhcnNlZC5sZW5ndGggPT0gMCkgcmV0dXJuO1xuICAgICAgICAgICAgcGFyc2VkID0gcGFyc2VkLmNoaWxkcmVuWzBdO1xuXG4gICAgICAgICAgICB2bS5jdXJyZW50VHJlZSA9IHRoaXMucGFyc2VPYmplY3RCcmFuY2gocGFyc2VkLCB0cnVlKTtcbiAgICAgICAgICAgIHZtLnJlZ2VuZXJhdGVEaWFncmFtKCk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgcGFyc2VPYmplY3RCcmFuY2g6IGZ1bmN0aW9uIChicmFuY2gsIGlzUm9vdCA9IGZhbHNlKSB7XG4gICAgICAgICAgICB2YXIgYnJhbmNoTGFiZWwgPSBicmFuY2gubGFiZWw7XG4gICAgICAgICAgICB2YXIgYnJhbmNoQ2hpbGRyZW4gPSBicmFuY2guY2hpbGRyZW47XG5cbiAgICAgICAgICAgIHZhciBub2RlID0gbmV3IFRyZWVOb2RlKGJyYW5jaExhYmVsLCBpc1Jvb3QpO1xuXG4gICAgICAgICAgICBmb3IgKHZhciBjaGlsZCBvZiBicmFuY2hDaGlsZHJlbikge1xuICAgICAgICAgICAgICAgIG5vZGUuYWRkQ2hpbGQodGhpcy5wYXJzZU9iamVjdEJyYW5jaChjaGlsZCwgZmFsc2UpKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIG5vZGU7XG4gICAgICAgIH0sXG5cbiAgICAgICAgcmVnZW5lcmF0ZURpYWdyYW06IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBjYW52YXMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNhbnZhc1wiKTtcbiAgICAgICAgICAgIHZhciBjdHggPSBjYW52YXMuZ2V0Q29udGV4dChcIjJkXCIpO1xuXG4gICAgICAgICAgICAvLyBSZXNpemUgY2FudmFzIHRvIHRoZSBhdmFpbGFibGUgc2l6ZVxuICAgICAgICAgICAgY2FudmFzLndpZHRoID0gY2FudmFzLmNsaWVudFdpZHRoO1xuICAgICAgICAgICAgY2FudmFzLmhlaWdodCA9IGNhbnZhcy5jbGllbnRIZWlnaHQ7XG5cbiAgICAgICAgICAgIGlmICghKHRoaXMuY3VycmVudFRyZWUgaW5zdGFuY2VvZiBUcmVlTm9kZSkpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIk5vdCBhIHZhbGlkIHRyZWVcIiwgdGhpcy5jdXJyZW50VHJlZSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgc2hpdCA9IHRoaXMuY3VycmVudFRyZWUuZHJhdygpO1xuICAgICAgICAgICAgY2FudmFzLndpZHRoID0gc2hpdC53aWR0aCArIDI1O1xuICAgICAgICAgICAgY2FudmFzLmhlaWdodCA9IHNoaXQuaGVpZ2h0ICsgMjU7XG5cbiAgICAgICAgICAgIGN0eC5kcmF3SW1hZ2Uoc2hpdCwgMjUsIDI1KTtcbiAgICAgICAgfVxuICAgIH1cbn0pO1xuXG4vL3dpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdyZXNpemUnLCB2bS5yZWdlbmVyYXRlRGlhZ3JhbSk7XG5cbnZtLnNvdXJjZUNvZGUgPVxuICAgIGAtIFByb2dyYW1taW5nXG5zb21ldGhpbmcgSSBsb3ZlXG4gIC0gV2ViIERldmVsb3BtZW50XG4gICAgLSBGcm9udC1lbmQgZGV2ZWxvcG1lbnRcbihzdHVmZiBmb3IgdGhlIGJyb3dzZXJzKVxuICAgICAgLSBMYW5ndWFnZXNcbiAgICAgICAgLSBIVE1MXG4gICAgICAgIC0gQ1NTXG4gICAgICAgIC0gSmF2YVNjcmlwdFxuICAgICAgLSBUb29sc1xuICAgICAgICAtIEJvb3RzdHJhcFxuICAgIC0gQmFjay1lbmQgZGV2ZWxvcG1lbnRcbihzdHVmZiBmb3IgdGhlIHNlcnZlcilcbiAgICAgIC0gTGFuZ3VhZ2VzXG4gICAgICAgIC0gUEhQXG4gICAgICAgIC0gUHl0aG9uXG4gICAgICAtIEZyYW1ld29ya3NcbiAgICAgICAgLSBEamFuZ29cbiAgICAgICAgLSBTeW1waG9ueVxuICAtIERlc2t0b3AgZGV2ZWxvcG1lbnQsXG53aGljaCBpcyBzb21ldGhpbmcgcHJldHR5IGhhcmQgdGhhdFxubW9zdCB3ZWIgZGV2ZWxvcGVycyBjYW4ndCBkb1xuICAtIE1vYmlsZSBkZXZlbG9wbWVudFxuICAgIC0gQW5kcm9pZFxuICAgIC0gaU9TXG4gICAgLSBTb21lIG90aGVyIHN0dWZmXG5ubyBvbmUgY2FyZXMgYWJvdXRcbiAgICAtIExPTFdBVFxuYDtcblxudm0uJHdhdGNoKCdzb3VyY2VDb2RlJywgZnVuY3Rpb24gKHNvdXJjZUNvZGUpIHtcbiAgICB2bS5wYXJzZVNvdXJjZSgpO1xufSk7XG5cbnZhciBtYXhEZXB0aCA9IDQ7XG52YXIgbWF4Q2hpbGRyZW4gPSA1O1xuXG5cbnZhciBnZW5lcmF0ZVJhbmRvbUNoaWxkcmVuID0gZnVuY3Rpb24gKG5vZGUsIGRlcHRoID0gMCkge1xuICAgIGlmIChkZXB0aCA9PSBtYXhEZXB0aCkgcmV0dXJuO1xuXG4gICAgdmFyIG51bUNoaWxkcmVuID0gdXRpbHMuZ2V0UmFuZG9tSW50KDAsIG1heENoaWxkcmVuKTtcblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbnVtQ2hpbGRyZW47ICsraSkge1xuICAgICAgICAvL3ZhciBjaGlsZCA9IG5ldyBUcmVlTm9kZShcIkNoXCIgKyBpICsgXCJkXCIgKyBkZXB0aCk7XG4gICAgICAgIHZhciBjaGlsZCA9IG5ldyBUcmVlTm9kZSh1dGlscy5nZXRMb3JlbUlwc3VtKDMpKTtcbiAgICAgICAgZ2VuZXJhdGVSYW5kb21DaGlsZHJlbihjaGlsZCwgZGVwdGggKyAxKTtcbiAgICAgICAgbm9kZS5hZGRDaGlsZChjaGlsZCk7XG4gICAgfVxufTtcblxuLy9nZW5lcmF0ZVJhbmRvbUNoaWxkcmVuKHJvb3QpO1xuXG5cbi8vdmFyIGEgPSBuZXcgVHJlZU5vZGUoJ0hpam8gMScpO1xuLy92YXIgYiA9IG5ldyBUcmVlTm9kZSgnSGlqbyAyJyk7XG4vL3ZhciBjID0gbmV3IFRyZWVOb2RlKCdIaWpvIDMnKTtcbi8vXG4vL3Jvb3QuYWRkQ2hpbGRyZW4oYSwgYiwgYyk7XG4vL1xuLy9hLmFkZENoaWxkcmVuKFxuLy8gICAgbmV3IFRyZWVOb2RlKCdTdWJoIDEuMScpLFxuLy8gICAgbmV3IFRyZWVOb2RlKCdTdWJoIDEuMicpLFxuLy8gICAgbmV3IFRyZWVOb2RlKCdTdWJoIDEuMycpLFxuLy8gICAgbmV3IFRyZWVOb2RlKCdTdWJoIDEuNCcpXG4vLyk7XG4vL1xuLy9iLmFkZENoaWxkcmVuKFxuLy8gICAgbmV3IFRyZWVOb2RlKCdTdWJoIDIuMScpLFxuLy8gICAgbmV3IFRyZWVOb2RlKCdTdWJoIDIuMicpLFxuLy8gICAgbmV3IFRyZWVOb2RlKCdTdWJoIDIuMicpLFxuLy8gICAgbmV3IFRyZWVOb2RlKCdTdWJoIDIuMicpLFxuLy8gICAgbmV3IFRyZWVOb2RlKCdTdWJoIDIuMicpLFxuLy8gICAgbmV3IFRyZWVOb2RlKCdTdWJoIDIuMicpLFxuLy8gICAgbmV3IFRyZWVOb2RlKCdTdWJoIDIuMicpLFxuLy8gICAgbmV3IFRyZWVOb2RlKCdTdWJoIDIuMicpLFxuLy8gICAgbmV3IFRyZWVOb2RlKCdTdWJoIDIuMicpLFxuLy8gICAgbmV3IFRyZWVOb2RlKCdTdWJoIDIuMycpXG4vLyk7XG5cbi8vdm0uY3VycmVudFRyZWUgPSByb290O1xudm0ucGFyc2VTb3VyY2UoKTtcbi8vdm0ucmVnZW5lcmF0ZURpYWdyYW0oKTsiLCJcInVzZSBzdHJpY3RcIjtcblxudmFyIHV0aWwgPSByZXF1aXJlKCd1dGlsJyk7XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIHBhcnNlTGlzdCh0ZXh0KSB7XG4gICAgdmFyIGl0ZW1zID0geydsYWJlbCc6ICdST09UJywgJ2NoaWxkcmVuJzogW10sICdkZXB0aCc6IC0xfTtcbiAgICB2YXIgbGluZXMgPSB0ZXh0LnNwbGl0KFwiXFxuXCIpO1xuICAgIGxpbmVzID0gbGluZXMuZmlsdGVyKGMgPT4gIWMubWF0Y2goL15cXHMqJC8pKTsgLy8gUmVtb3ZlIGJsYW5rIGxpbmVzXG5cbiAgICB2YXIgY3VycmVudFBhcmVudCA9IGl0ZW1zO1xuICAgIHZhciBjdXJyZW50UGFyZW50RGVwdGggPSAtMTtcblxuICAgIHZhciBjdXJyZW50SXRlbUxhYmVsID0gXCJcIjtcbiAgICB2YXIgY3VycmVudEl0ZW1EZXB0aDtcblxuICAgIGZvciAodmFyIGxpbmUgb2YgbGluZXMpIHtcbiAgICAgICAgdmFyIGl0ZW1NYXRjaCA9IGxpbmUubWF0Y2goL14oICopLVxccyooLiopJC8pO1xuXG4gICAgICAgIC8vIE5ldyBpdGVtXG4gICAgICAgIGlmIChpdGVtTWF0Y2gpIHtcbiAgICAgICAgICAgIC8vIFN0b3JlIHByZXZpb3VzIGl0ZW0gKGlmIGFueSlcbiAgICAgICAgICAgIGlmIChjdXJyZW50SXRlbUxhYmVsICE9IFwiXCIpIHtcblxuICAgICAgICAgICAgICAgIC8vIEJ1aWxkIHRoZSBub2RlIGZvciB0aGUgcHJldmlvdXNseSByZWFkIG5vZGVcbiAgICAgICAgICAgICAgICB2YXIgbm9kZSA9IHtcbiAgICAgICAgICAgICAgICAgICAgJ2xhYmVsJzogY3VycmVudEl0ZW1MYWJlbCxcbiAgICAgICAgICAgICAgICAgICAgJ2NoaWxkcmVuJzogW10sXG4gICAgICAgICAgICAgICAgICAgICdwYXJlbnQnOiBjdXJyZW50UGFyZW50LFxuICAgICAgICAgICAgICAgICAgICAnZGVwdGgnOiBjdXJyZW50SXRlbURlcHRoXG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIC8vIFN0b3JlIHRoZSBub2RlIHdpdGhpbiBpdHMgcGFyZW50XG4gICAgICAgICAgICAgICAgY3VycmVudFBhcmVudFsnY2hpbGRyZW4nXS5wdXNoKG5vZGUpO1xuXG4gICAgICAgICAgICAgICAgLy8gU2V0IHRoZSBuZXcgXCJwYXJlbnRcIiB0byB0aGUgcHJldmlvdXMgaXRlbVxuICAgICAgICAgICAgICAgIGN1cnJlbnRQYXJlbnQgPSBub2RlO1xuICAgICAgICAgICAgICAgIGN1cnJlbnRQYXJlbnREZXB0aCA9IG5vZGUuZGVwdGg7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIEZldGNoIHRoZSBkYXRhIGZyb20gdGhlIG5ld2x5LXJlYWQgaXRlbVxuICAgICAgICAgICAgY3VycmVudEl0ZW1EZXB0aCA9IGl0ZW1NYXRjaFsxXS5sZW5ndGg7XG4gICAgICAgICAgICBjdXJyZW50SXRlbUxhYmVsID0gaXRlbU1hdGNoWzJdO1xuXG4gICAgICAgICAgICAvLyBJZiB0aGUgcGFyZW50IGlzIGRlZXBlciB0aGFuIHRoZSBuZXcgaXRlbSwgc3dpdGNoIHRoZSBwYXJlbnRcbiAgICAgICAgICAgIC8vIHRvIG9uZSB3aXRoIGxvd2VyIGRlcHRoIHRoYW4gY3VycmVudCBpdGVtXG4gICAgICAgICAgICB3aGlsZSAoY3VycmVudEl0ZW1EZXB0aCA8PSBjdXJyZW50UGFyZW50RGVwdGgpIHtcbiAgICAgICAgICAgICAgICBjdXJyZW50UGFyZW50ID0gY3VycmVudFBhcmVudFsncGFyZW50J107XG4gICAgICAgICAgICAgICAgY3VycmVudFBhcmVudERlcHRoID0gY3VycmVudFBhcmVudFsnZGVwdGgnXTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICB9XG4gICAgICAgIC8vIENvbnRpbnVlZCBzdHJpbmcgZnJvbSBwcmV2aW91cyBpdGVtXG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgY3VycmVudEl0ZW1MYWJlbCArPSBcIlxcblwiICsgbGluZTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIEZvcmNlIGluc2VydCBsYXN0IGl0ZW1cbiAgICBpZiAoY3VycmVudEl0ZW1MYWJlbCkge1xuICAgICAgICB2YXIgbm9kZSA9IHtcbiAgICAgICAgICAgICdsYWJlbCc6IGN1cnJlbnRJdGVtTGFiZWwsXG4gICAgICAgICAgICAnY2hpbGRyZW4nOiBbXSxcbiAgICAgICAgICAgICdwYXJlbnQnOiBjdXJyZW50UGFyZW50LFxuICAgICAgICAgICAgJ2RlcHRoJzogY3VycmVudFBhcmVudERlcHRoICsgMVxuICAgICAgICB9O1xuICAgICAgICBjdXJyZW50UGFyZW50WydjaGlsZHJlbiddLnB1c2gobm9kZSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGl0ZW1zO1xufVxuXG4vL3ZhciBzb3VyY2VDb2RlID1cbi8vYC0gUHJvZ3JhbW1pbmc6XG4vLyAgLSBXZWIgRGV2ZWxvcG1lbnQ6XG4vL1xuLy8gICAgLSBGcm9udC1lbmQgZGV2ZWxvcG1lbnQ6XG4vLyAgICAgIC0gTGFuZ3VhZ2VzOlxuLy8gICAgICAgIC0gSFRNTFxuLy8gICAgICAgIHkgcGVuZXNcbi8vICAgICAgICB5IHZhZ2luYXNcbi8vICAgICAgICAtIENTU1xuLy8gICAgICAgIC0gSmF2YVNjcmlwdFxuLy8gICAgICAtIFRvb2xzOlxuLy8gICAgICAgIC0gQm9vdHN0cmFwXG4vLyAgICAtIEJhY2stZW5kIGRldmVsb3BtZW50OlxuLy8gICAgICAtIExhbmd1YWdlczpcbi8vICAgICAgICAtIFBIUFxuLy8gICAgICAgIC0gUHl0aG9uXG4vLyAgICAgIC0gRnJhbWV3b3Jrczpcbi8vICAgICAgICAtIERqYW5nb1xuLy8gICAgICAgIC0gU3ltcGhvbnlcbi8vICAtIERlc2t0b3AgZGV2ZWxvcG1lbnRcbi8vICAtIE1vYmlsZSBkZXZlbG9wbWVudDpcbi8vICAgIC0gQW5kcm9pZFxuLy8gICAgLSBpT1Ncbi8vICAgIC0gU29tZSBvdGhlciBzdHVmZiBubyBvbmUgY2FyZXMgYWJvdXRcbi8vYDtcbi8vXG4vL1xuLy9jb25zb2xlLmxvZyh1dGlsLmluc3BlY3QocGFyc2VMaXN0KHNvdXJjZUNvZGUpLCBmYWxzZSwgbnVsbCwgdHJ1ZSkpOyIsImltcG9ydCAqIGFzIHV0aWxzIGZyb20gJy4vVXRpbC5qcyc7XG5cbnZhciBjb25uZWN0b3JXaWR0aCA9IDUwO1xudmFyIGNvbm5lY3RvclN0ZWVwbmVzcyA9IDAuODtcbnZhciBjb25uZWN0b3JMaW5lV2lkdGggPSA0LjU7XG5cbnZhciBmb250U2l6ZSA9IDEzO1xudmFyIGZvbnRGYW1pbHkgPSBcIk9wZW4gU2Fuc1wiO1xuXG52YXIgbGFiZWxQYWRkaW5nQm90dG9tID0gODtcbnZhciBsYWJlbFBhZGRpbmdSaWdodCA9IDVcblxudmFyIGxlYWZNYXJnaW5Ub3AgPSA1O1xudmFyIGxlYWZNYXJnaW5Cb3R0b20gPSA1O1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBUcmVlTm9kZSB7XG5cbiAgICBjb25zdHJ1Y3RvcihsYWJlbCwgaXNSb290ID0gZmFsc2UpIHtcbiAgICAgICAgdGhpcy5sYWJlbCA9IGxhYmVsO1xuICAgICAgICB0aGlzLmxhYmVsTGluZXMgPSB0aGlzLmxhYmVsLnNwbGl0KFwiXFxuXCIpO1xuICAgICAgICB0aGlzLmlzUm9vdCA9IGlzUm9vdDtcbiAgICAgICAgdGhpcy5wYXJlbnQgPSB1bmRlZmluZWQ7XG4gICAgICAgIHRoaXMuY2hpbGRyZW4gPSBbXTtcbiAgICB9XG5cbiAgICBnZXQgaXNMZWFmKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5jaGlsZHJlbi5sZW5ndGggPT0gMDtcbiAgICB9XG5cbiAgICBhZGRDaGlsZChjaGlsZCkge1xuICAgICAgICBjaGlsZC5wYXJlbnQgPSB0aGlzO1xuICAgICAgICB0aGlzLmNoaWxkcmVuLnB1c2goY2hpbGQpO1xuICAgIH1cblxuICAgIGFkZENoaWxkcmVuKC4uLmNoaWxkcmVuKSB7XG4gICAgICAgIGZvciAodmFyIGNoaWxkIG9mIGNoaWxkcmVuKSB7XG4gICAgICAgICAgICB0aGlzLmFkZENoaWxkKGNoaWxkKTtcbiAgICAgICAgfVxuICAgIH1cblxuXG4gICAgZHJhdyhjdXJyZW50QnJhbmNoQ29sb3IpIHtcbiAgICAgICAgdmFyIHRoYXQgPSB0aGlzO1xuXG4gICAgICAgIHZhciBkbCA9IGZ1bmN0aW9uICh4LCB5LCBjID0gXCIjMDBmZjAwXCIsIHcgPSAxMDApIHtcbiAgICAgICAgICAgIHRoYXQuY3R4LmZpbGxTdHlsZSA9IGM7XG4gICAgICAgICAgICB0aGF0LmN0eC5maWxsUmVjdCh4LCB5LCB3LCAxKTtcbiAgICAgICAgfTtcblxuICAgICAgICB2YXIgZHIgPSBmdW5jdGlvbiAoeCwgeSwgdywgaCwgYyA9IFwiIzAwZmYwMFwiKSB7XG4gICAgICAgICAgICB0aGF0LmN0eC5maWxsU3R5bGUgPSBjO1xuICAgICAgICAgICAgdGhhdC5jdHgucmVjdCh4LCB5LCB3LCBoKTtcbiAgICAgICAgICAgIHRoYXQuY3R4LnN0cm9rZSgpO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImNhbnZhc1wiKTtcbiAgICAgICAgdGhpcy5jdHggPSB0aGlzLmNhbnZhcy5nZXRDb250ZXh0KFwiMmRcIik7XG5cbiAgICAgICAgLy8gVGhlIHdpZHRoIG9mIHRoZSBsYWJlbCB3aWxsIGJlIHRoZSB3aWR0aCBvZiB0aGUgd2lkZXN0IGxpbmVcbiAgICAgICAgdGhpcy5jdHguZm9udCA9IGZvbnRTaXplICsgXCJweCBcIiArIGZvbnRGYW1pbHk7XG4gICAgICAgIHRoaXMubGFiZWxXaWR0aCA9IE1hdGguY2VpbChNYXRoLm1heCguLi50aGlzLmxhYmVsTGluZXMubWFwKGMgPT4gdGhpcy5jdHgubWVhc3VyZVRleHQoYykud2lkdGgpKSk7XG5cbiAgICAgICAgaWYgKHRoaXMuaXNMZWFmKSB7XG4gICAgICAgICAgICB0aGlzLmNhbnZhcy53aWR0aCA9IHRoaXMubGFiZWxXaWR0aCArIGxhYmVsUGFkZGluZ1JpZ2h0ICogMjtcbiAgICAgICAgICAgIHRoaXMuY2FudmFzLmhlaWdodCA9IGZvbnRTaXplICogKHRoaXMubGFiZWxMaW5lcy5sZW5ndGggKyAxKSArIGxlYWZNYXJnaW5Ub3AgKyBsZWFmTWFyZ2luQm90dG9tO1xuICAgICAgICAgICAgdGhpcy5jdHguZm9udCA9IGZvbnRTaXplICsgXCJweCBcIiArIGZvbnRGYW1pbHk7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMubGFiZWxMaW5lcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIHRoaXMuY3R4LmZpbGxUZXh0KHRoaXMubGFiZWxMaW5lc1tpXSwgMCwgZm9udFNpemUgKiAoaSArIDEpKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gVGhlIGFuY2hvclBvaW50IGRlZmluZXMgd2hlcmUgdGhlIGxpbmUgc2hvdWxkIHN0YXJ0XG4gICAgICAgICAgICB0aGlzLmFuY2hvclBvaW50ID0ge3g6IDAsIHk6ICh0aGlzLmxhYmVsTGluZXMubGVuZ3RoICogZm9udFNpemUpICsgbGFiZWxQYWRkaW5nQm90dG9tfTtcbiAgICAgICAgfVxuXG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgLy8gSWYgdGhpcyBpcyB0aGUgcm9vdCwgd2UgbmVlZCB0byBnZW5lcmF0ZSBhIHJhbmRvbSBjb2xvciBmb3IgZWFjaCBicmFuY2hcbiAgICAgICAgICAgIGlmICh0aGlzLmlzUm9vdCkge1xuICAgICAgICAgICAgICAgIHZhciBicmFuY2hDb2xvcnMgPSB0aGlzLmNoaWxkcmVuLm1hcChjID0+IHV0aWxzLmdlbmVyYXRlUmFuZG9tQ29sb3IoKSk7XG4gICAgICAgICAgICAgICAgdmFyIGNhbnZhc2VzID0gdGhpcy5jaGlsZHJlbi5tYXAoKGMsIGkpID0+IGMuZHJhdyhicmFuY2hDb2xvcnNbaV0pKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gT3RoZXJ3aXNlLCB1c2VkIHRoZSByZWNlaXZlZCBicmFuY2hDb2xvclxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdmFyIGNhbnZhc2VzID0gdGhpcy5jaGlsZHJlbi5tYXAoKGMsIGkpID0+IGMuZHJhdyhjdXJyZW50QnJhbmNoQ29sb3IpKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gR2V0IHRoZSB2ZXJ0aWNhbCBwb3NpdGlvbnMgZm9yIHRoZSBjaGlsZHJlblxuICAgICAgICAgICAgdmFyIHZlcnRpY2FsX3Bvc2l0aW9ucyA9IFswXTtcblxuICAgICAgICAgICAgLy8gRWFjaCBwb3NpdGlvbiBpcyB0aGUgc3VtIG9mIHRoZSBhY3VtbXVsYXRlZCBoZWlnaHRzIG9mIHRoZSBwcmV2aW91cyBlbGVtZW50c1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjYW52YXNlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIHZlcnRpY2FsX3Bvc2l0aW9uc1tpICsgMV0gPSB2ZXJ0aWNhbF9wb3NpdGlvbnNbaV0gKyBjYW52YXNlc1tpXS5oZWlnaHQ7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIENvbXB1dGUgbGVmdCBtYXJnaW4gKGxhYmVsIHdpZHRoICsgc2VwYXJhdGlvbilcbiAgICAgICAgICAgIHZhciBsZWZ0TWFyZ2luID0gMTAgKyB0aGlzLmxhYmVsV2lkdGggKyBjb25uZWN0b3JXaWR0aDtcblxuICAgICAgICAgICAgLy8gU2V0IHRoZSB3aWR0aCB0byB0aGUgbGVmdE1hcmdpbiBwbHVzIHRoZSB3aWR0aCBvZiB0aGUgd2lkZXN0IGNoaWxkIGJyYW5jaFxuICAgICAgICAgICAgdGhpcy5jYW52YXMud2lkdGggPSBsZWZ0TWFyZ2luICsgTWF0aC5tYXgoLi4uY2FudmFzZXMubWFwKGMgPT4gYy53aWR0aCkpO1xuICAgICAgICAgICAgdGhpcy5jYW52YXMuaGVpZ2h0ID0gdmVydGljYWxfcG9zaXRpb25zW2NhbnZhc2VzLmxlbmd0aF0gKyA1O1xuICAgICAgICAgICAgdGhpcy5jdHguZm9udCA9IGZvbnRTaXplICsgXCJweCBcIiArIGZvbnRGYW1pbHk7XG5cbiAgICAgICAgICAgIGlmICh0aGlzLmlzUm9vdCkge1xuICAgICAgICAgICAgICAgIHRoaXMuYW5jaG9yUG9pbnQgPSB7eDogMTAsIHk6IHRoaXMuY2FudmFzLmhlaWdodCAvIDIgKyBmb250U2l6ZSAvIDJ9O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5hbmNob3JQb2ludCA9IHt4OiAwLCB5OiB0aGlzLmNhbnZhcy5oZWlnaHQgLyAyICsgZm9udFNpemUgLyAyICsgbGFiZWxQYWRkaW5nQm90dG9tfTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjYW52YXNlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLmlzUm9vdCkge1xuICAgICAgICAgICAgICAgICAgICBjdXJyZW50QnJhbmNoQ29sb3IgPSBicmFuY2hDb2xvcnNbaV07XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdGhpcy5jdHguZHJhd0ltYWdlKGNhbnZhc2VzW2ldLCBsZWZ0TWFyZ2luLCB2ZXJ0aWNhbF9wb3NpdGlvbnNbaV0pO1xuXG4gICAgICAgICAgICAgICAgdmFyIGNvbm5lY3Rvcl9hID0ge1xuICAgICAgICAgICAgICAgICAgICB4OiB0aGlzLmFuY2hvclBvaW50LnggKyB0aGlzLmxhYmVsV2lkdGggKyBsYWJlbFBhZGRpbmdSaWdodCxcbiAgICAgICAgICAgICAgICAgICAgeTogdGhpcy5hbmNob3JQb2ludC55XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIHZhciBjb25uZWN0b3JfYiA9IHtcbiAgICAgICAgICAgICAgICAgICAgeDogbGVmdE1hcmdpbixcbiAgICAgICAgICAgICAgICAgICAgeTogdmVydGljYWxfcG9zaXRpb25zW2ldICsgdGhpcy5jaGlsZHJlbltpXS5hbmNob3JQb2ludC55XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIHRoaXMuY3R4LmJlZ2luUGF0aCgpO1xuICAgICAgICAgICAgICAgIHRoaXMuY3R4Lm1vdmVUbyhjb25uZWN0b3JfYS54LCBjb25uZWN0b3JfYS55KTtcblxuICAgICAgICAgICAgICAgIHRoaXMuY3R4LmJlemllckN1cnZlVG8oXG4gICAgICAgICAgICAgICAgICAgIGNvbm5lY3Rvcl9hLnggKyBjb25uZWN0b3JTdGVlcG5lc3MgKiBjb25uZWN0b3JXaWR0aCwgY29ubmVjdG9yX2EueSxcbiAgICAgICAgICAgICAgICAgICAgY29ubmVjdG9yX2IueCAtIGNvbm5lY3RvclN0ZWVwbmVzcyAqIGNvbm5lY3RvcldpZHRoLCBjb25uZWN0b3JfYi55LFxuICAgICAgICAgICAgICAgICAgICBjb25uZWN0b3JfYi54LCBjb25uZWN0b3JfYi55XG4gICAgICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgICAgIHRoaXMuY3R4LmxpbmVUbyhcbiAgICAgICAgICAgICAgICAgICAgY29ubmVjdG9yX2IueCArIHRoaXMuY2hpbGRyZW5baV0ubGFiZWxXaWR0aCArIGxhYmVsUGFkZGluZ1JpZ2h0LFxuICAgICAgICAgICAgICAgICAgICBjb25uZWN0b3JfYi55XG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICB0aGlzLmN0eC5saW5lV2lkdGggPSBjb25uZWN0b3JMaW5lV2lkdGg7XG4gICAgICAgICAgICAgICAgdGhpcy5jdHgubGluZUNhcCA9IFwicm91bmRcIjtcbiAgICAgICAgICAgICAgICB0aGlzLmN0eC5zdHJva2VTdHlsZSA9IGN1cnJlbnRCcmFuY2hDb2xvcjtcbiAgICAgICAgICAgICAgICB0aGlzLmN0eC5zdHJva2UoKTtcbiAgICAgICAgICAgIH1cblxuXG4gICAgICAgICAgICBpZiAodGhpcy5pc1Jvb3QpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmN0eC5maWxsU3R5bGUgPSBcIiNmZmZmZmZcIjtcbiAgICAgICAgICAgICAgICB0aGlzLmN0eC5saW5lV2lkdGggPSAzO1xuICAgICAgICAgICAgICAgIHV0aWxzLnJvdW5kUmVjdCh0aGlzLmN0eCxcbiAgICAgICAgICAgICAgICAgICAgMiwgdGhpcy5jYW52YXMuaGVpZ2h0IC8gMiAtICh0aGlzLmxhYmVsTGluZXMubGVuZ3RoKSAqIGZvbnRTaXplLFxuICAgICAgICAgICAgICAgICAgICB0aGlzLmxhYmVsV2lkdGggKyAxOCwgZm9udFNpemUgKiAodGhpcy5sYWJlbExpbmVzLmxlbmd0aCArIDEuNSksXG4gICAgICAgICAgICAgICAgICAgIDUsIHRydWUsIHRydWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5jdHguZmlsbFN0eWxlID0gXCIjMDAwMDAwXCI7XG5cbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5sYWJlbExpbmVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jdHguZmlsbFRleHQoXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubGFiZWxMaW5lc1tpXSxcbiAgICAgICAgICAgICAgICAgICAgMTAsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gRml4ZWQgbWFyZ2luIGZyb20gdGhlIGxlZnRcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jYW52YXMuaGVpZ2h0IC8gMiAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gVmVydGljYWwgY2VudGVyXG4gICAgICAgICAgICAgICAgICAgICsgZm9udFNpemUgLyAyICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIE1pZGRsZSBvZiB0aGUgbGluZSBoZWlnaHRcbiAgICAgICAgICAgICAgICAgICAgLSBmb250U2l6ZSAqICh0aGlzLmxhYmVsTGluZXMubGVuZ3RoIC0gaSAtIDEpICAgLy8gQ29ycmVjdGx5IGFjY291bnQgZm9yIG11bHRpbGluZXNcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuY2FudmFzO1xuICAgIH1cbn07XG4iLCIvKipcbiAqIERyYXdzIGEgcm91bmRlZCByZWN0YW5nbGUgdXNpbmcgdGhlIGN1cnJlbnQgc3RhdGUgb2YgdGhlIGNhbnZhcy5cbiAqIElmIHlvdSBvbWl0IHRoZSBsYXN0IHRocmVlIHBhcmFtcywgaXQgd2lsbCBkcmF3IGEgcmVjdGFuZ2xlXG4gKiBvdXRsaW5lIHdpdGggYSA1IHBpeGVsIGJvcmRlciByYWRpdXNcbiAqIEBwYXJhbSB7Q2FudmFzUmVuZGVyaW5nQ29udGV4dDJEfSBjdHhcbiAqIEBwYXJhbSB7TnVtYmVyfSB4IFRoZSB0b3AgbGVmdCB4IGNvb3JkaW5hdGVcbiAqIEBwYXJhbSB7TnVtYmVyfSB5IFRoZSB0b3AgbGVmdCB5IGNvb3JkaW5hdGVcbiAqIEBwYXJhbSB7TnVtYmVyfSB3aWR0aCBUaGUgd2lkdGggb2YgdGhlIHJlY3RhbmdsZVxuICogQHBhcmFtIHtOdW1iZXJ9IGhlaWdodCBUaGUgaGVpZ2h0IG9mIHRoZSByZWN0YW5nbGVcbiAqIEBwYXJhbSB7TnVtYmVyfSBbcmFkaXVzID0gNV0gVGhlIGNvcm5lciByYWRpdXM7IEl0IGNhbiBhbHNvIGJlIGFuIG9iamVjdFxuICogICAgICAgICAgICAgICAgIHRvIHNwZWNpZnkgZGlmZmVyZW50IHJhZGlpIGZvciBjb3JuZXJzXG4gKiBAcGFyYW0ge051bWJlcn0gW3JhZGl1cy50bCA9IDBdIFRvcCBsZWZ0XG4gKiBAcGFyYW0ge051bWJlcn0gW3JhZGl1cy50ciA9IDBdIFRvcCByaWdodFxuICogQHBhcmFtIHtOdW1iZXJ9IFtyYWRpdXMuYnIgPSAwXSBCb3R0b20gcmlnaHRcbiAqIEBwYXJhbSB7TnVtYmVyfSBbcmFkaXVzLmJsID0gMF0gQm90dG9tIGxlZnRcbiAqIEBwYXJhbSB7Qm9vbGVhbn0gW2ZpbGwgPSBmYWxzZV0gV2hldGhlciB0byBmaWxsIHRoZSByZWN0YW5nbGUuXG4gKiBAcGFyYW0ge0Jvb2xlYW59IFtzdHJva2UgPSB0cnVlXSBXaGV0aGVyIHRvIHN0cm9rZSB0aGUgcmVjdGFuZ2xlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcm91bmRSZWN0KGN0eCwgeCwgeSwgd2lkdGgsIGhlaWdodCwgcmFkaXVzLCBmaWxsLCBzdHJva2UpIHtcbiAgICBpZiAodHlwZW9mIHN0cm9rZSA9PSAndW5kZWZpbmVkJykge1xuICAgICAgICBzdHJva2UgPSB0cnVlO1xuICAgIH1cbiAgICBpZiAodHlwZW9mIHJhZGl1cyA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgcmFkaXVzID0gNTtcbiAgICB9XG4gICAgaWYgKHR5cGVvZiByYWRpdXMgPT09ICdudW1iZXInKSB7XG4gICAgICAgIHJhZGl1cyA9IHt0bDogcmFkaXVzLCB0cjogcmFkaXVzLCBicjogcmFkaXVzLCBibDogcmFkaXVzfTtcbiAgICB9IGVsc2Uge1xuICAgICAgICB2YXIgZGVmYXVsdFJhZGl1cyA9IHt0bDogMCwgdHI6IDAsIGJyOiAwLCBibDogMH07XG4gICAgICAgIGZvciAodmFyIHNpZGUgaW4gZGVmYXVsdFJhZGl1cykge1xuICAgICAgICAgICAgcmFkaXVzW3NpZGVdID0gcmFkaXVzW3NpZGVdIHx8IGRlZmF1bHRSYWRpdXNbc2lkZV07XG4gICAgICAgIH1cbiAgICB9XG4gICAgY3R4LmJlZ2luUGF0aCgpO1xuICAgIGN0eC5tb3ZlVG8oeCArIHJhZGl1cy50bCwgeSk7XG4gICAgY3R4LmxpbmVUbyh4ICsgd2lkdGggLSByYWRpdXMudHIsIHkpO1xuICAgIGN0eC5xdWFkcmF0aWNDdXJ2ZVRvKHggKyB3aWR0aCwgeSwgeCArIHdpZHRoLCB5ICsgcmFkaXVzLnRyKTtcbiAgICBjdHgubGluZVRvKHggKyB3aWR0aCwgeSArIGhlaWdodCAtIHJhZGl1cy5icik7XG4gICAgY3R4LnF1YWRyYXRpY0N1cnZlVG8oeCArIHdpZHRoLCB5ICsgaGVpZ2h0LCB4ICsgd2lkdGggLSByYWRpdXMuYnIsIHkgKyBoZWlnaHQpO1xuICAgIGN0eC5saW5lVG8oeCArIHJhZGl1cy5ibCwgeSArIGhlaWdodCk7XG4gICAgY3R4LnF1YWRyYXRpY0N1cnZlVG8oeCwgeSArIGhlaWdodCwgeCwgeSArIGhlaWdodCAtIHJhZGl1cy5ibCk7XG4gICAgY3R4LmxpbmVUbyh4LCB5ICsgcmFkaXVzLnRsKTtcbiAgICBjdHgucXVhZHJhdGljQ3VydmVUbyh4LCB5LCB4ICsgcmFkaXVzLnRsLCB5KTtcbiAgICBjdHguY2xvc2VQYXRoKCk7XG4gICAgaWYgKGZpbGwpIHtcbiAgICAgICAgY3R4LmZpbGwoKTtcbiAgICB9XG4gICAgaWYgKHN0cm9rZSkge1xuICAgICAgICBjdHguc3Ryb2tlKCk7XG4gICAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0UmFuZG9tSW50KG1pbiwgbWF4KSB7XG4gIHJldHVybiBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAobWF4IC0gbWluKSkgKyBtaW47XG59XG5cblxuZnVuY3Rpb24gY29tcG9uZW50VG9IZXgoYykge1xuICAgIHZhciBoZXggPSBjLnRvU3RyaW5nKDE2KTtcbiAgICByZXR1cm4gaGV4Lmxlbmd0aCA9PSAxID8gXCIwXCIgKyBoZXggOiBoZXg7XG59XG5cbmZ1bmN0aW9uIHJnYlRvSGV4KHIsIGcsIGIpIHtcbiAgICByZXR1cm4gXCIjXCIgKyBjb21wb25lbnRUb0hleChyKSArIGNvbXBvbmVudFRvSGV4KGcpICsgY29tcG9uZW50VG9IZXgoYik7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZW5lcmF0ZVJhbmRvbUNvbG9yKGJhc2VDb2xvciA9IFsyNTYsIDI1NiwgMjU2XSkge1xuXG4gICAgdmFyIHJlZCA9IGdldFJhbmRvbUludCgwLCAyNTYpO1xuICAgIHZhciBncmVlbiA9IGdldFJhbmRvbUludCgwLCAyNTYpO1xuICAgIHZhciBibHVlID0gZ2V0UmFuZG9tSW50KDAsIDI1Nik7XG5cbiAgICAvLyBtaXggdGhlIGNvbG9yXG5cbiAgICB2YXIgbWl4dHVyZSA9IDAuNztcblxuICAgIHJlZCA9IE1hdGgucm91bmQocmVkICogbWl4dHVyZSArIGJhc2VDb2xvclswXSAqICgxIC0gbWl4dHVyZSkpO1xuICAgIGdyZWVuID0gTWF0aC5yb3VuZChncmVlbiAqIG1peHR1cmUgKyBiYXNlQ29sb3JbMV0gKiAoMSAtIG1peHR1cmUpKTtcbiAgICBibHVlID0gTWF0aC5yb3VuZChibHVlICogbWl4dHVyZSArIGJhc2VDb2xvclsyXSAqICgxIC0gbWl4dHVyZSkpO1xuXG4gICAgLy9cbiAgICAvL3JlZCA9IE1hdGgucm91bmQoKHJlZCArIGJhc2VDb2xvclswXSkgLyAyKTtcbiAgICAvL2dyZWVuID0gTWF0aC5yb3VuZCgoZ3JlZW4gKyBiYXNlQ29sb3JbMV0pIC8gMik7XG4gICAgLy9ibHVlID0gTWF0aC5yb3VuZCgoYmx1ZSArIGJhc2VDb2xvclsyXSkgLyAyKTtcblxuICAgIHJldHVybiByZ2JUb0hleChyZWQsIGdyZWVuLCBibHVlKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldExvcmVtSXBzdW0gKG51bVdvcmRzPTUpIHtcbiAgICB2YXIgYmFzZVRleHQgPSBcIkxvcmVtIGlwc3VtIGRvbG9yIHNpdCBhbWV0LCBjb25zZWN0ZXR1ciBhZGlwaXNjaW5nIGVsaXQuIFBoYXNlbGx1cyBncmF2aWRhIGV1IGxlbyB2aXRhZSBpbXBlcmRpZXQuIE5hbSBwdWx2aW5hciBsdWN0dXMgYXJjdSwgdmVsIHNlbXBlciBsaWd1bGEgZWZmaWNpdHVyIGluLiBNYXVyaXMgbm9uIHNlbXBlciBhbnRlLiBOdWxsYW0gc2NlbGVyaXNxdWUgaGVuZHJlcml0IHVybmEsIGxhY2luaWEgZWdlc3RhcyBlbmltIGxhb3JlZXQgdml0YWUuIEFsaXF1YW0gZXJhdCB2b2x1dHBhdC4gRHVpcyBwb3N1ZXJlIG1hZ25hIGxpYmVybywgdmVsIHJob25jdXMgbmlzbCB1bGxhbWNvcnBlciBldS4gRXRpYW0gYWMgbGliZXJvIGNvbnNlY3RldHVyLCBjb25ndWUgbmlzaSBxdWlzLCB2dWxwdXRhdGUgZXJhdC5cIjtcbiAgICB2YXIgc2VudGVuY2VzID0gYmFzZVRleHQuc3BsaXQoXCIuXCIpO1xuICAgIHZhciBzZW50ZW5jZXNfd29yZHMgPSBzZW50ZW5jZXMubWFwKHMgPT4gcy5zcGxpdCgvW1xcc1xcLixdLykpO1xuXG4gICAgdmFyIGNob3NlblNlbnRlbmNlTnVtYmVyID0gZ2V0UmFuZG9tSW50KDAsIHNlbnRlbmNlcy5sZW5ndGggLSAxKTtcbiAgICB2YXIgY2hvc2VuV29yZHMgPSBzZW50ZW5jZXNfd29yZHNbY2hvc2VuU2VudGVuY2VOdW1iZXJdLnNsaWNlKDAsIG51bVdvcmRzKS5qb2luKFwiIFwiKTtcblxuICAgIHJldHVybiBjaG9zZW5Xb3Jkcztcbn1cbiJdfQ==
