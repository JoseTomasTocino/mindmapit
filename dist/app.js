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
'use strict';

var _TreeNode = require('./js/TreeNode.js');

var _TreeNode2 = _interopRequireDefault(_TreeNode);

var _Util = require('./js/Util.js');

var utils = _interopRequireWildcard(_Util);

var _Parser = require('./js/Parser.js');

var _Parser2 = _interopRequireDefault(_Parser);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var vm = new Vue({
    el: '.content',
    data: {
        sourceCode: '',
        currentTree: undefined
    },
    methods: {
        parseSource: function parseSource() {
            console.log("Parsing...");

            try {
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

            var node = new _TreeNode2.default(branch.label, isRoot);

            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = branch.children[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
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

            if (!(this.currentTree instanceof _TreeNode2.default)) {
                console.log("Not a valid tree", this.currentTree);
                return;
            }

            // Draw the map
            var beautifulDrawing = this.currentTree.draw();

            // Resize canvas to the size of the map plus some margin
            canvas.width = beautifulDrawing.width + 25;
            canvas.height = beautifulDrawing.height + 25;

            // Draw the map onto the existing canvas
            ctx.drawImage(beautifulDrawing, 25, 25);
        }
    }
});

vm.sourceCode = '- Programming\nsomething I love\n  - Web Development\n    - Front-end development\n(stuff for the browsers)\n      - Languages\n        - HTML\n        - CSS\n        - JavaScript\n      - Tools\n        - Bootstrap\n    - Back-end development\n(stuff for the server)\n      - Languages\n        - PHP\n        - Python\n      - Frameworks\n        - Django\n        - Symphony\n  - Desktop development,\nwhich is something pretty hard that\nmost web developers can\'t do\n  - Mobile development\n    - Android\n    - iOS\n    - Some other stuff\nno one cares about\n    - LOLWAT\n';

vm.$watch('sourceCode', function (sourceCode) {
    vm.parseSource();
});

setTimeout(function () {
    return vm.parseSource();
}, 250);

},{"./js/Parser.js":6,"./js/TreeNode.js":7,"./js/Util.js":8}],6:[function(require,module,exports){
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

},{"util":4}],7:[function(require,module,exports){
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

},{"./Util.js":8}],8:[function(require,module,exports){
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

},{}]},{},[5])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvaW5oZXJpdHMvaW5oZXJpdHNfYnJvd3Nlci5qcyIsIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9wcm9jZXNzL2Jyb3dzZXIuanMiLCJub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvdXRpbC9zdXBwb3J0L2lzQnVmZmVyQnJvd3Nlci5qcyIsIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy91dGlsL3V0aWwuanMiLCJzcmMvYXBwLmpzIiwic3JjL2pzL1BhcnNlci5qcyIsInNyYy9qcy9UcmVlTm9kZS5qcyIsInNyYy9qcy9VdGlsLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFD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QVMsR0FBRyxRQUFRLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQ3BDLFFBQUksZUFBZSxHQUFHLFNBQVMsQ0FBQyxHQUFHLENBQUMsVUFBQSxDQUFDO2VBQUksQ0FBQyxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUM7S0FBQSxDQUFDLENBQUM7O0FBRTdELFFBQUksb0JBQW9CLEdBQUcsWUFBWSxDQUFDLENBQUMsRUFBRSxTQUFTLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDO0FBQ2pFLFFBQUksV0FBVyxHQUFHLGVBQWUsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsUUFBUSxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDOztBQUVyRixXQUFPLFdBQVcsQ0FBQztDQUN0QiIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJpZiAodHlwZW9mIE9iamVjdC5jcmVhdGUgPT09ICdmdW5jdGlvbicpIHtcbiAgLy8gaW1wbGVtZW50YXRpb24gZnJvbSBzdGFuZGFyZCBub2RlLmpzICd1dGlsJyBtb2R1bGVcbiAgbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpbmhlcml0cyhjdG9yLCBzdXBlckN0b3IpIHtcbiAgICBjdG9yLnN1cGVyXyA9IHN1cGVyQ3RvclxuICAgIGN0b3IucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShzdXBlckN0b3IucHJvdG90eXBlLCB7XG4gICAgICBjb25zdHJ1Y3Rvcjoge1xuICAgICAgICB2YWx1ZTogY3RvcixcbiAgICAgICAgZW51bWVyYWJsZTogZmFsc2UsXG4gICAgICAgIHdyaXRhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICAgIH1cbiAgICB9KTtcbiAgfTtcbn0gZWxzZSB7XG4gIC8vIG9sZCBzY2hvb2wgc2hpbSBmb3Igb2xkIGJyb3dzZXJzXG4gIG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaW5oZXJpdHMoY3Rvciwgc3VwZXJDdG9yKSB7XG4gICAgY3Rvci5zdXBlcl8gPSBzdXBlckN0b3JcbiAgICB2YXIgVGVtcEN0b3IgPSBmdW5jdGlvbiAoKSB7fVxuICAgIFRlbXBDdG9yLnByb3RvdHlwZSA9IHN1cGVyQ3Rvci5wcm90b3R5cGVcbiAgICBjdG9yLnByb3RvdHlwZSA9IG5ldyBUZW1wQ3RvcigpXG4gICAgY3Rvci5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBjdG9yXG4gIH1cbn1cbiIsIi8vIHNoaW0gZm9yIHVzaW5nIHByb2Nlc3MgaW4gYnJvd3NlclxuXG52YXIgcHJvY2VzcyA9IG1vZHVsZS5leHBvcnRzID0ge307XG52YXIgcXVldWUgPSBbXTtcbnZhciBkcmFpbmluZyA9IGZhbHNlO1xudmFyIGN1cnJlbnRRdWV1ZTtcbnZhciBxdWV1ZUluZGV4ID0gLTE7XG5cbmZ1bmN0aW9uIGNsZWFuVXBOZXh0VGljaygpIHtcbiAgICBkcmFpbmluZyA9IGZhbHNlO1xuICAgIGlmIChjdXJyZW50UXVldWUubGVuZ3RoKSB7XG4gICAgICAgIHF1ZXVlID0gY3VycmVudFF1ZXVlLmNvbmNhdChxdWV1ZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcXVldWVJbmRleCA9IC0xO1xuICAgIH1cbiAgICBpZiAocXVldWUubGVuZ3RoKSB7XG4gICAgICAgIGRyYWluUXVldWUoKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGRyYWluUXVldWUoKSB7XG4gICAgaWYgKGRyYWluaW5nKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmFyIHRpbWVvdXQgPSBzZXRUaW1lb3V0KGNsZWFuVXBOZXh0VGljayk7XG4gICAgZHJhaW5pbmcgPSB0cnVlO1xuXG4gICAgdmFyIGxlbiA9IHF1ZXVlLmxlbmd0aDtcbiAgICB3aGlsZShsZW4pIHtcbiAgICAgICAgY3VycmVudFF1ZXVlID0gcXVldWU7XG4gICAgICAgIHF1ZXVlID0gW107XG4gICAgICAgIHdoaWxlICgrK3F1ZXVlSW5kZXggPCBsZW4pIHtcbiAgICAgICAgICAgIGlmIChjdXJyZW50UXVldWUpIHtcbiAgICAgICAgICAgICAgICBjdXJyZW50UXVldWVbcXVldWVJbmRleF0ucnVuKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcXVldWVJbmRleCA9IC0xO1xuICAgICAgICBsZW4gPSBxdWV1ZS5sZW5ndGg7XG4gICAgfVxuICAgIGN1cnJlbnRRdWV1ZSA9IG51bGw7XG4gICAgZHJhaW5pbmcgPSBmYWxzZTtcbiAgICBjbGVhclRpbWVvdXQodGltZW91dCk7XG59XG5cbnByb2Nlc3MubmV4dFRpY2sgPSBmdW5jdGlvbiAoZnVuKSB7XG4gICAgdmFyIGFyZ3MgPSBuZXcgQXJyYXkoYXJndW1lbnRzLmxlbmd0aCAtIDEpO1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID4gMSkge1xuICAgICAgICBmb3IgKHZhciBpID0gMTsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgYXJnc1tpIC0gMV0gPSBhcmd1bWVudHNbaV07XG4gICAgICAgIH1cbiAgICB9XG4gICAgcXVldWUucHVzaChuZXcgSXRlbShmdW4sIGFyZ3MpKTtcbiAgICBpZiAocXVldWUubGVuZ3RoID09PSAxICYmICFkcmFpbmluZykge1xuICAgICAgICBzZXRUaW1lb3V0KGRyYWluUXVldWUsIDApO1xuICAgIH1cbn07XG5cbi8vIHY4IGxpa2VzIHByZWRpY3RpYmxlIG9iamVjdHNcbmZ1bmN0aW9uIEl0ZW0oZnVuLCBhcnJheSkge1xuICAgIHRoaXMuZnVuID0gZnVuO1xuICAgIHRoaXMuYXJyYXkgPSBhcnJheTtcbn1cbkl0ZW0ucHJvdG90eXBlLnJ1biA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLmZ1bi5hcHBseShudWxsLCB0aGlzLmFycmF5KTtcbn07XG5wcm9jZXNzLnRpdGxlID0gJ2Jyb3dzZXInO1xucHJvY2Vzcy5icm93c2VyID0gdHJ1ZTtcbnByb2Nlc3MuZW52ID0ge307XG5wcm9jZXNzLmFyZ3YgPSBbXTtcbnByb2Nlc3MudmVyc2lvbiA9ICcnOyAvLyBlbXB0eSBzdHJpbmcgdG8gYXZvaWQgcmVnZXhwIGlzc3Vlc1xucHJvY2Vzcy52ZXJzaW9ucyA9IHt9O1xuXG5mdW5jdGlvbiBub29wKCkge31cblxucHJvY2Vzcy5vbiA9IG5vb3A7XG5wcm9jZXNzLmFkZExpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3Mub25jZSA9IG5vb3A7XG5wcm9jZXNzLm9mZiA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUxpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlQWxsTGlzdGVuZXJzID0gbm9vcDtcbnByb2Nlc3MuZW1pdCA9IG5vb3A7XG5cbnByb2Nlc3MuYmluZGluZyA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmJpbmRpbmcgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcblxucHJvY2Vzcy5jd2QgPSBmdW5jdGlvbiAoKSB7IHJldHVybiAnLycgfTtcbnByb2Nlc3MuY2hkaXIgPSBmdW5jdGlvbiAoZGlyKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmNoZGlyIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG5wcm9jZXNzLnVtYXNrID0gZnVuY3Rpb24oKSB7IHJldHVybiAwOyB9O1xuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpc0J1ZmZlcihhcmcpIHtcbiAgcmV0dXJuIGFyZyAmJiB0eXBlb2YgYXJnID09PSAnb2JqZWN0J1xuICAgICYmIHR5cGVvZiBhcmcuY29weSA9PT0gJ2Z1bmN0aW9uJ1xuICAgICYmIHR5cGVvZiBhcmcuZmlsbCA9PT0gJ2Z1bmN0aW9uJ1xuICAgICYmIHR5cGVvZiBhcmcucmVhZFVJbnQ4ID09PSAnZnVuY3Rpb24nO1xufSIsIi8vIENvcHlyaWdodCBKb3llbnQsIEluYy4gYW5kIG90aGVyIE5vZGUgY29udHJpYnV0b3JzLlxuLy9cbi8vIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhXG4vLyBjb3B5IG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlXG4vLyBcIlNvZnR3YXJlXCIpLCB0byBkZWFsIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmdcbi8vIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCxcbi8vIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXRcbi8vIHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXMgZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZVxuLy8gZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4vL1xuLy8gVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWRcbi8vIGluIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuLy9cbi8vIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1Ncbi8vIE9SIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0Zcbi8vIE1FUkNIQU5UQUJJTElUWSwgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU5cbi8vIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLFxuLy8gREFNQUdFUyBPUiBPVEhFUiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SXG4vLyBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSwgT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFXG4vLyBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFIFNPRlRXQVJFLlxuXG52YXIgZm9ybWF0UmVnRXhwID0gLyVbc2RqJV0vZztcbmV4cG9ydHMuZm9ybWF0ID0gZnVuY3Rpb24oZikge1xuICBpZiAoIWlzU3RyaW5nKGYpKSB7XG4gICAgdmFyIG9iamVjdHMgPSBbXTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgb2JqZWN0cy5wdXNoKGluc3BlY3QoYXJndW1lbnRzW2ldKSk7XG4gICAgfVxuICAgIHJldHVybiBvYmplY3RzLmpvaW4oJyAnKTtcbiAgfVxuXG4gIHZhciBpID0gMTtcbiAgdmFyIGFyZ3MgPSBhcmd1bWVudHM7XG4gIHZhciBsZW4gPSBhcmdzLmxlbmd0aDtcbiAgdmFyIHN0ciA9IFN0cmluZyhmKS5yZXBsYWNlKGZvcm1hdFJlZ0V4cCwgZnVuY3Rpb24oeCkge1xuICAgIGlmICh4ID09PSAnJSUnKSByZXR1cm4gJyUnO1xuICAgIGlmIChpID49IGxlbikgcmV0dXJuIHg7XG4gICAgc3dpdGNoICh4KSB7XG4gICAgICBjYXNlICclcyc6IHJldHVybiBTdHJpbmcoYXJnc1tpKytdKTtcbiAgICAgIGNhc2UgJyVkJzogcmV0dXJuIE51bWJlcihhcmdzW2krK10pO1xuICAgICAgY2FzZSAnJWonOlxuICAgICAgICB0cnkge1xuICAgICAgICAgIHJldHVybiBKU09OLnN0cmluZ2lmeShhcmdzW2krK10pO1xuICAgICAgICB9IGNhdGNoIChfKSB7XG4gICAgICAgICAgcmV0dXJuICdbQ2lyY3VsYXJdJztcbiAgICAgICAgfVxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgcmV0dXJuIHg7XG4gICAgfVxuICB9KTtcbiAgZm9yICh2YXIgeCA9IGFyZ3NbaV07IGkgPCBsZW47IHggPSBhcmdzWysraV0pIHtcbiAgICBpZiAoaXNOdWxsKHgpIHx8ICFpc09iamVjdCh4KSkge1xuICAgICAgc3RyICs9ICcgJyArIHg7XG4gICAgfSBlbHNlIHtcbiAgICAgIHN0ciArPSAnICcgKyBpbnNwZWN0KHgpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gc3RyO1xufTtcblxuXG4vLyBNYXJrIHRoYXQgYSBtZXRob2Qgc2hvdWxkIG5vdCBiZSB1c2VkLlxuLy8gUmV0dXJucyBhIG1vZGlmaWVkIGZ1bmN0aW9uIHdoaWNoIHdhcm5zIG9uY2UgYnkgZGVmYXVsdC5cbi8vIElmIC0tbm8tZGVwcmVjYXRpb24gaXMgc2V0LCB0aGVuIGl0IGlzIGEgbm8tb3AuXG5leHBvcnRzLmRlcHJlY2F0ZSA9IGZ1bmN0aW9uKGZuLCBtc2cpIHtcbiAgLy8gQWxsb3cgZm9yIGRlcHJlY2F0aW5nIHRoaW5ncyBpbiB0aGUgcHJvY2VzcyBvZiBzdGFydGluZyB1cC5cbiAgaWYgKGlzVW5kZWZpbmVkKGdsb2JhbC5wcm9jZXNzKSkge1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBleHBvcnRzLmRlcHJlY2F0ZShmbiwgbXNnKS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIH07XG4gIH1cblxuICBpZiAocHJvY2Vzcy5ub0RlcHJlY2F0aW9uID09PSB0cnVlKSB7XG4gICAgcmV0dXJuIGZuO1xuICB9XG5cbiAgdmFyIHdhcm5lZCA9IGZhbHNlO1xuICBmdW5jdGlvbiBkZXByZWNhdGVkKCkge1xuICAgIGlmICghd2FybmVkKSB7XG4gICAgICBpZiAocHJvY2Vzcy50aHJvd0RlcHJlY2F0aW9uKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihtc2cpO1xuICAgICAgfSBlbHNlIGlmIChwcm9jZXNzLnRyYWNlRGVwcmVjYXRpb24pIHtcbiAgICAgICAgY29uc29sZS50cmFjZShtc2cpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihtc2cpO1xuICAgICAgfVxuICAgICAgd2FybmVkID0gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGZuLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gIH1cblxuICByZXR1cm4gZGVwcmVjYXRlZDtcbn07XG5cblxudmFyIGRlYnVncyA9IHt9O1xudmFyIGRlYnVnRW52aXJvbjtcbmV4cG9ydHMuZGVidWdsb2cgPSBmdW5jdGlvbihzZXQpIHtcbiAgaWYgKGlzVW5kZWZpbmVkKGRlYnVnRW52aXJvbikpXG4gICAgZGVidWdFbnZpcm9uID0gcHJvY2Vzcy5lbnYuTk9ERV9ERUJVRyB8fCAnJztcbiAgc2V0ID0gc2V0LnRvVXBwZXJDYXNlKCk7XG4gIGlmICghZGVidWdzW3NldF0pIHtcbiAgICBpZiAobmV3IFJlZ0V4cCgnXFxcXGInICsgc2V0ICsgJ1xcXFxiJywgJ2knKS50ZXN0KGRlYnVnRW52aXJvbikpIHtcbiAgICAgIHZhciBwaWQgPSBwcm9jZXNzLnBpZDtcbiAgICAgIGRlYnVnc1tzZXRdID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBtc2cgPSBleHBvcnRzLmZvcm1hdC5hcHBseShleHBvcnRzLCBhcmd1bWVudHMpO1xuICAgICAgICBjb25zb2xlLmVycm9yKCclcyAlZDogJXMnLCBzZXQsIHBpZCwgbXNnKTtcbiAgICAgIH07XG4gICAgfSBlbHNlIHtcbiAgICAgIGRlYnVnc1tzZXRdID0gZnVuY3Rpb24oKSB7fTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGRlYnVnc1tzZXRdO1xufTtcblxuXG4vKipcbiAqIEVjaG9zIHRoZSB2YWx1ZSBvZiBhIHZhbHVlLiBUcnlzIHRvIHByaW50IHRoZSB2YWx1ZSBvdXRcbiAqIGluIHRoZSBiZXN0IHdheSBwb3NzaWJsZSBnaXZlbiB0aGUgZGlmZmVyZW50IHR5cGVzLlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmogVGhlIG9iamVjdCB0byBwcmludCBvdXQuXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0cyBPcHRpb25hbCBvcHRpb25zIG9iamVjdCB0aGF0IGFsdGVycyB0aGUgb3V0cHV0LlxuICovXG4vKiBsZWdhY3k6IG9iaiwgc2hvd0hpZGRlbiwgZGVwdGgsIGNvbG9ycyovXG5mdW5jdGlvbiBpbnNwZWN0KG9iaiwgb3B0cykge1xuICAvLyBkZWZhdWx0IG9wdGlvbnNcbiAgdmFyIGN0eCA9IHtcbiAgICBzZWVuOiBbXSxcbiAgICBzdHlsaXplOiBzdHlsaXplTm9Db2xvclxuICB9O1xuICAvLyBsZWdhY3kuLi5cbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPj0gMykgY3R4LmRlcHRoID0gYXJndW1lbnRzWzJdO1xuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+PSA0KSBjdHguY29sb3JzID0gYXJndW1lbnRzWzNdO1xuICBpZiAoaXNCb29sZWFuKG9wdHMpKSB7XG4gICAgLy8gbGVnYWN5Li4uXG4gICAgY3R4LnNob3dIaWRkZW4gPSBvcHRzO1xuICB9IGVsc2UgaWYgKG9wdHMpIHtcbiAgICAvLyBnb3QgYW4gXCJvcHRpb25zXCIgb2JqZWN0XG4gICAgZXhwb3J0cy5fZXh0ZW5kKGN0eCwgb3B0cyk7XG4gIH1cbiAgLy8gc2V0IGRlZmF1bHQgb3B0aW9uc1xuICBpZiAoaXNVbmRlZmluZWQoY3R4LnNob3dIaWRkZW4pKSBjdHguc2hvd0hpZGRlbiA9IGZhbHNlO1xuICBpZiAoaXNVbmRlZmluZWQoY3R4LmRlcHRoKSkgY3R4LmRlcHRoID0gMjtcbiAgaWYgKGlzVW5kZWZpbmVkKGN0eC5jb2xvcnMpKSBjdHguY29sb3JzID0gZmFsc2U7XG4gIGlmIChpc1VuZGVmaW5lZChjdHguY3VzdG9tSW5zcGVjdCkpIGN0eC5jdXN0b21JbnNwZWN0ID0gdHJ1ZTtcbiAgaWYgKGN0eC5jb2xvcnMpIGN0eC5zdHlsaXplID0gc3R5bGl6ZVdpdGhDb2xvcjtcbiAgcmV0dXJuIGZvcm1hdFZhbHVlKGN0eCwgb2JqLCBjdHguZGVwdGgpO1xufVxuZXhwb3J0cy5pbnNwZWN0ID0gaW5zcGVjdDtcblxuXG4vLyBodHRwOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL0FOU0lfZXNjYXBlX2NvZGUjZ3JhcGhpY3Ncbmluc3BlY3QuY29sb3JzID0ge1xuICAnYm9sZCcgOiBbMSwgMjJdLFxuICAnaXRhbGljJyA6IFszLCAyM10sXG4gICd1bmRlcmxpbmUnIDogWzQsIDI0XSxcbiAgJ2ludmVyc2UnIDogWzcsIDI3XSxcbiAgJ3doaXRlJyA6IFszNywgMzldLFxuICAnZ3JleScgOiBbOTAsIDM5XSxcbiAgJ2JsYWNrJyA6IFszMCwgMzldLFxuICAnYmx1ZScgOiBbMzQsIDM5XSxcbiAgJ2N5YW4nIDogWzM2LCAzOV0sXG4gICdncmVlbicgOiBbMzIsIDM5XSxcbiAgJ21hZ2VudGEnIDogWzM1LCAzOV0sXG4gICdyZWQnIDogWzMxLCAzOV0sXG4gICd5ZWxsb3cnIDogWzMzLCAzOV1cbn07XG5cbi8vIERvbid0IHVzZSAnYmx1ZScgbm90IHZpc2libGUgb24gY21kLmV4ZVxuaW5zcGVjdC5zdHlsZXMgPSB7XG4gICdzcGVjaWFsJzogJ2N5YW4nLFxuICAnbnVtYmVyJzogJ3llbGxvdycsXG4gICdib29sZWFuJzogJ3llbGxvdycsXG4gICd1bmRlZmluZWQnOiAnZ3JleScsXG4gICdudWxsJzogJ2JvbGQnLFxuICAnc3RyaW5nJzogJ2dyZWVuJyxcbiAgJ2RhdGUnOiAnbWFnZW50YScsXG4gIC8vIFwibmFtZVwiOiBpbnRlbnRpb25hbGx5IG5vdCBzdHlsaW5nXG4gICdyZWdleHAnOiAncmVkJ1xufTtcblxuXG5mdW5jdGlvbiBzdHlsaXplV2l0aENvbG9yKHN0ciwgc3R5bGVUeXBlKSB7XG4gIHZhciBzdHlsZSA9IGluc3BlY3Quc3R5bGVzW3N0eWxlVHlwZV07XG5cbiAgaWYgKHN0eWxlKSB7XG4gICAgcmV0dXJuICdcXHUwMDFiWycgKyBpbnNwZWN0LmNvbG9yc1tzdHlsZV1bMF0gKyAnbScgKyBzdHIgK1xuICAgICAgICAgICAnXFx1MDAxYlsnICsgaW5zcGVjdC5jb2xvcnNbc3R5bGVdWzFdICsgJ20nO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBzdHI7XG4gIH1cbn1cblxuXG5mdW5jdGlvbiBzdHlsaXplTm9Db2xvcihzdHIsIHN0eWxlVHlwZSkge1xuICByZXR1cm4gc3RyO1xufVxuXG5cbmZ1bmN0aW9uIGFycmF5VG9IYXNoKGFycmF5KSB7XG4gIHZhciBoYXNoID0ge307XG5cbiAgYXJyYXkuZm9yRWFjaChmdW5jdGlvbih2YWwsIGlkeCkge1xuICAgIGhhc2hbdmFsXSA9IHRydWU7XG4gIH0pO1xuXG4gIHJldHVybiBoYXNoO1xufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdFZhbHVlKGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcykge1xuICAvLyBQcm92aWRlIGEgaG9vayBmb3IgdXNlci1zcGVjaWZpZWQgaW5zcGVjdCBmdW5jdGlvbnMuXG4gIC8vIENoZWNrIHRoYXQgdmFsdWUgaXMgYW4gb2JqZWN0IHdpdGggYW4gaW5zcGVjdCBmdW5jdGlvbiBvbiBpdFxuICBpZiAoY3R4LmN1c3RvbUluc3BlY3QgJiZcbiAgICAgIHZhbHVlICYmXG4gICAgICBpc0Z1bmN0aW9uKHZhbHVlLmluc3BlY3QpICYmXG4gICAgICAvLyBGaWx0ZXIgb3V0IHRoZSB1dGlsIG1vZHVsZSwgaXQncyBpbnNwZWN0IGZ1bmN0aW9uIGlzIHNwZWNpYWxcbiAgICAgIHZhbHVlLmluc3BlY3QgIT09IGV4cG9ydHMuaW5zcGVjdCAmJlxuICAgICAgLy8gQWxzbyBmaWx0ZXIgb3V0IGFueSBwcm90b3R5cGUgb2JqZWN0cyB1c2luZyB0aGUgY2lyY3VsYXIgY2hlY2suXG4gICAgICAhKHZhbHVlLmNvbnN0cnVjdG9yICYmIHZhbHVlLmNvbnN0cnVjdG9yLnByb3RvdHlwZSA9PT0gdmFsdWUpKSB7XG4gICAgdmFyIHJldCA9IHZhbHVlLmluc3BlY3QocmVjdXJzZVRpbWVzLCBjdHgpO1xuICAgIGlmICghaXNTdHJpbmcocmV0KSkge1xuICAgICAgcmV0ID0gZm9ybWF0VmFsdWUoY3R4LCByZXQsIHJlY3Vyc2VUaW1lcyk7XG4gICAgfVxuICAgIHJldHVybiByZXQ7XG4gIH1cblxuICAvLyBQcmltaXRpdmUgdHlwZXMgY2Fubm90IGhhdmUgcHJvcGVydGllc1xuICB2YXIgcHJpbWl0aXZlID0gZm9ybWF0UHJpbWl0aXZlKGN0eCwgdmFsdWUpO1xuICBpZiAocHJpbWl0aXZlKSB7XG4gICAgcmV0dXJuIHByaW1pdGl2ZTtcbiAgfVxuXG4gIC8vIExvb2sgdXAgdGhlIGtleXMgb2YgdGhlIG9iamVjdC5cbiAgdmFyIGtleXMgPSBPYmplY3Qua2V5cyh2YWx1ZSk7XG4gIHZhciB2aXNpYmxlS2V5cyA9IGFycmF5VG9IYXNoKGtleXMpO1xuXG4gIGlmIChjdHguc2hvd0hpZGRlbikge1xuICAgIGtleXMgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyh2YWx1ZSk7XG4gIH1cblxuICAvLyBJRSBkb2Vzbid0IG1ha2UgZXJyb3IgZmllbGRzIG5vbi1lbnVtZXJhYmxlXG4gIC8vIGh0dHA6Ly9tc2RuLm1pY3Jvc29mdC5jb20vZW4tdXMvbGlicmFyeS9pZS9kd3c1MnNidCh2PXZzLjk0KS5hc3B4XG4gIGlmIChpc0Vycm9yKHZhbHVlKVxuICAgICAgJiYgKGtleXMuaW5kZXhPZignbWVzc2FnZScpID49IDAgfHwga2V5cy5pbmRleE9mKCdkZXNjcmlwdGlvbicpID49IDApKSB7XG4gICAgcmV0dXJuIGZvcm1hdEVycm9yKHZhbHVlKTtcbiAgfVxuXG4gIC8vIFNvbWUgdHlwZSBvZiBvYmplY3Qgd2l0aG91dCBwcm9wZXJ0aWVzIGNhbiBiZSBzaG9ydGN1dHRlZC5cbiAgaWYgKGtleXMubGVuZ3RoID09PSAwKSB7XG4gICAgaWYgKGlzRnVuY3Rpb24odmFsdWUpKSB7XG4gICAgICB2YXIgbmFtZSA9IHZhbHVlLm5hbWUgPyAnOiAnICsgdmFsdWUubmFtZSA6ICcnO1xuICAgICAgcmV0dXJuIGN0eC5zdHlsaXplKCdbRnVuY3Rpb24nICsgbmFtZSArICddJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gICAgaWYgKGlzUmVnRXhwKHZhbHVlKSkge1xuICAgICAgcmV0dXJuIGN0eC5zdHlsaXplKFJlZ0V4cC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSksICdyZWdleHAnKTtcbiAgICB9XG4gICAgaWYgKGlzRGF0ZSh2YWx1ZSkpIHtcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZShEYXRlLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKSwgJ2RhdGUnKTtcbiAgICB9XG4gICAgaWYgKGlzRXJyb3IodmFsdWUpKSB7XG4gICAgICByZXR1cm4gZm9ybWF0RXJyb3IodmFsdWUpO1xuICAgIH1cbiAgfVxuXG4gIHZhciBiYXNlID0gJycsIGFycmF5ID0gZmFsc2UsIGJyYWNlcyA9IFsneycsICd9J107XG5cbiAgLy8gTWFrZSBBcnJheSBzYXkgdGhhdCB0aGV5IGFyZSBBcnJheVxuICBpZiAoaXNBcnJheSh2YWx1ZSkpIHtcbiAgICBhcnJheSA9IHRydWU7XG4gICAgYnJhY2VzID0gWydbJywgJ10nXTtcbiAgfVxuXG4gIC8vIE1ha2UgZnVuY3Rpb25zIHNheSB0aGF0IHRoZXkgYXJlIGZ1bmN0aW9uc1xuICBpZiAoaXNGdW5jdGlvbih2YWx1ZSkpIHtcbiAgICB2YXIgbiA9IHZhbHVlLm5hbWUgPyAnOiAnICsgdmFsdWUubmFtZSA6ICcnO1xuICAgIGJhc2UgPSAnIFtGdW5jdGlvbicgKyBuICsgJ10nO1xuICB9XG5cbiAgLy8gTWFrZSBSZWdFeHBzIHNheSB0aGF0IHRoZXkgYXJlIFJlZ0V4cHNcbiAgaWYgKGlzUmVnRXhwKHZhbHVlKSkge1xuICAgIGJhc2UgPSAnICcgKyBSZWdFeHAucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpO1xuICB9XG5cbiAgLy8gTWFrZSBkYXRlcyB3aXRoIHByb3BlcnRpZXMgZmlyc3Qgc2F5IHRoZSBkYXRlXG4gIGlmIChpc0RhdGUodmFsdWUpKSB7XG4gICAgYmFzZSA9ICcgJyArIERhdGUucHJvdG90eXBlLnRvVVRDU3RyaW5nLmNhbGwodmFsdWUpO1xuICB9XG5cbiAgLy8gTWFrZSBlcnJvciB3aXRoIG1lc3NhZ2UgZmlyc3Qgc2F5IHRoZSBlcnJvclxuICBpZiAoaXNFcnJvcih2YWx1ZSkpIHtcbiAgICBiYXNlID0gJyAnICsgZm9ybWF0RXJyb3IodmFsdWUpO1xuICB9XG5cbiAgaWYgKGtleXMubGVuZ3RoID09PSAwICYmICghYXJyYXkgfHwgdmFsdWUubGVuZ3RoID09IDApKSB7XG4gICAgcmV0dXJuIGJyYWNlc1swXSArIGJhc2UgKyBicmFjZXNbMV07XG4gIH1cblxuICBpZiAocmVjdXJzZVRpbWVzIDwgMCkge1xuICAgIGlmIChpc1JlZ0V4cCh2YWx1ZSkpIHtcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZShSZWdFeHAucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpLCAncmVnZXhwJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZSgnW09iamVjdF0nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgfVxuXG4gIGN0eC5zZWVuLnB1c2godmFsdWUpO1xuXG4gIHZhciBvdXRwdXQ7XG4gIGlmIChhcnJheSkge1xuICAgIG91dHB1dCA9IGZvcm1hdEFycmF5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsIGtleXMpO1xuICB9IGVsc2Uge1xuICAgIG91dHB1dCA9IGtleXMubWFwKGZ1bmN0aW9uKGtleSkge1xuICAgICAgcmV0dXJuIGZvcm1hdFByb3BlcnR5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsIGtleSwgYXJyYXkpO1xuICAgIH0pO1xuICB9XG5cbiAgY3R4LnNlZW4ucG9wKCk7XG5cbiAgcmV0dXJuIHJlZHVjZVRvU2luZ2xlU3RyaW5nKG91dHB1dCwgYmFzZSwgYnJhY2VzKTtcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRQcmltaXRpdmUoY3R4LCB2YWx1ZSkge1xuICBpZiAoaXNVbmRlZmluZWQodmFsdWUpKVxuICAgIHJldHVybiBjdHguc3R5bGl6ZSgndW5kZWZpbmVkJywgJ3VuZGVmaW5lZCcpO1xuICBpZiAoaXNTdHJpbmcodmFsdWUpKSB7XG4gICAgdmFyIHNpbXBsZSA9ICdcXCcnICsgSlNPTi5zdHJpbmdpZnkodmFsdWUpLnJlcGxhY2UoL15cInxcIiQvZywgJycpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvJy9nLCBcIlxcXFwnXCIpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvXFxcXFwiL2csICdcIicpICsgJ1xcJyc7XG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKHNpbXBsZSwgJ3N0cmluZycpO1xuICB9XG4gIGlmIChpc051bWJlcih2YWx1ZSkpXG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKCcnICsgdmFsdWUsICdudW1iZXInKTtcbiAgaWYgKGlzQm9vbGVhbih2YWx1ZSkpXG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKCcnICsgdmFsdWUsICdib29sZWFuJyk7XG4gIC8vIEZvciBzb21lIHJlYXNvbiB0eXBlb2YgbnVsbCBpcyBcIm9iamVjdFwiLCBzbyBzcGVjaWFsIGNhc2UgaGVyZS5cbiAgaWYgKGlzTnVsbCh2YWx1ZSkpXG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKCdudWxsJywgJ251bGwnKTtcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRFcnJvcih2YWx1ZSkge1xuICByZXR1cm4gJ1snICsgRXJyb3IucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpICsgJ10nO1xufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdEFycmF5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsIGtleXMpIHtcbiAgdmFyIG91dHB1dCA9IFtdO1xuICBmb3IgKHZhciBpID0gMCwgbCA9IHZhbHVlLmxlbmd0aDsgaSA8IGw7ICsraSkge1xuICAgIGlmIChoYXNPd25Qcm9wZXJ0eSh2YWx1ZSwgU3RyaW5nKGkpKSkge1xuICAgICAgb3V0cHV0LnB1c2goZm9ybWF0UHJvcGVydHkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cyxcbiAgICAgICAgICBTdHJpbmcoaSksIHRydWUpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgb3V0cHV0LnB1c2goJycpO1xuICAgIH1cbiAgfVxuICBrZXlzLmZvckVhY2goZnVuY3Rpb24oa2V5KSB7XG4gICAgaWYgKCFrZXkubWF0Y2goL15cXGQrJC8pKSB7XG4gICAgICBvdXRwdXQucHVzaChmb3JtYXRQcm9wZXJ0eShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLFxuICAgICAgICAgIGtleSwgdHJ1ZSkpO1xuICAgIH1cbiAgfSk7XG4gIHJldHVybiBvdXRwdXQ7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0UHJvcGVydHkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cywga2V5LCBhcnJheSkge1xuICB2YXIgbmFtZSwgc3RyLCBkZXNjO1xuICBkZXNjID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcih2YWx1ZSwga2V5KSB8fCB7IHZhbHVlOiB2YWx1ZVtrZXldIH07XG4gIGlmIChkZXNjLmdldCkge1xuICAgIGlmIChkZXNjLnNldCkge1xuICAgICAgc3RyID0gY3R4LnN0eWxpemUoJ1tHZXR0ZXIvU2V0dGVyXScsICdzcGVjaWFsJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHN0ciA9IGN0eC5zdHlsaXplKCdbR2V0dGVyXScsICdzcGVjaWFsJyk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGlmIChkZXNjLnNldCkge1xuICAgICAgc3RyID0gY3R4LnN0eWxpemUoJ1tTZXR0ZXJdJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gIH1cbiAgaWYgKCFoYXNPd25Qcm9wZXJ0eSh2aXNpYmxlS2V5cywga2V5KSkge1xuICAgIG5hbWUgPSAnWycgKyBrZXkgKyAnXSc7XG4gIH1cbiAgaWYgKCFzdHIpIHtcbiAgICBpZiAoY3R4LnNlZW4uaW5kZXhPZihkZXNjLnZhbHVlKSA8IDApIHtcbiAgICAgIGlmIChpc051bGwocmVjdXJzZVRpbWVzKSkge1xuICAgICAgICBzdHIgPSBmb3JtYXRWYWx1ZShjdHgsIGRlc2MudmFsdWUsIG51bGwpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc3RyID0gZm9ybWF0VmFsdWUoY3R4LCBkZXNjLnZhbHVlLCByZWN1cnNlVGltZXMgLSAxKTtcbiAgICAgIH1cbiAgICAgIGlmIChzdHIuaW5kZXhPZignXFxuJykgPiAtMSkge1xuICAgICAgICBpZiAoYXJyYXkpIHtcbiAgICAgICAgICBzdHIgPSBzdHIuc3BsaXQoJ1xcbicpLm1hcChmdW5jdGlvbihsaW5lKSB7XG4gICAgICAgICAgICByZXR1cm4gJyAgJyArIGxpbmU7XG4gICAgICAgICAgfSkuam9pbignXFxuJykuc3Vic3RyKDIpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHN0ciA9ICdcXG4nICsgc3RyLnNwbGl0KCdcXG4nKS5tYXAoZnVuY3Rpb24obGluZSkge1xuICAgICAgICAgICAgcmV0dXJuICcgICAnICsgbGluZTtcbiAgICAgICAgICB9KS5qb2luKCdcXG4nKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBzdHIgPSBjdHguc3R5bGl6ZSgnW0NpcmN1bGFyXScsICdzcGVjaWFsJyk7XG4gICAgfVxuICB9XG4gIGlmIChpc1VuZGVmaW5lZChuYW1lKSkge1xuICAgIGlmIChhcnJheSAmJiBrZXkubWF0Y2goL15cXGQrJC8pKSB7XG4gICAgICByZXR1cm4gc3RyO1xuICAgIH1cbiAgICBuYW1lID0gSlNPTi5zdHJpbmdpZnkoJycgKyBrZXkpO1xuICAgIGlmIChuYW1lLm1hdGNoKC9eXCIoW2EtekEtWl9dW2EtekEtWl8wLTldKilcIiQvKSkge1xuICAgICAgbmFtZSA9IG5hbWUuc3Vic3RyKDEsIG5hbWUubGVuZ3RoIC0gMik7XG4gICAgICBuYW1lID0gY3R4LnN0eWxpemUobmFtZSwgJ25hbWUnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbmFtZSA9IG5hbWUucmVwbGFjZSgvJy9nLCBcIlxcXFwnXCIpXG4gICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9cXFxcXCIvZywgJ1wiJylcbiAgICAgICAgICAgICAgICAgLnJlcGxhY2UoLyheXCJ8XCIkKS9nLCBcIidcIik7XG4gICAgICBuYW1lID0gY3R4LnN0eWxpemUobmFtZSwgJ3N0cmluZycpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBuYW1lICsgJzogJyArIHN0cjtcbn1cblxuXG5mdW5jdGlvbiByZWR1Y2VUb1NpbmdsZVN0cmluZyhvdXRwdXQsIGJhc2UsIGJyYWNlcykge1xuICB2YXIgbnVtTGluZXNFc3QgPSAwO1xuICB2YXIgbGVuZ3RoID0gb3V0cHV0LnJlZHVjZShmdW5jdGlvbihwcmV2LCBjdXIpIHtcbiAgICBudW1MaW5lc0VzdCsrO1xuICAgIGlmIChjdXIuaW5kZXhPZignXFxuJykgPj0gMCkgbnVtTGluZXNFc3QrKztcbiAgICByZXR1cm4gcHJldiArIGN1ci5yZXBsYWNlKC9cXHUwMDFiXFxbXFxkXFxkP20vZywgJycpLmxlbmd0aCArIDE7XG4gIH0sIDApO1xuXG4gIGlmIChsZW5ndGggPiA2MCkge1xuICAgIHJldHVybiBicmFjZXNbMF0gK1xuICAgICAgICAgICAoYmFzZSA9PT0gJycgPyAnJyA6IGJhc2UgKyAnXFxuICcpICtcbiAgICAgICAgICAgJyAnICtcbiAgICAgICAgICAgb3V0cHV0LmpvaW4oJyxcXG4gICcpICtcbiAgICAgICAgICAgJyAnICtcbiAgICAgICAgICAgYnJhY2VzWzFdO1xuICB9XG5cbiAgcmV0dXJuIGJyYWNlc1swXSArIGJhc2UgKyAnICcgKyBvdXRwdXQuam9pbignLCAnKSArICcgJyArIGJyYWNlc1sxXTtcbn1cblxuXG4vLyBOT1RFOiBUaGVzZSB0eXBlIGNoZWNraW5nIGZ1bmN0aW9ucyBpbnRlbnRpb25hbGx5IGRvbid0IHVzZSBgaW5zdGFuY2VvZmBcbi8vIGJlY2F1c2UgaXQgaXMgZnJhZ2lsZSBhbmQgY2FuIGJlIGVhc2lseSBmYWtlZCB3aXRoIGBPYmplY3QuY3JlYXRlKClgLlxuZnVuY3Rpb24gaXNBcnJheShhcikge1xuICByZXR1cm4gQXJyYXkuaXNBcnJheShhcik7XG59XG5leHBvcnRzLmlzQXJyYXkgPSBpc0FycmF5O1xuXG5mdW5jdGlvbiBpc0Jvb2xlYW4oYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnYm9vbGVhbic7XG59XG5leHBvcnRzLmlzQm9vbGVhbiA9IGlzQm9vbGVhbjtcblxuZnVuY3Rpb24gaXNOdWxsKGFyZykge1xuICByZXR1cm4gYXJnID09PSBudWxsO1xufVxuZXhwb3J0cy5pc051bGwgPSBpc051bGw7XG5cbmZ1bmN0aW9uIGlzTnVsbE9yVW5kZWZpbmVkKGFyZykge1xuICByZXR1cm4gYXJnID09IG51bGw7XG59XG5leHBvcnRzLmlzTnVsbE9yVW5kZWZpbmVkID0gaXNOdWxsT3JVbmRlZmluZWQ7XG5cbmZ1bmN0aW9uIGlzTnVtYmVyKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ251bWJlcic7XG59XG5leHBvcnRzLmlzTnVtYmVyID0gaXNOdW1iZXI7XG5cbmZ1bmN0aW9uIGlzU3RyaW5nKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ3N0cmluZyc7XG59XG5leHBvcnRzLmlzU3RyaW5nID0gaXNTdHJpbmc7XG5cbmZ1bmN0aW9uIGlzU3ltYm9sKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ3N5bWJvbCc7XG59XG5leHBvcnRzLmlzU3ltYm9sID0gaXNTeW1ib2w7XG5cbmZ1bmN0aW9uIGlzVW5kZWZpbmVkKGFyZykge1xuICByZXR1cm4gYXJnID09PSB2b2lkIDA7XG59XG5leHBvcnRzLmlzVW5kZWZpbmVkID0gaXNVbmRlZmluZWQ7XG5cbmZ1bmN0aW9uIGlzUmVnRXhwKHJlKSB7XG4gIHJldHVybiBpc09iamVjdChyZSkgJiYgb2JqZWN0VG9TdHJpbmcocmUpID09PSAnW29iamVjdCBSZWdFeHBdJztcbn1cbmV4cG9ydHMuaXNSZWdFeHAgPSBpc1JlZ0V4cDtcblxuZnVuY3Rpb24gaXNPYmplY3QoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnb2JqZWN0JyAmJiBhcmcgIT09IG51bGw7XG59XG5leHBvcnRzLmlzT2JqZWN0ID0gaXNPYmplY3Q7XG5cbmZ1bmN0aW9uIGlzRGF0ZShkKSB7XG4gIHJldHVybiBpc09iamVjdChkKSAmJiBvYmplY3RUb1N0cmluZyhkKSA9PT0gJ1tvYmplY3QgRGF0ZV0nO1xufVxuZXhwb3J0cy5pc0RhdGUgPSBpc0RhdGU7XG5cbmZ1bmN0aW9uIGlzRXJyb3IoZSkge1xuICByZXR1cm4gaXNPYmplY3QoZSkgJiZcbiAgICAgIChvYmplY3RUb1N0cmluZyhlKSA9PT0gJ1tvYmplY3QgRXJyb3JdJyB8fCBlIGluc3RhbmNlb2YgRXJyb3IpO1xufVxuZXhwb3J0cy5pc0Vycm9yID0gaXNFcnJvcjtcblxuZnVuY3Rpb24gaXNGdW5jdGlvbihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdmdW5jdGlvbic7XG59XG5leHBvcnRzLmlzRnVuY3Rpb24gPSBpc0Z1bmN0aW9uO1xuXG5mdW5jdGlvbiBpc1ByaW1pdGl2ZShhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PT0gbnVsbCB8fFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ2Jvb2xlYW4nIHx8XG4gICAgICAgICB0eXBlb2YgYXJnID09PSAnbnVtYmVyJyB8fFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ3N0cmluZycgfHxcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICdzeW1ib2wnIHx8ICAvLyBFUzYgc3ltYm9sXG4gICAgICAgICB0eXBlb2YgYXJnID09PSAndW5kZWZpbmVkJztcbn1cbmV4cG9ydHMuaXNQcmltaXRpdmUgPSBpc1ByaW1pdGl2ZTtcblxuZXhwb3J0cy5pc0J1ZmZlciA9IHJlcXVpcmUoJy4vc3VwcG9ydC9pc0J1ZmZlcicpO1xuXG5mdW5jdGlvbiBvYmplY3RUb1N0cmluZyhvKSB7XG4gIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwobyk7XG59XG5cblxuZnVuY3Rpb24gcGFkKG4pIHtcbiAgcmV0dXJuIG4gPCAxMCA/ICcwJyArIG4udG9TdHJpbmcoMTApIDogbi50b1N0cmluZygxMCk7XG59XG5cblxudmFyIG1vbnRocyA9IFsnSmFuJywgJ0ZlYicsICdNYXInLCAnQXByJywgJ01heScsICdKdW4nLCAnSnVsJywgJ0F1ZycsICdTZXAnLFxuICAgICAgICAgICAgICAnT2N0JywgJ05vdicsICdEZWMnXTtcblxuLy8gMjYgRmViIDE2OjE5OjM0XG5mdW5jdGlvbiB0aW1lc3RhbXAoKSB7XG4gIHZhciBkID0gbmV3IERhdGUoKTtcbiAgdmFyIHRpbWUgPSBbcGFkKGQuZ2V0SG91cnMoKSksXG4gICAgICAgICAgICAgIHBhZChkLmdldE1pbnV0ZXMoKSksXG4gICAgICAgICAgICAgIHBhZChkLmdldFNlY29uZHMoKSldLmpvaW4oJzonKTtcbiAgcmV0dXJuIFtkLmdldERhdGUoKSwgbW9udGhzW2QuZ2V0TW9udGgoKV0sIHRpbWVdLmpvaW4oJyAnKTtcbn1cblxuXG4vLyBsb2cgaXMganVzdCBhIHRoaW4gd3JhcHBlciB0byBjb25zb2xlLmxvZyB0aGF0IHByZXBlbmRzIGEgdGltZXN0YW1wXG5leHBvcnRzLmxvZyA9IGZ1bmN0aW9uKCkge1xuICBjb25zb2xlLmxvZygnJXMgLSAlcycsIHRpbWVzdGFtcCgpLCBleHBvcnRzLmZvcm1hdC5hcHBseShleHBvcnRzLCBhcmd1bWVudHMpKTtcbn07XG5cblxuLyoqXG4gKiBJbmhlcml0IHRoZSBwcm90b3R5cGUgbWV0aG9kcyBmcm9tIG9uZSBjb25zdHJ1Y3RvciBpbnRvIGFub3RoZXIuXG4gKlxuICogVGhlIEZ1bmN0aW9uLnByb3RvdHlwZS5pbmhlcml0cyBmcm9tIGxhbmcuanMgcmV3cml0dGVuIGFzIGEgc3RhbmRhbG9uZVxuICogZnVuY3Rpb24gKG5vdCBvbiBGdW5jdGlvbi5wcm90b3R5cGUpLiBOT1RFOiBJZiB0aGlzIGZpbGUgaXMgdG8gYmUgbG9hZGVkXG4gKiBkdXJpbmcgYm9vdHN0cmFwcGluZyB0aGlzIGZ1bmN0aW9uIG5lZWRzIHRvIGJlIHJld3JpdHRlbiB1c2luZyBzb21lIG5hdGl2ZVxuICogZnVuY3Rpb25zIGFzIHByb3RvdHlwZSBzZXR1cCB1c2luZyBub3JtYWwgSmF2YVNjcmlwdCBkb2VzIG5vdCB3b3JrIGFzXG4gKiBleHBlY3RlZCBkdXJpbmcgYm9vdHN0cmFwcGluZyAoc2VlIG1pcnJvci5qcyBpbiByMTE0OTAzKS5cbiAqXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBjdG9yIENvbnN0cnVjdG9yIGZ1bmN0aW9uIHdoaWNoIG5lZWRzIHRvIGluaGVyaXQgdGhlXG4gKiAgICAgcHJvdG90eXBlLlxuICogQHBhcmFtIHtmdW5jdGlvbn0gc3VwZXJDdG9yIENvbnN0cnVjdG9yIGZ1bmN0aW9uIHRvIGluaGVyaXQgcHJvdG90eXBlIGZyb20uXG4gKi9cbmV4cG9ydHMuaW5oZXJpdHMgPSByZXF1aXJlKCdpbmhlcml0cycpO1xuXG5leHBvcnRzLl9leHRlbmQgPSBmdW5jdGlvbihvcmlnaW4sIGFkZCkge1xuICAvLyBEb24ndCBkbyBhbnl0aGluZyBpZiBhZGQgaXNuJ3QgYW4gb2JqZWN0XG4gIGlmICghYWRkIHx8ICFpc09iamVjdChhZGQpKSByZXR1cm4gb3JpZ2luO1xuXG4gIHZhciBrZXlzID0gT2JqZWN0LmtleXMoYWRkKTtcbiAgdmFyIGkgPSBrZXlzLmxlbmd0aDtcbiAgd2hpbGUgKGktLSkge1xuICAgIG9yaWdpbltrZXlzW2ldXSA9IGFkZFtrZXlzW2ldXTtcbiAgfVxuICByZXR1cm4gb3JpZ2luO1xufTtcblxuZnVuY3Rpb24gaGFzT3duUHJvcGVydHkob2JqLCBwcm9wKSB7XG4gIHJldHVybiBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBwcm9wKTtcbn1cbiIsImltcG9ydCBUcmVlTm9kZSBmcm9tICcuL2pzL1RyZWVOb2RlLmpzJztcbmltcG9ydCAqIGFzIHV0aWxzIGZyb20gJy4vanMvVXRpbC5qcyc7XG5pbXBvcnQgcGFyc2VMaXN0IGZyb20gJy4vanMvUGFyc2VyLmpzJztcblxudmFyIHZtID0gbmV3IFZ1ZSh7XG4gICAgZWw6ICcuY29udGVudCcsXG4gICAgZGF0YToge1xuICAgICAgICBzb3VyY2VDb2RlOiAnJyxcbiAgICAgICAgY3VycmVudFRyZWU6IHVuZGVmaW5lZFxuICAgIH0sXG4gICAgbWV0aG9kczoge1xuICAgICAgICBwYXJzZVNvdXJjZTogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJQYXJzaW5nLi4uXCIpO1xuXG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIHZhciBwYXJzZWQgPSBwYXJzZUxpc3QodGhpcy5zb3VyY2VDb2RlKTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiV29vcHMhIEVycm9yIHBhcnNpbmdcIik7XG5cbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChwYXJzZWQubGVuZ3RoID09IDApIHJldHVybjtcbiAgICAgICAgICAgIHBhcnNlZCA9IHBhcnNlZC5jaGlsZHJlblswXTtcblxuICAgICAgICAgICAgdm0uY3VycmVudFRyZWUgPSB0aGlzLnBhcnNlT2JqZWN0QnJhbmNoKHBhcnNlZCwgdHJ1ZSk7XG4gICAgICAgICAgICB2bS5yZWdlbmVyYXRlRGlhZ3JhbSgpO1xuICAgICAgICB9LFxuXG4gICAgICAgIHBhcnNlT2JqZWN0QnJhbmNoOiBmdW5jdGlvbiAoYnJhbmNoLCBpc1Jvb3QgPSBmYWxzZSkge1xuICAgICAgICAgICAgdmFyIG5vZGUgPSBuZXcgVHJlZU5vZGUoYnJhbmNoLmxhYmVsLCBpc1Jvb3QpO1xuXG4gICAgICAgICAgICBmb3IgKHZhciBjaGlsZCBvZiBicmFuY2guY2hpbGRyZW4pIHtcbiAgICAgICAgICAgICAgICBub2RlLmFkZENoaWxkKHRoaXMucGFyc2VPYmplY3RCcmFuY2goY2hpbGQsIGZhbHNlKSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBub2RlO1xuICAgICAgICB9LFxuXG4gICAgICAgIHJlZ2VuZXJhdGVEaWFncmFtOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgY2FudmFzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjYW52YXNcIik7XG4gICAgICAgICAgICB2YXIgY3R4ID0gY2FudmFzLmdldENvbnRleHQoXCIyZFwiKTtcblxuICAgICAgICAgICAgaWYgKCEodGhpcy5jdXJyZW50VHJlZSBpbnN0YW5jZW9mIFRyZWVOb2RlKSkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiTm90IGEgdmFsaWQgdHJlZVwiLCB0aGlzLmN1cnJlbnRUcmVlKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIERyYXcgdGhlIG1hcFxuICAgICAgICAgICAgdmFyIGJlYXV0aWZ1bERyYXdpbmcgPSB0aGlzLmN1cnJlbnRUcmVlLmRyYXcoKTtcblxuICAgICAgICAgICAgLy8gUmVzaXplIGNhbnZhcyB0byB0aGUgc2l6ZSBvZiB0aGUgbWFwIHBsdXMgc29tZSBtYXJnaW5cbiAgICAgICAgICAgIGNhbnZhcy53aWR0aCA9IGJlYXV0aWZ1bERyYXdpbmcud2lkdGggKyAyNTtcbiAgICAgICAgICAgIGNhbnZhcy5oZWlnaHQgPSBiZWF1dGlmdWxEcmF3aW5nLmhlaWdodCArIDI1O1xuXG4gICAgICAgICAgICAvLyBEcmF3IHRoZSBtYXAgb250byB0aGUgZXhpc3RpbmcgY2FudmFzXG4gICAgICAgICAgICBjdHguZHJhd0ltYWdlKGJlYXV0aWZ1bERyYXdpbmcsIDI1LCAyNSk7XG4gICAgICAgIH1cbiAgICB9XG59KTtcblxudm0uc291cmNlQ29kZSA9XG4gICAgYC0gUHJvZ3JhbW1pbmdcbnNvbWV0aGluZyBJIGxvdmVcbiAgLSBXZWIgRGV2ZWxvcG1lbnRcbiAgICAtIEZyb250LWVuZCBkZXZlbG9wbWVudFxuKHN0dWZmIGZvciB0aGUgYnJvd3NlcnMpXG4gICAgICAtIExhbmd1YWdlc1xuICAgICAgICAtIEhUTUxcbiAgICAgICAgLSBDU1NcbiAgICAgICAgLSBKYXZhU2NyaXB0XG4gICAgICAtIFRvb2xzXG4gICAgICAgIC0gQm9vdHN0cmFwXG4gICAgLSBCYWNrLWVuZCBkZXZlbG9wbWVudFxuKHN0dWZmIGZvciB0aGUgc2VydmVyKVxuICAgICAgLSBMYW5ndWFnZXNcbiAgICAgICAgLSBQSFBcbiAgICAgICAgLSBQeXRob25cbiAgICAgIC0gRnJhbWV3b3Jrc1xuICAgICAgICAtIERqYW5nb1xuICAgICAgICAtIFN5bXBob255XG4gIC0gRGVza3RvcCBkZXZlbG9wbWVudCxcbndoaWNoIGlzIHNvbWV0aGluZyBwcmV0dHkgaGFyZCB0aGF0XG5tb3N0IHdlYiBkZXZlbG9wZXJzIGNhbid0IGRvXG4gIC0gTW9iaWxlIGRldmVsb3BtZW50XG4gICAgLSBBbmRyb2lkXG4gICAgLSBpT1NcbiAgICAtIFNvbWUgb3RoZXIgc3R1ZmZcbm5vIG9uZSBjYXJlcyBhYm91dFxuICAgIC0gTE9MV0FUXG5gO1xuXG52bS4kd2F0Y2goJ3NvdXJjZUNvZGUnLCBmdW5jdGlvbiAoc291cmNlQ29kZSkge1xuICAgIHZtLnBhcnNlU291cmNlKCk7XG59KTtcblxuc2V0VGltZW91dCgoKSA9PiB2bS5wYXJzZVNvdXJjZSgpLCAyNTApO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbnZhciB1dGlsID0gcmVxdWlyZSgndXRpbCcpO1xuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBwYXJzZUxpc3QodGV4dCkge1xuICAgIHZhciBpdGVtcyA9IHsnbGFiZWwnOiAnUk9PVCcsICdjaGlsZHJlbic6IFtdLCAnZGVwdGgnOiAtMX07XG4gICAgdmFyIGxpbmVzID0gdGV4dC5zcGxpdChcIlxcblwiKTtcbiAgICBsaW5lcyA9IGxpbmVzLmZpbHRlcihjID0+ICFjLm1hdGNoKC9eXFxzKiQvKSk7IC8vIFJlbW92ZSBibGFuayBsaW5lc1xuXG4gICAgdmFyIGN1cnJlbnRQYXJlbnQgPSBpdGVtcztcbiAgICB2YXIgY3VycmVudFBhcmVudERlcHRoID0gLTE7XG5cbiAgICB2YXIgY3VycmVudEl0ZW1MYWJlbCA9IFwiXCI7XG4gICAgdmFyIGN1cnJlbnRJdGVtRGVwdGg7XG5cbiAgICBmb3IgKHZhciBsaW5lIG9mIGxpbmVzKSB7XG4gICAgICAgIHZhciBpdGVtTWF0Y2ggPSBsaW5lLm1hdGNoKC9eKCAqKS1cXHMqKC4qKSQvKTtcblxuICAgICAgICAvLyBOZXcgaXRlbVxuICAgICAgICBpZiAoaXRlbU1hdGNoKSB7XG4gICAgICAgICAgICAvLyBTdG9yZSBwcmV2aW91cyBpdGVtIChpZiBhbnkpXG4gICAgICAgICAgICBpZiAoY3VycmVudEl0ZW1MYWJlbCAhPSBcIlwiKSB7XG5cbiAgICAgICAgICAgICAgICAvLyBCdWlsZCB0aGUgbm9kZSBmb3IgdGhlIHByZXZpb3VzbHkgcmVhZCBub2RlXG4gICAgICAgICAgICAgICAgdmFyIG5vZGUgPSB7XG4gICAgICAgICAgICAgICAgICAgICdsYWJlbCc6IGN1cnJlbnRJdGVtTGFiZWwsXG4gICAgICAgICAgICAgICAgICAgICdjaGlsZHJlbic6IFtdLFxuICAgICAgICAgICAgICAgICAgICAncGFyZW50JzogY3VycmVudFBhcmVudCxcbiAgICAgICAgICAgICAgICAgICAgJ2RlcHRoJzogY3VycmVudEl0ZW1EZXB0aFxuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAvLyBTdG9yZSB0aGUgbm9kZSB3aXRoaW4gaXRzIHBhcmVudFxuICAgICAgICAgICAgICAgIGN1cnJlbnRQYXJlbnRbJ2NoaWxkcmVuJ10ucHVzaChub2RlKTtcblxuICAgICAgICAgICAgICAgIC8vIFNldCB0aGUgbmV3IFwicGFyZW50XCIgdG8gdGhlIHByZXZpb3VzIGl0ZW1cbiAgICAgICAgICAgICAgICBjdXJyZW50UGFyZW50ID0gbm9kZTtcbiAgICAgICAgICAgICAgICBjdXJyZW50UGFyZW50RGVwdGggPSBub2RlLmRlcHRoO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBGZXRjaCB0aGUgZGF0YSBmcm9tIHRoZSBuZXdseS1yZWFkIGl0ZW1cbiAgICAgICAgICAgIGN1cnJlbnRJdGVtRGVwdGggPSBpdGVtTWF0Y2hbMV0ubGVuZ3RoO1xuICAgICAgICAgICAgY3VycmVudEl0ZW1MYWJlbCA9IGl0ZW1NYXRjaFsyXTtcblxuICAgICAgICAgICAgLy8gSWYgdGhlIHBhcmVudCBpcyBkZWVwZXIgdGhhbiB0aGUgbmV3IGl0ZW0sIHN3aXRjaCB0aGUgcGFyZW50XG4gICAgICAgICAgICAvLyB0byBvbmUgd2l0aCBsb3dlciBkZXB0aCB0aGFuIGN1cnJlbnQgaXRlbVxuICAgICAgICAgICAgd2hpbGUgKGN1cnJlbnRJdGVtRGVwdGggPD0gY3VycmVudFBhcmVudERlcHRoKSB7XG4gICAgICAgICAgICAgICAgY3VycmVudFBhcmVudCA9IGN1cnJlbnRQYXJlbnRbJ3BhcmVudCddO1xuICAgICAgICAgICAgICAgIGN1cnJlbnRQYXJlbnREZXB0aCA9IGN1cnJlbnRQYXJlbnRbJ2RlcHRoJ107XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgfVxuICAgICAgICAvLyBDb250aW51ZWQgc3RyaW5nIGZyb20gcHJldmlvdXMgaXRlbVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGN1cnJlbnRJdGVtTGFiZWwgKz0gXCJcXG5cIiArIGxpbmU7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBGb3JjZSBpbnNlcnQgbGFzdCBpdGVtXG4gICAgaWYgKGN1cnJlbnRJdGVtTGFiZWwpIHtcbiAgICAgICAgdmFyIG5vZGUgPSB7XG4gICAgICAgICAgICAnbGFiZWwnOiBjdXJyZW50SXRlbUxhYmVsLFxuICAgICAgICAgICAgJ2NoaWxkcmVuJzogW10sXG4gICAgICAgICAgICAncGFyZW50JzogY3VycmVudFBhcmVudCxcbiAgICAgICAgICAgICdkZXB0aCc6IGN1cnJlbnRQYXJlbnREZXB0aCArIDFcbiAgICAgICAgfTtcbiAgICAgICAgY3VycmVudFBhcmVudFsnY2hpbGRyZW4nXS5wdXNoKG5vZGUpO1xuICAgIH1cblxuICAgIHJldHVybiBpdGVtcztcbn1cblxuLy92YXIgc291cmNlQ29kZSA9XG4vL2AtIFByb2dyYW1taW5nOlxuLy8gIC0gV2ViIERldmVsb3BtZW50OlxuLy9cbi8vICAgIC0gRnJvbnQtZW5kIGRldmVsb3BtZW50OlxuLy8gICAgICAtIExhbmd1YWdlczpcbi8vICAgICAgICAtIEhUTUxcbi8vICAgICAgICB5IHBlbmVzXG4vLyAgICAgICAgeSB2YWdpbmFzXG4vLyAgICAgICAgLSBDU1Ncbi8vICAgICAgICAtIEphdmFTY3JpcHRcbi8vICAgICAgLSBUb29sczpcbi8vICAgICAgICAtIEJvb3RzdHJhcFxuLy8gICAgLSBCYWNrLWVuZCBkZXZlbG9wbWVudDpcbi8vICAgICAgLSBMYW5ndWFnZXM6XG4vLyAgICAgICAgLSBQSFBcbi8vICAgICAgICAtIFB5dGhvblxuLy8gICAgICAtIEZyYW1ld29ya3M6XG4vLyAgICAgICAgLSBEamFuZ29cbi8vICAgICAgICAtIFN5bXBob255XG4vLyAgLSBEZXNrdG9wIGRldmVsb3BtZW50XG4vLyAgLSBNb2JpbGUgZGV2ZWxvcG1lbnQ6XG4vLyAgICAtIEFuZHJvaWRcbi8vICAgIC0gaU9TXG4vLyAgICAtIFNvbWUgb3RoZXIgc3R1ZmYgbm8gb25lIGNhcmVzIGFib3V0XG4vL2A7XG4vL1xuLy9cbi8vY29uc29sZS5sb2codXRpbC5pbnNwZWN0KHBhcnNlTGlzdChzb3VyY2VDb2RlKSwgZmFsc2UsIG51bGwsIHRydWUpKTsiLCJpbXBvcnQgKiBhcyB1dGlscyBmcm9tICcuL1V0aWwuanMnO1xuXG52YXIgY29ubmVjdG9yV2lkdGggPSA1MDtcbnZhciBjb25uZWN0b3JTdGVlcG5lc3MgPSAwLjg7XG52YXIgY29ubmVjdG9yTGluZVdpZHRoID0gNC41O1xuXG52YXIgZm9udFNpemUgPSAxMztcbnZhciBmb250RmFtaWx5ID0gXCJPcGVuIFNhbnNcIjtcblxudmFyIGxhYmVsUGFkZGluZ0JvdHRvbSA9IDg7XG52YXIgbGFiZWxQYWRkaW5nUmlnaHQgPSA1XG5cbnZhciBsZWFmTWFyZ2luVG9wID0gNTtcbnZhciBsZWFmTWFyZ2luQm90dG9tID0gNTtcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgVHJlZU5vZGUge1xuXG4gICAgY29uc3RydWN0b3IobGFiZWwsIGlzUm9vdCA9IGZhbHNlKSB7XG4gICAgICAgIHRoaXMubGFiZWwgPSBsYWJlbDtcbiAgICAgICAgdGhpcy5sYWJlbExpbmVzID0gdGhpcy5sYWJlbC5zcGxpdChcIlxcblwiKTtcbiAgICAgICAgdGhpcy5pc1Jvb3QgPSBpc1Jvb3Q7XG4gICAgICAgIHRoaXMucGFyZW50ID0gdW5kZWZpbmVkO1xuICAgICAgICB0aGlzLmNoaWxkcmVuID0gW107XG4gICAgfVxuXG4gICAgZ2V0IGlzTGVhZigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY2hpbGRyZW4ubGVuZ3RoID09IDA7XG4gICAgfVxuXG4gICAgYWRkQ2hpbGQoY2hpbGQpIHtcbiAgICAgICAgY2hpbGQucGFyZW50ID0gdGhpcztcbiAgICAgICAgdGhpcy5jaGlsZHJlbi5wdXNoKGNoaWxkKTtcbiAgICB9XG5cbiAgICBhZGRDaGlsZHJlbiguLi5jaGlsZHJlbikge1xuICAgICAgICBmb3IgKHZhciBjaGlsZCBvZiBjaGlsZHJlbikge1xuICAgICAgICAgICAgdGhpcy5hZGRDaGlsZChjaGlsZCk7XG4gICAgICAgIH1cbiAgICB9XG5cblxuICAgIGRyYXcoY3VycmVudEJyYW5jaENvbG9yKSB7XG4gICAgICAgIHZhciB0aGF0ID0gdGhpcztcblxuICAgICAgICB2YXIgZGwgPSBmdW5jdGlvbiAoeCwgeSwgYyA9IFwiIzAwZmYwMFwiLCB3ID0gMTAwKSB7XG4gICAgICAgICAgICB0aGF0LmN0eC5maWxsU3R5bGUgPSBjO1xuICAgICAgICAgICAgdGhhdC5jdHguZmlsbFJlY3QoeCwgeSwgdywgMSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgdmFyIGRyID0gZnVuY3Rpb24gKHgsIHksIHcsIGgsIGMgPSBcIiMwMGZmMDBcIikge1xuICAgICAgICAgICAgdGhhdC5jdHguZmlsbFN0eWxlID0gYztcbiAgICAgICAgICAgIHRoYXQuY3R4LnJlY3QoeCwgeSwgdywgaCk7XG4gICAgICAgICAgICB0aGF0LmN0eC5zdHJva2UoKTtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJjYW52YXNcIik7XG4gICAgICAgIHRoaXMuY3R4ID0gdGhpcy5jYW52YXMuZ2V0Q29udGV4dChcIjJkXCIpO1xuXG4gICAgICAgIC8vIFRoZSB3aWR0aCBvZiB0aGUgbGFiZWwgd2lsbCBiZSB0aGUgd2lkdGggb2YgdGhlIHdpZGVzdCBsaW5lXG4gICAgICAgIHRoaXMuY3R4LmZvbnQgPSBmb250U2l6ZSArIFwicHggXCIgKyBmb250RmFtaWx5O1xuICAgICAgICB0aGlzLmxhYmVsV2lkdGggPSBNYXRoLmNlaWwoTWF0aC5tYXgoLi4udGhpcy5sYWJlbExpbmVzLm1hcChjID0+IHRoaXMuY3R4Lm1lYXN1cmVUZXh0KGMpLndpZHRoKSkpO1xuXG4gICAgICAgIGlmICh0aGlzLmlzTGVhZikge1xuICAgICAgICAgICAgdGhpcy5jYW52YXMud2lkdGggPSB0aGlzLmxhYmVsV2lkdGggKyBsYWJlbFBhZGRpbmdSaWdodCAqIDI7XG4gICAgICAgICAgICB0aGlzLmNhbnZhcy5oZWlnaHQgPSBmb250U2l6ZSAqICh0aGlzLmxhYmVsTGluZXMubGVuZ3RoICsgMSkgKyBsZWFmTWFyZ2luVG9wICsgbGVhZk1hcmdpbkJvdHRvbTtcbiAgICAgICAgICAgIHRoaXMuY3R4LmZvbnQgPSBmb250U2l6ZSArIFwicHggXCIgKyBmb250RmFtaWx5O1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmxhYmVsTGluZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICB0aGlzLmN0eC5maWxsVGV4dCh0aGlzLmxhYmVsTGluZXNbaV0sIDAsIGZvbnRTaXplICogKGkgKyAxKSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIFRoZSBhbmNob3JQb2ludCBkZWZpbmVzIHdoZXJlIHRoZSBsaW5lIHNob3VsZCBzdGFydFxuICAgICAgICAgICAgdGhpcy5hbmNob3JQb2ludCA9IHt4OiAwLCB5OiAodGhpcy5sYWJlbExpbmVzLmxlbmd0aCAqIGZvbnRTaXplKSArIGxhYmVsUGFkZGluZ0JvdHRvbX07XG4gICAgICAgIH1cblxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIC8vIElmIHRoaXMgaXMgdGhlIHJvb3QsIHdlIG5lZWQgdG8gZ2VuZXJhdGUgYSByYW5kb20gY29sb3IgZm9yIGVhY2ggYnJhbmNoXG4gICAgICAgICAgICBpZiAodGhpcy5pc1Jvb3QpIHtcbiAgICAgICAgICAgICAgICB2YXIgYnJhbmNoQ29sb3JzID0gdGhpcy5jaGlsZHJlbi5tYXAoYyA9PiB1dGlscy5nZW5lcmF0ZVJhbmRvbUNvbG9yKCkpO1xuICAgICAgICAgICAgICAgIHZhciBjYW52YXNlcyA9IHRoaXMuY2hpbGRyZW4ubWFwKChjLCBpKSA9PiBjLmRyYXcoYnJhbmNoQ29sb3JzW2ldKSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIE90aGVyd2lzZSwgdXNlZCB0aGUgcmVjZWl2ZWQgYnJhbmNoQ29sb3JcbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHZhciBjYW52YXNlcyA9IHRoaXMuY2hpbGRyZW4ubWFwKChjLCBpKSA9PiBjLmRyYXcoY3VycmVudEJyYW5jaENvbG9yKSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIEdldCB0aGUgdmVydGljYWwgcG9zaXRpb25zIGZvciB0aGUgY2hpbGRyZW5cbiAgICAgICAgICAgIHZhciB2ZXJ0aWNhbF9wb3NpdGlvbnMgPSBbMF07XG5cbiAgICAgICAgICAgIC8vIEVhY2ggcG9zaXRpb24gaXMgdGhlIHN1bSBvZiB0aGUgYWN1bW11bGF0ZWQgaGVpZ2h0cyBvZiB0aGUgcHJldmlvdXMgZWxlbWVudHNcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY2FudmFzZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICB2ZXJ0aWNhbF9wb3NpdGlvbnNbaSArIDFdID0gdmVydGljYWxfcG9zaXRpb25zW2ldICsgY2FudmFzZXNbaV0uaGVpZ2h0O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBDb21wdXRlIGxlZnQgbWFyZ2luIChsYWJlbCB3aWR0aCArIHNlcGFyYXRpb24pXG4gICAgICAgICAgICB2YXIgbGVmdE1hcmdpbiA9IDEwICsgdGhpcy5sYWJlbFdpZHRoICsgY29ubmVjdG9yV2lkdGg7XG5cbiAgICAgICAgICAgIC8vIFNldCB0aGUgd2lkdGggdG8gdGhlIGxlZnRNYXJnaW4gcGx1cyB0aGUgd2lkdGggb2YgdGhlIHdpZGVzdCBjaGlsZCBicmFuY2hcbiAgICAgICAgICAgIHRoaXMuY2FudmFzLndpZHRoID0gbGVmdE1hcmdpbiArIE1hdGgubWF4KC4uLmNhbnZhc2VzLm1hcChjID0+IGMud2lkdGgpKTtcbiAgICAgICAgICAgIHRoaXMuY2FudmFzLmhlaWdodCA9IHZlcnRpY2FsX3Bvc2l0aW9uc1tjYW52YXNlcy5sZW5ndGhdICsgNTtcbiAgICAgICAgICAgIHRoaXMuY3R4LmZvbnQgPSBmb250U2l6ZSArIFwicHggXCIgKyBmb250RmFtaWx5O1xuXG4gICAgICAgICAgICBpZiAodGhpcy5pc1Jvb3QpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmFuY2hvclBvaW50ID0ge3g6IDEwLCB5OiB0aGlzLmNhbnZhcy5oZWlnaHQgLyAyICsgZm9udFNpemUgLyAyfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuYW5jaG9yUG9pbnQgPSB7eDogMCwgeTogdGhpcy5jYW52YXMuaGVpZ2h0IC8gMiArIGZvbnRTaXplIC8gMiArIGxhYmVsUGFkZGluZ0JvdHRvbX07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY2FudmFzZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5pc1Jvb3QpIHtcbiAgICAgICAgICAgICAgICAgICAgY3VycmVudEJyYW5jaENvbG9yID0gYnJhbmNoQ29sb3JzW2ldO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHRoaXMuY3R4LmRyYXdJbWFnZShjYW52YXNlc1tpXSwgbGVmdE1hcmdpbiwgdmVydGljYWxfcG9zaXRpb25zW2ldKTtcblxuICAgICAgICAgICAgICAgIHZhciBjb25uZWN0b3JfYSA9IHtcbiAgICAgICAgICAgICAgICAgICAgeDogdGhpcy5hbmNob3JQb2ludC54ICsgdGhpcy5sYWJlbFdpZHRoICsgbGFiZWxQYWRkaW5nUmlnaHQsXG4gICAgICAgICAgICAgICAgICAgIHk6IHRoaXMuYW5jaG9yUG9pbnQueVxuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICB2YXIgY29ubmVjdG9yX2IgPSB7XG4gICAgICAgICAgICAgICAgICAgIHg6IGxlZnRNYXJnaW4sXG4gICAgICAgICAgICAgICAgICAgIHk6IHZlcnRpY2FsX3Bvc2l0aW9uc1tpXSArIHRoaXMuY2hpbGRyZW5baV0uYW5jaG9yUG9pbnQueVxuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICB0aGlzLmN0eC5iZWdpblBhdGgoKTtcbiAgICAgICAgICAgICAgICB0aGlzLmN0eC5tb3ZlVG8oY29ubmVjdG9yX2EueCwgY29ubmVjdG9yX2EueSk7XG5cbiAgICAgICAgICAgICAgICB0aGlzLmN0eC5iZXppZXJDdXJ2ZVRvKFxuICAgICAgICAgICAgICAgICAgICBjb25uZWN0b3JfYS54ICsgY29ubmVjdG9yU3RlZXBuZXNzICogY29ubmVjdG9yV2lkdGgsIGNvbm5lY3Rvcl9hLnksXG4gICAgICAgICAgICAgICAgICAgIGNvbm5lY3Rvcl9iLnggLSBjb25uZWN0b3JTdGVlcG5lc3MgKiBjb25uZWN0b3JXaWR0aCwgY29ubmVjdG9yX2IueSxcbiAgICAgICAgICAgICAgICAgICAgY29ubmVjdG9yX2IueCwgY29ubmVjdG9yX2IueVxuICAgICAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgICAgICB0aGlzLmN0eC5saW5lVG8oXG4gICAgICAgICAgICAgICAgICAgIGNvbm5lY3Rvcl9iLnggKyB0aGlzLmNoaWxkcmVuW2ldLmxhYmVsV2lkdGggKyBsYWJlbFBhZGRpbmdSaWdodCxcbiAgICAgICAgICAgICAgICAgICAgY29ubmVjdG9yX2IueVxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgdGhpcy5jdHgubGluZVdpZHRoID0gY29ubmVjdG9yTGluZVdpZHRoO1xuICAgICAgICAgICAgICAgIHRoaXMuY3R4LmxpbmVDYXAgPSBcInJvdW5kXCI7XG4gICAgICAgICAgICAgICAgdGhpcy5jdHguc3Ryb2tlU3R5bGUgPSBjdXJyZW50QnJhbmNoQ29sb3I7XG4gICAgICAgICAgICAgICAgdGhpcy5jdHguc3Ryb2tlKCk7XG4gICAgICAgICAgICB9XG5cblxuICAgICAgICAgICAgaWYgKHRoaXMuaXNSb290KSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jdHguZmlsbFN0eWxlID0gXCIjZmZmZmZmXCI7XG4gICAgICAgICAgICAgICAgdGhpcy5jdHgubGluZVdpZHRoID0gMztcbiAgICAgICAgICAgICAgICB1dGlscy5yb3VuZFJlY3QodGhpcy5jdHgsXG4gICAgICAgICAgICAgICAgICAgIDIsIHRoaXMuY2FudmFzLmhlaWdodCAvIDIgLSAodGhpcy5sYWJlbExpbmVzLmxlbmd0aCkgKiBmb250U2l6ZSxcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5sYWJlbFdpZHRoICsgMTgsIGZvbnRTaXplICogKHRoaXMubGFiZWxMaW5lcy5sZW5ndGggKyAxLjUpLFxuICAgICAgICAgICAgICAgICAgICA1LCB0cnVlLCB0cnVlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuY3R4LmZpbGxTdHlsZSA9IFwiIzAwMDAwMFwiO1xuXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMubGFiZWxMaW5lcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIHRoaXMuY3R4LmZpbGxUZXh0KFxuICAgICAgICAgICAgICAgICAgICB0aGlzLmxhYmVsTGluZXNbaV0sXG4gICAgICAgICAgICAgICAgICAgIDEwLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEZpeGVkIG1hcmdpbiBmcm9tIHRoZSBsZWZ0XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY2FudmFzLmhlaWdodCAvIDIgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFZlcnRpY2FsIGNlbnRlclxuICAgICAgICAgICAgICAgICAgICArIGZvbnRTaXplIC8gMiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBNaWRkbGUgb2YgdGhlIGxpbmUgaGVpZ2h0XG4gICAgICAgICAgICAgICAgICAgIC0gZm9udFNpemUgKiAodGhpcy5sYWJlbExpbmVzLmxlbmd0aCAtIGkgLSAxKSAgIC8vIENvcnJlY3RseSBhY2NvdW50IGZvciBtdWx0aWxpbmVzXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzLmNhbnZhcztcbiAgICB9XG59O1xuIiwiLyoqXG4gKiBEcmF3cyBhIHJvdW5kZWQgcmVjdGFuZ2xlIHVzaW5nIHRoZSBjdXJyZW50IHN0YXRlIG9mIHRoZSBjYW52YXMuXG4gKiBJZiB5b3Ugb21pdCB0aGUgbGFzdCB0aHJlZSBwYXJhbXMsIGl0IHdpbGwgZHJhdyBhIHJlY3RhbmdsZVxuICogb3V0bGluZSB3aXRoIGEgNSBwaXhlbCBib3JkZXIgcmFkaXVzXG4gKiBAcGFyYW0ge0NhbnZhc1JlbmRlcmluZ0NvbnRleHQyRH0gY3R4XG4gKiBAcGFyYW0ge051bWJlcn0geCBUaGUgdG9wIGxlZnQgeCBjb29yZGluYXRlXG4gKiBAcGFyYW0ge051bWJlcn0geSBUaGUgdG9wIGxlZnQgeSBjb29yZGluYXRlXG4gKiBAcGFyYW0ge051bWJlcn0gd2lkdGggVGhlIHdpZHRoIG9mIHRoZSByZWN0YW5nbGVcbiAqIEBwYXJhbSB7TnVtYmVyfSBoZWlnaHQgVGhlIGhlaWdodCBvZiB0aGUgcmVjdGFuZ2xlXG4gKiBAcGFyYW0ge051bWJlcn0gW3JhZGl1cyA9IDVdIFRoZSBjb3JuZXIgcmFkaXVzOyBJdCBjYW4gYWxzbyBiZSBhbiBvYmplY3RcbiAqICAgICAgICAgICAgICAgICB0byBzcGVjaWZ5IGRpZmZlcmVudCByYWRpaSBmb3IgY29ybmVyc1xuICogQHBhcmFtIHtOdW1iZXJ9IFtyYWRpdXMudGwgPSAwXSBUb3AgbGVmdFxuICogQHBhcmFtIHtOdW1iZXJ9IFtyYWRpdXMudHIgPSAwXSBUb3AgcmlnaHRcbiAqIEBwYXJhbSB7TnVtYmVyfSBbcmFkaXVzLmJyID0gMF0gQm90dG9tIHJpZ2h0XG4gKiBAcGFyYW0ge051bWJlcn0gW3JhZGl1cy5ibCA9IDBdIEJvdHRvbSBsZWZ0XG4gKiBAcGFyYW0ge0Jvb2xlYW59IFtmaWxsID0gZmFsc2VdIFdoZXRoZXIgdG8gZmlsbCB0aGUgcmVjdGFuZ2xlLlxuICogQHBhcmFtIHtCb29sZWFufSBbc3Ryb2tlID0gdHJ1ZV0gV2hldGhlciB0byBzdHJva2UgdGhlIHJlY3RhbmdsZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJvdW5kUmVjdChjdHgsIHgsIHksIHdpZHRoLCBoZWlnaHQsIHJhZGl1cywgZmlsbCwgc3Ryb2tlKSB7XG4gICAgaWYgKHR5cGVvZiBzdHJva2UgPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgc3Ryb2tlID0gdHJ1ZTtcbiAgICB9XG4gICAgaWYgKHR5cGVvZiByYWRpdXMgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIHJhZGl1cyA9IDU7XG4gICAgfVxuICAgIGlmICh0eXBlb2YgcmFkaXVzID09PSAnbnVtYmVyJykge1xuICAgICAgICByYWRpdXMgPSB7dGw6IHJhZGl1cywgdHI6IHJhZGl1cywgYnI6IHJhZGl1cywgYmw6IHJhZGl1c307XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdmFyIGRlZmF1bHRSYWRpdXMgPSB7dGw6IDAsIHRyOiAwLCBicjogMCwgYmw6IDB9O1xuICAgICAgICBmb3IgKHZhciBzaWRlIGluIGRlZmF1bHRSYWRpdXMpIHtcbiAgICAgICAgICAgIHJhZGl1c1tzaWRlXSA9IHJhZGl1c1tzaWRlXSB8fCBkZWZhdWx0UmFkaXVzW3NpZGVdO1xuICAgICAgICB9XG4gICAgfVxuICAgIGN0eC5iZWdpblBhdGgoKTtcbiAgICBjdHgubW92ZVRvKHggKyByYWRpdXMudGwsIHkpO1xuICAgIGN0eC5saW5lVG8oeCArIHdpZHRoIC0gcmFkaXVzLnRyLCB5KTtcbiAgICBjdHgucXVhZHJhdGljQ3VydmVUbyh4ICsgd2lkdGgsIHksIHggKyB3aWR0aCwgeSArIHJhZGl1cy50cik7XG4gICAgY3R4LmxpbmVUbyh4ICsgd2lkdGgsIHkgKyBoZWlnaHQgLSByYWRpdXMuYnIpO1xuICAgIGN0eC5xdWFkcmF0aWNDdXJ2ZVRvKHggKyB3aWR0aCwgeSArIGhlaWdodCwgeCArIHdpZHRoIC0gcmFkaXVzLmJyLCB5ICsgaGVpZ2h0KTtcbiAgICBjdHgubGluZVRvKHggKyByYWRpdXMuYmwsIHkgKyBoZWlnaHQpO1xuICAgIGN0eC5xdWFkcmF0aWNDdXJ2ZVRvKHgsIHkgKyBoZWlnaHQsIHgsIHkgKyBoZWlnaHQgLSByYWRpdXMuYmwpO1xuICAgIGN0eC5saW5lVG8oeCwgeSArIHJhZGl1cy50bCk7XG4gICAgY3R4LnF1YWRyYXRpY0N1cnZlVG8oeCwgeSwgeCArIHJhZGl1cy50bCwgeSk7XG4gICAgY3R4LmNsb3NlUGF0aCgpO1xuICAgIGlmIChmaWxsKSB7XG4gICAgICAgIGN0eC5maWxsKCk7XG4gICAgfVxuICAgIGlmIChzdHJva2UpIHtcbiAgICAgICAgY3R4LnN0cm9rZSgpO1xuICAgIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFJhbmRvbUludChtaW4sIG1heCkge1xuICByZXR1cm4gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogKG1heCAtIG1pbikpICsgbWluO1xufVxuXG5cbmZ1bmN0aW9uIGNvbXBvbmVudFRvSGV4KGMpIHtcbiAgICB2YXIgaGV4ID0gYy50b1N0cmluZygxNik7XG4gICAgcmV0dXJuIGhleC5sZW5ndGggPT0gMSA/IFwiMFwiICsgaGV4IDogaGV4O1xufVxuXG5mdW5jdGlvbiByZ2JUb0hleChyLCBnLCBiKSB7XG4gICAgcmV0dXJuIFwiI1wiICsgY29tcG9uZW50VG9IZXgocikgKyBjb21wb25lbnRUb0hleChnKSArIGNvbXBvbmVudFRvSGV4KGIpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2VuZXJhdGVSYW5kb21Db2xvcihiYXNlQ29sb3IgPSBbMjU2LCAyNTYsIDI1Nl0pIHtcblxuICAgIHZhciByZWQgPSBnZXRSYW5kb21JbnQoMCwgMjU2KTtcbiAgICB2YXIgZ3JlZW4gPSBnZXRSYW5kb21JbnQoMCwgMjU2KTtcbiAgICB2YXIgYmx1ZSA9IGdldFJhbmRvbUludCgwLCAyNTYpO1xuXG4gICAgLy8gbWl4IHRoZSBjb2xvclxuXG4gICAgdmFyIG1peHR1cmUgPSAwLjc7XG5cbiAgICByZWQgPSBNYXRoLnJvdW5kKHJlZCAqIG1peHR1cmUgKyBiYXNlQ29sb3JbMF0gKiAoMSAtIG1peHR1cmUpKTtcbiAgICBncmVlbiA9IE1hdGgucm91bmQoZ3JlZW4gKiBtaXh0dXJlICsgYmFzZUNvbG9yWzFdICogKDEgLSBtaXh0dXJlKSk7XG4gICAgYmx1ZSA9IE1hdGgucm91bmQoYmx1ZSAqIG1peHR1cmUgKyBiYXNlQ29sb3JbMl0gKiAoMSAtIG1peHR1cmUpKTtcblxuICAgIC8vXG4gICAgLy9yZWQgPSBNYXRoLnJvdW5kKChyZWQgKyBiYXNlQ29sb3JbMF0pIC8gMik7XG4gICAgLy9ncmVlbiA9IE1hdGgucm91bmQoKGdyZWVuICsgYmFzZUNvbG9yWzFdKSAvIDIpO1xuICAgIC8vYmx1ZSA9IE1hdGgucm91bmQoKGJsdWUgKyBiYXNlQ29sb3JbMl0pIC8gMik7XG5cbiAgICByZXR1cm4gcmdiVG9IZXgocmVkLCBncmVlbiwgYmx1ZSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRMb3JlbUlwc3VtIChudW1Xb3Jkcz01KSB7XG4gICAgdmFyIGJhc2VUZXh0ID0gXCJMb3JlbSBpcHN1bSBkb2xvciBzaXQgYW1ldCwgY29uc2VjdGV0dXIgYWRpcGlzY2luZyBlbGl0LiBQaGFzZWxsdXMgZ3JhdmlkYSBldSBsZW8gdml0YWUgaW1wZXJkaWV0LiBOYW0gcHVsdmluYXIgbHVjdHVzIGFyY3UsIHZlbCBzZW1wZXIgbGlndWxhIGVmZmljaXR1ciBpbi4gTWF1cmlzIG5vbiBzZW1wZXIgYW50ZS4gTnVsbGFtIHNjZWxlcmlzcXVlIGhlbmRyZXJpdCB1cm5hLCBsYWNpbmlhIGVnZXN0YXMgZW5pbSBsYW9yZWV0IHZpdGFlLiBBbGlxdWFtIGVyYXQgdm9sdXRwYXQuIER1aXMgcG9zdWVyZSBtYWduYSBsaWJlcm8sIHZlbCByaG9uY3VzIG5pc2wgdWxsYW1jb3JwZXIgZXUuIEV0aWFtIGFjIGxpYmVybyBjb25zZWN0ZXR1ciwgY29uZ3VlIG5pc2kgcXVpcywgdnVscHV0YXRlIGVyYXQuXCI7XG4gICAgdmFyIHNlbnRlbmNlcyA9IGJhc2VUZXh0LnNwbGl0KFwiLlwiKTtcbiAgICB2YXIgc2VudGVuY2VzX3dvcmRzID0gc2VudGVuY2VzLm1hcChzID0+IHMuc3BsaXQoL1tcXHNcXC4sXS8pKTtcblxuICAgIHZhciBjaG9zZW5TZW50ZW5jZU51bWJlciA9IGdldFJhbmRvbUludCgwLCBzZW50ZW5jZXMubGVuZ3RoIC0gMSk7XG4gICAgdmFyIGNob3NlbldvcmRzID0gc2VudGVuY2VzX3dvcmRzW2Nob3NlblNlbnRlbmNlTnVtYmVyXS5zbGljZSgwLCBudW1Xb3Jkcykuam9pbihcIiBcIik7XG5cbiAgICByZXR1cm4gY2hvc2VuV29yZHM7XG59XG4iXX0=
