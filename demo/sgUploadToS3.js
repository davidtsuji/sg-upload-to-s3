;(function(){

/**
 * Require the given path.
 *
 * @param {String} path
 * @return {Object} exports
 * @api public
 */

function require(path, parent, orig) {
  var resolved = require.resolve(path);

  // lookup failed
  if (null == resolved) {
    orig = orig || path;
    parent = parent || 'root';
    var err = new Error('Failed to require "' + orig + '" from "' + parent + '"');
    err.path = orig;
    err.parent = parent;
    err.require = true;
    throw err;
  }

  var module = require.modules[resolved];

  // perform real require()
  // by invoking the module's
  // registered function
  if (!module.exports) {
    module.exports = {};
    module.client = module.component = true;
    module.call(this, module.exports, require.relative(resolved), module);
  }

  return module.exports;
}

/**
 * Registered modules.
 */

require.modules = {};

/**
 * Registered aliases.
 */

require.aliases = {};

/**
 * Resolve `path`.
 *
 * Lookup:
 *
 *   - PATH/index.js
 *   - PATH.js
 *   - PATH
 *
 * @param {String} path
 * @return {String} path or null
 * @api private
 */

require.resolve = function(path) {
  if (path.charAt(0) === '/') path = path.slice(1);

  var paths = [
    path,
    path + '.js',
    path + '.json',
    path + '/index.js',
    path + '/index.json'
  ];

  for (var i = 0; i < paths.length; i++) {
    var path = paths[i];
    if (require.modules.hasOwnProperty(path)) return path;
    if (require.aliases.hasOwnProperty(path)) return require.aliases[path];
  }
};

/**
 * Normalize `path` relative to the current path.
 *
 * @param {String} curr
 * @param {String} path
 * @return {String}
 * @api private
 */

require.normalize = function(curr, path) {
  var segs = [];

  if ('.' != path.charAt(0)) return path;

  curr = curr.split('/');
  path = path.split('/');

  for (var i = 0; i < path.length; ++i) {
    if ('..' == path[i]) {
      curr.pop();
    } else if ('.' != path[i] && '' != path[i]) {
      segs.push(path[i]);
    }
  }

  return curr.concat(segs).join('/');
};

/**
 * Register module at `path` with callback `definition`.
 *
 * @param {String} path
 * @param {Function} definition
 * @api private
 */

require.register = function(path, definition) {
  require.modules[path] = definition;
};

/**
 * Alias a module definition.
 *
 * @param {String} from
 * @param {String} to
 * @api private
 */

require.alias = function(from, to) {
  if (!require.modules.hasOwnProperty(from)) {
    throw new Error('Failed to alias "' + from + '", it does not exist');
  }
  require.aliases[to] = from;
};

/**
 * Return a require function relative to the `parent` path.
 *
 * @param {String} parent
 * @return {Function}
 * @api private
 */

require.relative = function(parent) {
  var p = require.normalize(parent, '..');

  /**
   * lastIndexOf helper.
   */

  function lastIndexOf(arr, obj) {
    var i = arr.length;
    while (i--) {
      if (arr[i] === obj) return i;
    }
    return -1;
  }

  /**
   * The relative require() itself.
   */

  function localRequire(path) {
    var resolved = localRequire.resolve(path);
    return require(resolved, parent, path);
  }

  /**
   * Resolve relative to the parent.
   */

  localRequire.resolve = function(path) {
    var c = path.charAt(0);
    if ('/' == c) return path.slice(1);
    if ('.' == c) return require.normalize(p, path);

    // resolve deps by returning
    // the dep in the nearest "deps"
    // directory
    var segs = parent.split('/');
    var i = lastIndexOf(segs, 'deps') + 1;
    if (!i) i = 0;
    path = segs.slice(0, i + 1).join('/') + '/deps/' + path;
    return path;
  };

  /**
   * Check if module is defined at `path`.
   */

  localRequire.exists = function(path) {
    return require.modules.hasOwnProperty(localRequire.resolve(path));
  };

  return localRequire;
};
require.register("caolan-async/lib/async.js", function(exports, require, module){
/*global setImmediate: false, setTimeout: false, console: false */
(function () {

    var async = {};

    // global on the server, window in the browser
    var root, previous_async;

    root = this;
    if (root != null) {
      previous_async = root.async;
    }

    async.noConflict = function () {
        root.async = previous_async;
        return async;
    };

    function only_once(fn) {
        var called = false;
        return function() {
            if (called) throw new Error("Callback was already called.");
            called = true;
            fn.apply(root, arguments);
        }
    }

    //// cross-browser compatiblity functions ////

    var _each = function (arr, iterator) {
        if (arr.forEach) {
            return arr.forEach(iterator);
        }
        for (var i = 0; i < arr.length; i += 1) {
            iterator(arr[i], i, arr);
        }
    };

    var _map = function (arr, iterator) {
        if (arr.map) {
            return arr.map(iterator);
        }
        var results = [];
        _each(arr, function (x, i, a) {
            results.push(iterator(x, i, a));
        });
        return results;
    };

    var _reduce = function (arr, iterator, memo) {
        if (arr.reduce) {
            return arr.reduce(iterator, memo);
        }
        _each(arr, function (x, i, a) {
            memo = iterator(memo, x, i, a);
        });
        return memo;
    };

    var _keys = function (obj) {
        if (Object.keys) {
            return Object.keys(obj);
        }
        var keys = [];
        for (var k in obj) {
            if (obj.hasOwnProperty(k)) {
                keys.push(k);
            }
        }
        return keys;
    };

    //// exported async module functions ////

    //// nextTick implementation with browser-compatible fallback ////
    if (typeof process === 'undefined' || !(process.nextTick)) {
        if (typeof setImmediate === 'function') {
            async.nextTick = function (fn) {
                // not a direct alias for IE10 compatibility
                setImmediate(fn);
            };
            async.setImmediate = async.nextTick;
        }
        else {
            async.nextTick = function (fn) {
                setTimeout(fn, 0);
            };
            async.setImmediate = async.nextTick;
        }
    }
    else {
        async.nextTick = process.nextTick;
        if (typeof setImmediate !== 'undefined') {
            async.setImmediate = setImmediate;
        }
        else {
            async.setImmediate = async.nextTick;
        }
    }

    async.each = function (arr, iterator, callback) {
        callback = callback || function () {};
        if (!arr.length) {
            return callback();
        }
        var completed = 0;
        _each(arr, function (x) {
            iterator(x, only_once(function (err) {
                if (err) {
                    callback(err);
                    callback = function () {};
                }
                else {
                    completed += 1;
                    if (completed >= arr.length) {
                        callback(null);
                    }
                }
            }));
        });
    };
    async.forEach = async.each;

    async.eachSeries = function (arr, iterator, callback) {
        callback = callback || function () {};
        if (!arr.length) {
            return callback();
        }
        var completed = 0;
        var iterate = function () {
            iterator(arr[completed], function (err) {
                if (err) {
                    callback(err);
                    callback = function () {};
                }
                else {
                    completed += 1;
                    if (completed >= arr.length) {
                        callback(null);
                    }
                    else {
                        iterate();
                    }
                }
            });
        };
        iterate();
    };
    async.forEachSeries = async.eachSeries;

    async.eachLimit = function (arr, limit, iterator, callback) {
        var fn = _eachLimit(limit);
        fn.apply(null, [arr, iterator, callback]);
    };
    async.forEachLimit = async.eachLimit;

    var _eachLimit = function (limit) {

        return function (arr, iterator, callback) {
            callback = callback || function () {};
            if (!arr.length || limit <= 0) {
                return callback();
            }
            var completed = 0;
            var started = 0;
            var running = 0;

            (function replenish () {
                if (completed >= arr.length) {
                    return callback();
                }

                while (running < limit && started < arr.length) {
                    started += 1;
                    running += 1;
                    iterator(arr[started - 1], function (err) {
                        if (err) {
                            callback(err);
                            callback = function () {};
                        }
                        else {
                            completed += 1;
                            running -= 1;
                            if (completed >= arr.length) {
                                callback();
                            }
                            else {
                                replenish();
                            }
                        }
                    });
                }
            })();
        };
    };


    var doParallel = function (fn) {
        return function () {
            var args = Array.prototype.slice.call(arguments);
            return fn.apply(null, [async.each].concat(args));
        };
    };
    var doParallelLimit = function(limit, fn) {
        return function () {
            var args = Array.prototype.slice.call(arguments);
            return fn.apply(null, [_eachLimit(limit)].concat(args));
        };
    };
    var doSeries = function (fn) {
        return function () {
            var args = Array.prototype.slice.call(arguments);
            return fn.apply(null, [async.eachSeries].concat(args));
        };
    };


    var _asyncMap = function (eachfn, arr, iterator, callback) {
        var results = [];
        arr = _map(arr, function (x, i) {
            return {index: i, value: x};
        });
        eachfn(arr, function (x, callback) {
            iterator(x.value, function (err, v) {
                results[x.index] = v;
                callback(err);
            });
        }, function (err) {
            callback(err, results);
        });
    };
    async.map = doParallel(_asyncMap);
    async.mapSeries = doSeries(_asyncMap);
    async.mapLimit = function (arr, limit, iterator, callback) {
        return _mapLimit(limit)(arr, iterator, callback);
    };

    var _mapLimit = function(limit) {
        return doParallelLimit(limit, _asyncMap);
    };

    // reduce only has a series version, as doing reduce in parallel won't
    // work in many situations.
    async.reduce = function (arr, memo, iterator, callback) {
        async.eachSeries(arr, function (x, callback) {
            iterator(memo, x, function (err, v) {
                memo = v;
                callback(err);
            });
        }, function (err) {
            callback(err, memo);
        });
    };
    // inject alias
    async.inject = async.reduce;
    // foldl alias
    async.foldl = async.reduce;

    async.reduceRight = function (arr, memo, iterator, callback) {
        var reversed = _map(arr, function (x) {
            return x;
        }).reverse();
        async.reduce(reversed, memo, iterator, callback);
    };
    // foldr alias
    async.foldr = async.reduceRight;

    var _filter = function (eachfn, arr, iterator, callback) {
        var results = [];
        arr = _map(arr, function (x, i) {
            return {index: i, value: x};
        });
        eachfn(arr, function (x, callback) {
            iterator(x.value, function (v) {
                if (v) {
                    results.push(x);
                }
                callback();
            });
        }, function (err) {
            callback(_map(results.sort(function (a, b) {
                return a.index - b.index;
            }), function (x) {
                return x.value;
            }));
        });
    };
    async.filter = doParallel(_filter);
    async.filterSeries = doSeries(_filter);
    // select alias
    async.select = async.filter;
    async.selectSeries = async.filterSeries;

    var _reject = function (eachfn, arr, iterator, callback) {
        var results = [];
        arr = _map(arr, function (x, i) {
            return {index: i, value: x};
        });
        eachfn(arr, function (x, callback) {
            iterator(x.value, function (v) {
                if (!v) {
                    results.push(x);
                }
                callback();
            });
        }, function (err) {
            callback(_map(results.sort(function (a, b) {
                return a.index - b.index;
            }), function (x) {
                return x.value;
            }));
        });
    };
    async.reject = doParallel(_reject);
    async.rejectSeries = doSeries(_reject);

    var _detect = function (eachfn, arr, iterator, main_callback) {
        eachfn(arr, function (x, callback) {
            iterator(x, function (result) {
                if (result) {
                    main_callback(x);
                    main_callback = function () {};
                }
                else {
                    callback();
                }
            });
        }, function (err) {
            main_callback();
        });
    };
    async.detect = doParallel(_detect);
    async.detectSeries = doSeries(_detect);

    async.some = function (arr, iterator, main_callback) {
        async.each(arr, function (x, callback) {
            iterator(x, function (v) {
                if (v) {
                    main_callback(true);
                    main_callback = function () {};
                }
                callback();
            });
        }, function (err) {
            main_callback(false);
        });
    };
    // any alias
    async.any = async.some;

    async.every = function (arr, iterator, main_callback) {
        async.each(arr, function (x, callback) {
            iterator(x, function (v) {
                if (!v) {
                    main_callback(false);
                    main_callback = function () {};
                }
                callback();
            });
        }, function (err) {
            main_callback(true);
        });
    };
    // all alias
    async.all = async.every;

    async.sortBy = function (arr, iterator, callback) {
        async.map(arr, function (x, callback) {
            iterator(x, function (err, criteria) {
                if (err) {
                    callback(err);
                }
                else {
                    callback(null, {value: x, criteria: criteria});
                }
            });
        }, function (err, results) {
            if (err) {
                return callback(err);
            }
            else {
                var fn = function (left, right) {
                    var a = left.criteria, b = right.criteria;
                    return a < b ? -1 : a > b ? 1 : 0;
                };
                callback(null, _map(results.sort(fn), function (x) {
                    return x.value;
                }));
            }
        });
    };

    async.auto = function (tasks, callback) {
        callback = callback || function () {};
        var keys = _keys(tasks);
        if (!keys.length) {
            return callback(null);
        }

        var results = {};

        var listeners = [];
        var addListener = function (fn) {
            listeners.unshift(fn);
        };
        var removeListener = function (fn) {
            for (var i = 0; i < listeners.length; i += 1) {
                if (listeners[i] === fn) {
                    listeners.splice(i, 1);
                    return;
                }
            }
        };
        var taskComplete = function () {
            _each(listeners.slice(0), function (fn) {
                fn();
            });
        };

        addListener(function () {
            if (_keys(results).length === keys.length) {
                callback(null, results);
                callback = function () {};
            }
        });

        _each(keys, function (k) {
            var task = (tasks[k] instanceof Function) ? [tasks[k]]: tasks[k];
            var taskCallback = function (err) {
                var args = Array.prototype.slice.call(arguments, 1);
                if (args.length <= 1) {
                    args = args[0];
                }
                if (err) {
                    var safeResults = {};
                    _each(_keys(results), function(rkey) {
                        safeResults[rkey] = results[rkey];
                    });
                    safeResults[k] = args;
                    callback(err, safeResults);
                    // stop subsequent errors hitting callback multiple times
                    callback = function () {};
                }
                else {
                    results[k] = args;
                    async.setImmediate(taskComplete);
                }
            };
            var requires = task.slice(0, Math.abs(task.length - 1)) || [];
            var ready = function () {
                return _reduce(requires, function (a, x) {
                    return (a && results.hasOwnProperty(x));
                }, true) && !results.hasOwnProperty(k);
            };
            if (ready()) {
                task[task.length - 1](taskCallback, results);
            }
            else {
                var listener = function () {
                    if (ready()) {
                        removeListener(listener);
                        task[task.length - 1](taskCallback, results);
                    }
                };
                addListener(listener);
            }
        });
    };

    async.waterfall = function (tasks, callback) {
        callback = callback || function () {};
        if (tasks.constructor !== Array) {
          var err = new Error('First argument to waterfall must be an array of functions');
          return callback(err);
        }
        if (!tasks.length) {
            return callback();
        }
        var wrapIterator = function (iterator) {
            return function (err) {
                if (err) {
                    callback.apply(null, arguments);
                    callback = function () {};
                }
                else {
                    var args = Array.prototype.slice.call(arguments, 1);
                    var next = iterator.next();
                    if (next) {
                        args.push(wrapIterator(next));
                    }
                    else {
                        args.push(callback);
                    }
                    async.setImmediate(function () {
                        iterator.apply(null, args);
                    });
                }
            };
        };
        wrapIterator(async.iterator(tasks))();
    };

    var _parallel = function(eachfn, tasks, callback) {
        callback = callback || function () {};
        if (tasks.constructor === Array) {
            eachfn.map(tasks, function (fn, callback) {
                if (fn) {
                    fn(function (err) {
                        var args = Array.prototype.slice.call(arguments, 1);
                        if (args.length <= 1) {
                            args = args[0];
                        }
                        callback.call(null, err, args);
                    });
                }
            }, callback);
        }
        else {
            var results = {};
            eachfn.each(_keys(tasks), function (k, callback) {
                tasks[k](function (err) {
                    var args = Array.prototype.slice.call(arguments, 1);
                    if (args.length <= 1) {
                        args = args[0];
                    }
                    results[k] = args;
                    callback(err);
                });
            }, function (err) {
                callback(err, results);
            });
        }
    };

    async.parallel = function (tasks, callback) {
        _parallel({ map: async.map, each: async.each }, tasks, callback);
    };

    async.parallelLimit = function(tasks, limit, callback) {
        _parallel({ map: _mapLimit(limit), each: _eachLimit(limit) }, tasks, callback);
    };

    async.series = function (tasks, callback) {
        callback = callback || function () {};
        if (tasks.constructor === Array) {
            async.mapSeries(tasks, function (fn, callback) {
                if (fn) {
                    fn(function (err) {
                        var args = Array.prototype.slice.call(arguments, 1);
                        if (args.length <= 1) {
                            args = args[0];
                        }
                        callback.call(null, err, args);
                    });
                }
            }, callback);
        }
        else {
            var results = {};
            async.eachSeries(_keys(tasks), function (k, callback) {
                tasks[k](function (err) {
                    var args = Array.prototype.slice.call(arguments, 1);
                    if (args.length <= 1) {
                        args = args[0];
                    }
                    results[k] = args;
                    callback(err);
                });
            }, function (err) {
                callback(err, results);
            });
        }
    };

    async.iterator = function (tasks) {
        var makeCallback = function (index) {
            var fn = function () {
                if (tasks.length) {
                    tasks[index].apply(null, arguments);
                }
                return fn.next();
            };
            fn.next = function () {
                return (index < tasks.length - 1) ? makeCallback(index + 1): null;
            };
            return fn;
        };
        return makeCallback(0);
    };

    async.apply = function (fn) {
        var args = Array.prototype.slice.call(arguments, 1);
        return function () {
            return fn.apply(
                null, args.concat(Array.prototype.slice.call(arguments))
            );
        };
    };

    var _concat = function (eachfn, arr, fn, callback) {
        var r = [];
        eachfn(arr, function (x, cb) {
            fn(x, function (err, y) {
                r = r.concat(y || []);
                cb(err);
            });
        }, function (err) {
            callback(err, r);
        });
    };
    async.concat = doParallel(_concat);
    async.concatSeries = doSeries(_concat);

    async.whilst = function (test, iterator, callback) {
        if (test()) {
            iterator(function (err) {
                if (err) {
                    return callback(err);
                }
                async.whilst(test, iterator, callback);
            });
        }
        else {
            callback();
        }
    };

    async.doWhilst = function (iterator, test, callback) {
        iterator(function (err) {
            if (err) {
                return callback(err);
            }
            if (test()) {
                async.doWhilst(iterator, test, callback);
            }
            else {
                callback();
            }
        });
    };

    async.until = function (test, iterator, callback) {
        if (!test()) {
            iterator(function (err) {
                if (err) {
                    return callback(err);
                }
                async.until(test, iterator, callback);
            });
        }
        else {
            callback();
        }
    };

    async.doUntil = function (iterator, test, callback) {
        iterator(function (err) {
            if (err) {
                return callback(err);
            }
            if (!test()) {
                async.doUntil(iterator, test, callback);
            }
            else {
                callback();
            }
        });
    };

    async.queue = function (worker, concurrency) {
        if (concurrency === undefined) {
            concurrency = 1;
        }
        function _insert(q, data, pos, callback) {
          if(data.constructor !== Array) {
              data = [data];
          }
          _each(data, function(task) {
              var item = {
                  data: task,
                  callback: typeof callback === 'function' ? callback : null
              };

              if (pos) {
                q.tasks.unshift(item);
              } else {
                q.tasks.push(item);
              }

              if (q.saturated && q.tasks.length === concurrency) {
                  q.saturated();
              }
              async.setImmediate(q.process);
          });
        }

        var workers = 0;
        var q = {
            tasks: [],
            concurrency: concurrency,
            saturated: null,
            empty: null,
            drain: null,
            push: function (data, callback) {
              _insert(q, data, false, callback);
            },
            unshift: function (data, callback) {
              _insert(q, data, true, callback);
            },
            process: function () {
                if (workers < q.concurrency && q.tasks.length) {
                    var task = q.tasks.shift();
                    if (q.empty && q.tasks.length === 0) {
                        q.empty();
                    }
                    workers += 1;
                    var next = function () {
                        workers -= 1;
                        if (task.callback) {
                            task.callback.apply(task, arguments);
                        }
                        if (q.drain && q.tasks.length + workers === 0) {
                            q.drain();
                        }
                        q.process();
                    };
                    var cb = only_once(next);
                    worker(task.data, cb);
                }
            },
            length: function () {
                return q.tasks.length;
            },
            running: function () {
                return workers;
            }
        };
        return q;
    };

    async.cargo = function (worker, payload) {
        var working     = false,
            tasks       = [];

        var cargo = {
            tasks: tasks,
            payload: payload,
            saturated: null,
            empty: null,
            drain: null,
            push: function (data, callback) {
                if(data.constructor !== Array) {
                    data = [data];
                }
                _each(data, function(task) {
                    tasks.push({
                        data: task,
                        callback: typeof callback === 'function' ? callback : null
                    });
                    if (cargo.saturated && tasks.length === payload) {
                        cargo.saturated();
                    }
                });
                async.setImmediate(cargo.process);
            },
            process: function process() {
                if (working) return;
                if (tasks.length === 0) {
                    if(cargo.drain) cargo.drain();
                    return;
                }

                var ts = typeof payload === 'number'
                            ? tasks.splice(0, payload)
                            : tasks.splice(0);

                var ds = _map(ts, function (task) {
                    return task.data;
                });

                if(cargo.empty) cargo.empty();
                working = true;
                worker(ds, function () {
                    working = false;

                    var args = arguments;
                    _each(ts, function (data) {
                        if (data.callback) {
                            data.callback.apply(null, args);
                        }
                    });

                    process();
                });
            },
            length: function () {
                return tasks.length;
            },
            running: function () {
                return working;
            }
        };
        return cargo;
    };

    var _console_fn = function (name) {
        return function (fn) {
            var args = Array.prototype.slice.call(arguments, 1);
            fn.apply(null, args.concat([function (err) {
                var args = Array.prototype.slice.call(arguments, 1);
                if (typeof console !== 'undefined') {
                    if (err) {
                        if (console.error) {
                            console.error(err);
                        }
                    }
                    else if (console[name]) {
                        _each(args, function (x) {
                            console[name](x);
                        });
                    }
                }
            }]));
        };
    };
    async.log = _console_fn('log');
    async.dir = _console_fn('dir');
    /*async.info = _console_fn('info');
    async.warn = _console_fn('warn');
    async.error = _console_fn('error');*/

    async.memoize = function (fn, hasher) {
        var memo = {};
        var queues = {};
        hasher = hasher || function (x) {
            return x;
        };
        var memoized = function () {
            var args = Array.prototype.slice.call(arguments);
            var callback = args.pop();
            var key = hasher.apply(null, args);
            if (key in memo) {
                callback.apply(null, memo[key]);
            }
            else if (key in queues) {
                queues[key].push(callback);
            }
            else {
                queues[key] = [callback];
                fn.apply(null, args.concat([function () {
                    memo[key] = arguments;
                    var q = queues[key];
                    delete queues[key];
                    for (var i = 0, l = q.length; i < l; i++) {
                      q[i].apply(null, arguments);
                    }
                }]));
            }
        };
        memoized.memo = memo;
        memoized.unmemoized = fn;
        return memoized;
    };

    async.unmemoize = function (fn) {
      return function () {
        return (fn.unmemoized || fn).apply(null, arguments);
      };
    };

    async.times = function (count, iterator, callback) {
        var counter = [];
        for (var i = 0; i < count; i++) {
            counter.push(i);
        }
        return async.map(counter, iterator, callback);
    };

    async.timesSeries = function (count, iterator, callback) {
        var counter = [];
        for (var i = 0; i < count; i++) {
            counter.push(i);
        }
        return async.mapSeries(counter, iterator, callback);
    };

    async.compose = function (/* functions... */) {
        var fns = Array.prototype.reverse.call(arguments);
        return function () {
            var that = this;
            var args = Array.prototype.slice.call(arguments);
            var callback = args.pop();
            async.reduce(fns, args, function (newargs, fn, cb) {
                fn.apply(that, newargs.concat([function () {
                    var err = arguments[0];
                    var nextargs = Array.prototype.slice.call(arguments, 1);
                    cb(err, nextargs);
                }]))
            },
            function (err, results) {
                callback.apply(that, [err].concat(results));
            });
        };
    };

    var _applyEach = function (eachfn, fns /*args...*/) {
        var go = function () {
            var that = this;
            var args = Array.prototype.slice.call(arguments);
            var callback = args.pop();
            return eachfn(fns, function (fn, cb) {
                fn.apply(that, args.concat([cb]));
            },
            callback);
        };
        if (arguments.length > 2) {
            var args = Array.prototype.slice.call(arguments, 2);
            return go.apply(this, args);
        }
        else {
            return go;
        }
    };
    async.applyEach = doParallel(_applyEach);
    async.applyEachSeries = doSeries(_applyEach);

    async.forever = function (fn, callback) {
        function next(err) {
            if (err) {
                if (callback) {
                    return callback(err);
                }
                throw err;
            }
            fn(next);
        }
        next();
    };

    // AMD / RequireJS
    if (typeof define !== 'undefined' && define.amd) {
        define([], function () {
            return async;
        });
    }
    // Node.js
    else if (typeof module !== 'undefined' && module.exports) {
        module.exports = async;
    }
    // included directly via <script> tag
    else {
        root.async = async;
    }

}());

});
require.register("component-indexof/index.js", function(exports, require, module){
module.exports = function(arr, obj){
  if (arr.indexOf) return arr.indexOf(obj);
  for (var i = 0; i < arr.length; ++i) {
    if (arr[i] === obj) return i;
  }
  return -1;
};
});
require.register("component-emitter/index.js", function(exports, require, module){

/**
 * Module dependencies.
 */

var index = require('indexof');

/**
 * Expose `Emitter`.
 */

module.exports = Emitter;

/**
 * Initialize a new `Emitter`.
 *
 * @api public
 */

function Emitter(obj) {
  if (obj) return mixin(obj);
};

/**
 * Mixin the emitter properties.
 *
 * @param {Object} obj
 * @return {Object}
 * @api private
 */

function mixin(obj) {
  for (var key in Emitter.prototype) {
    obj[key] = Emitter.prototype[key];
  }
  return obj;
}

/**
 * Listen on the given `event` with `fn`.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.on = function(event, fn){
  this._callbacks = this._callbacks || {};
  (this._callbacks[event] = this._callbacks[event] || [])
    .push(fn);
  return this;
};

/**
 * Adds an `event` listener that will be invoked a single
 * time then automatically removed.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.once = function(event, fn){
  var self = this;
  this._callbacks = this._callbacks || {};

  function on() {
    self.off(event, on);
    fn.apply(this, arguments);
  }

  fn._off = on;
  this.on(event, on);
  return this;
};

/**
 * Remove the given callback for `event` or all
 * registered callbacks.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.off =
Emitter.prototype.removeListener =
Emitter.prototype.removeAllListeners = function(event, fn){
  this._callbacks = this._callbacks || {};

  // all
  if (0 == arguments.length) {
    this._callbacks = {};
    return this;
  }

  // specific event
  var callbacks = this._callbacks[event];
  if (!callbacks) return this;

  // remove all handlers
  if (1 == arguments.length) {
    delete this._callbacks[event];
    return this;
  }

  // remove specific handler
  var i = index(callbacks, fn._off || fn);
  if (~i) callbacks.splice(i, 1);
  return this;
};

/**
 * Emit `event` with the given args.
 *
 * @param {String} event
 * @param {Mixed} ...
 * @return {Emitter}
 */

Emitter.prototype.emit = function(event){
  this._callbacks = this._callbacks || {};
  var args = [].slice.call(arguments, 1)
    , callbacks = this._callbacks[event];

  if (callbacks) {
    callbacks = callbacks.slice(0);
    for (var i = 0, len = callbacks.length; i < len; ++i) {
      callbacks[i].apply(this, args);
    }
  }

  return this;
};

/**
 * Return array of callbacks for `event`.
 *
 * @param {String} event
 * @return {Array}
 * @api public
 */

Emitter.prototype.listeners = function(event){
  this._callbacks = this._callbacks || {};
  return this._callbacks[event] || [];
};

/**
 * Check if this emitter has `event` handlers.
 *
 * @param {String} event
 * @return {Boolean}
 * @api public
 */

Emitter.prototype.hasListeners = function(event){
  return !! this.listeners(event).length;
};

});
require.register("component-mime/index.js", function(exports, require, module){

/**
 * Module dependencies.
 */

var types = require('./types');

/**
 * Expose the types.
 */

exports.types = types;

/**
 * Lookup with `ext`.
 *
 * @param {String} ext
 * @return {String}
 * @api public
 */

exports.lookup = function(ext){
  if ('.' == ext[0]) ext = ext.slice(1);
  return types[ext];
};
});
require.register("component-mime/types.js", function(exports, require, module){
module.exports = {
  nef: 'image/x-nikon-nef',
  dng: 'image/x-adobe-dng',
  '123': 'application/vnd.lotus-1-2-3',
  ez: 'application/andrew-inset',
  aw: 'application/applixware',
  atom: 'application/atom+xml',
  atomcat: 'application/atomcat+xml',
  atomsvc: 'application/atomsvc+xml',
  ccxml: 'application/ccxml+xml',
  cdmia: 'application/cdmi-capability',
  cdmic: 'application/cdmi-container',
  cdmid: 'application/cdmi-domain',
  cdmio: 'application/cdmi-object',
  cdmiq: 'application/cdmi-queue',
  cu: 'application/cu-seeme',
  davmount: 'application/davmount+xml',
  dbk: 'application/docbook+xml',
  dssc: 'application/dssc+der',
  xdssc: 'application/dssc+xml',
  ecma: 'application/ecmascript',
  emma: 'application/emma+xml',
  epub: 'application/epub+zip',
  exi: 'application/exi',
  pfr: 'application/font-tdpfr',
  gml: 'application/gml+xml',
  gpx: 'application/gpx+xml',
  gxf: 'application/gxf',
  stk: 'application/hyperstudio',
  ink: 'application/inkml+xml',
  inkml: 'application/inkml+xml',
  ipfix: 'application/ipfix',
  jar: 'application/java-archive',
  ser: 'application/java-serialized-object',
  class: 'application/java-vm',
  js: 'application/javascript',
  json: 'application/json',
  jsonml: 'application/jsonml+json',
  lostxml: 'application/lost+xml',
  hqx: 'application/mac-binhex40',
  cpt: 'application/mac-compactpro',
  mads: 'application/mads+xml',
  mrc: 'application/marc',
  mrcx: 'application/marcxml+xml',
  ma: 'application/mathematica',
  nb: 'application/mathematica',
  mb: 'application/mathematica',
  mathml: 'application/mathml+xml',
  mbox: 'application/mbox',
  mscml: 'application/mediaservercontrol+xml',
  metalink: 'application/metalink+xml',
  meta4: 'application/metalink4+xml',
  mets: 'application/mets+xml',
  mods: 'application/mods+xml',
  m21: 'application/mp21',
  mp21: 'application/mp21',
  mp4s: 'application/mp4',
  doc: 'application/msword',
  dot: 'application/msword',
  mxf: 'application/mxf',
  bin: 'application/octet-stream',
  dms: 'application/octet-stream',
  lrf: 'application/octet-stream',
  mar: 'application/octet-stream',
  so: 'application/octet-stream',
  dist: 'application/octet-stream',
  distz: 'application/octet-stream',
  pkg: 'application/octet-stream',
  bpk: 'application/octet-stream',
  dump: 'application/octet-stream',
  elc: 'application/octet-stream',
  deploy: 'application/octet-stream',
  oda: 'application/oda',
  opf: 'application/oebps-package+xml',
  ogx: 'application/ogg',
  omdoc: 'application/omdoc+xml',
  onetoc: 'application/onenote',
  onetoc2: 'application/onenote',
  onetmp: 'application/onenote',
  onepkg: 'application/onenote',
  oxps: 'application/oxps',
  xer: 'application/patch-ops-error+xml',
  pdf: 'application/pdf',
  pgp: 'application/pgp-encrypted',
  asc: 'application/pgp-signature',
  sig: 'application/pgp-signature',
  prf: 'application/pics-rules',
  p10: 'application/pkcs10',
  p7m: 'application/pkcs7-mime',
  p7c: 'application/pkcs7-mime',
  p7s: 'application/pkcs7-signature',
  p8: 'application/pkcs8',
  ac: 'application/pkix-attr-cert',
  cer: 'application/pkix-cert',
  crl: 'application/pkix-crl',
  pkipath: 'application/pkix-pkipath',
  pki: 'application/pkixcmp',
  pls: 'application/pls+xml',
  ai: 'application/postscript',
  eps: 'application/postscript',
  ps: 'application/postscript',
  cww: 'application/prs.cww',
  pskcxml: 'application/pskc+xml',
  rdf: 'application/rdf+xml',
  rif: 'application/reginfo+xml',
  rnc: 'application/relax-ng-compact-syntax',
  rl: 'application/resource-lists+xml',
  rld: 'application/resource-lists-diff+xml',
  rs: 'application/rls-services+xml',
  gbr: 'application/rpki-ghostbusters',
  mft: 'application/rpki-manifest',
  roa: 'application/rpki-roa',
  rsd: 'application/rsd+xml',
  rss: 'application/rss+xml',
  rtf: 'application/rtf',
  sbml: 'application/sbml+xml',
  scq: 'application/scvp-cv-request',
  scs: 'application/scvp-cv-response',
  spq: 'application/scvp-vp-request',
  spp: 'application/scvp-vp-response',
  sdp: 'application/sdp',
  setpay: 'application/set-payment-initiation',
  setreg: 'application/set-registration-initiation',
  shf: 'application/shf+xml',
  smi: 'application/smil+xml',
  smil: 'application/smil+xml',
  rq: 'application/sparql-query',
  srx: 'application/sparql-results+xml',
  gram: 'application/srgs',
  grxml: 'application/srgs+xml',
  sru: 'application/sru+xml',
  ssdl: 'application/ssdl+xml',
  ssml: 'application/ssml+xml',
  tei: 'application/tei+xml',
  teicorpus: 'application/tei+xml',
  tfi: 'application/thraud+xml',
  tsd: 'application/timestamped-data',
  plb: 'application/vnd.3gpp.pic-bw-large',
  psb: 'application/vnd.3gpp.pic-bw-small',
  pvb: 'application/vnd.3gpp.pic-bw-var',
  tcap: 'application/vnd.3gpp2.tcap',
  pwn: 'application/vnd.3m.post-it-notes',
  aso: 'application/vnd.accpac.simply.aso',
  imp: 'application/vnd.accpac.simply.imp',
  acu: 'application/vnd.acucobol',
  atc: 'application/vnd.acucorp',
  acutc: 'application/vnd.acucorp',
  air: 'application/vnd.adobe.air-application-installer-package+zip',
  fcdt: 'application/vnd.adobe.formscentral.fcdt',
  fxp: 'application/vnd.adobe.fxp',
  fxpl: 'application/vnd.adobe.fxp',
  xdp: 'application/vnd.adobe.xdp+xml',
  xfdf: 'application/vnd.adobe.xfdf',
  ahead: 'application/vnd.ahead.space',
  azf: 'application/vnd.airzip.filesecure.azf',
  azs: 'application/vnd.airzip.filesecure.azs',
  azw: 'application/vnd.amazon.ebook',
  acc: 'application/vnd.americandynamics.acc',
  ami: 'application/vnd.amiga.ami',
  apk: 'application/vnd.android.package-archive',
  cii: 'application/vnd.anser-web-certificate-issue-initiation',
  fti: 'application/vnd.anser-web-funds-transfer-initiation',
  atx: 'application/vnd.antix.game-component',
  mpkg: 'application/vnd.apple.installer+xml',
  m3u8: 'application/vnd.apple.mpegurl',
  swi: 'application/vnd.aristanetworks.swi',
  iota: 'application/vnd.astraea-software.iota',
  aep: 'application/vnd.audiograph',
  mpm: 'application/vnd.blueice.multipass',
  bmi: 'application/vnd.bmi',
  rep: 'application/vnd.businessobjects',
  cdxml: 'application/vnd.chemdraw+xml',
  mmd: 'application/vnd.chipnuts.karaoke-mmd',
  cdy: 'application/vnd.cinderella',
  cla: 'application/vnd.claymore',
  rp9: 'application/vnd.cloanto.rp9',
  c4g: 'application/vnd.clonk.c4group',
  c4d: 'application/vnd.clonk.c4group',
  c4f: 'application/vnd.clonk.c4group',
  c4p: 'application/vnd.clonk.c4group',
  c4u: 'application/vnd.clonk.c4group',
  c11amc: 'application/vnd.cluetrust.cartomobile-config',
  c11amz: 'application/vnd.cluetrust.cartomobile-config-pkg',
  csp: 'application/vnd.commonspace',
  cdbcmsg: 'application/vnd.contact.cmsg',
  cmc: 'application/vnd.cosmocaller',
  clkx: 'application/vnd.crick.clicker',
  clkk: 'application/vnd.crick.clicker.keyboard',
  clkp: 'application/vnd.crick.clicker.palette',
  clkt: 'application/vnd.crick.clicker.template',
  clkw: 'application/vnd.crick.clicker.wordbank',
  wbs: 'application/vnd.criticaltools.wbs+xml',
  pml: 'application/vnd.ctc-posml',
  ppd: 'application/vnd.cups-ppd',
  car: 'application/vnd.curl.car',
  pcurl: 'application/vnd.curl.pcurl',
  dart: 'application/vnd.dart',
  rdz: 'application/vnd.data-vision.rdz',
  uvf: 'application/vnd.dece.data',
  uvvf: 'application/vnd.dece.data',
  uvd: 'application/vnd.dece.data',
  uvvd: 'application/vnd.dece.data',
  uvt: 'application/vnd.dece.ttml+xml',
  uvvt: 'application/vnd.dece.ttml+xml',
  uvx: 'application/vnd.dece.unspecified',
  uvvx: 'application/vnd.dece.unspecified',
  uvz: 'application/vnd.dece.zip',
  uvvz: 'application/vnd.dece.zip',
  fe_launch: 'application/vnd.denovo.fcselayout-link',
  dna: 'application/vnd.dna',
  mlp: 'application/vnd.dolby.mlp',
  dpg: 'application/vnd.dpgraph',
  dfac: 'application/vnd.dreamfactory',
  kpxx: 'application/vnd.ds-keypoint',
  ait: 'application/vnd.dvb.ait',
  svc: 'application/vnd.dvb.service',
  geo: 'application/vnd.dynageo',
  mag: 'application/vnd.ecowin.chart',
  nml: 'application/vnd.enliven',
  esf: 'application/vnd.epson.esf',
  msf: 'application/vnd.epson.msf',
  qam: 'application/vnd.epson.quickanime',
  slt: 'application/vnd.epson.salt',
  ssf: 'application/vnd.epson.ssf',
  es3: 'application/vnd.eszigno3+xml',
  et3: 'application/vnd.eszigno3+xml',
  ez2: 'application/vnd.ezpix-album',
  ez3: 'application/vnd.ezpix-package',
  fdf: 'application/vnd.fdf',
  mseed: 'application/vnd.fdsn.mseed',
  seed: 'application/vnd.fdsn.seed',
  dataless: 'application/vnd.fdsn.seed',
  gph: 'application/vnd.flographit',
  ftc: 'application/vnd.fluxtime.clip',
  fm: 'application/vnd.framemaker',
  frame: 'application/vnd.framemaker',
  maker: 'application/vnd.framemaker',
  book: 'application/vnd.framemaker',
  fnc: 'application/vnd.frogans.fnc',
  ltf: 'application/vnd.frogans.ltf',
  fsc: 'application/vnd.fsc.weblaunch',
  oas: 'application/vnd.fujitsu.oasys',
  oa2: 'application/vnd.fujitsu.oasys2',
  oa3: 'application/vnd.fujitsu.oasys3',
  fg5: 'application/vnd.fujitsu.oasysgp',
  bh2: 'application/vnd.fujitsu.oasysprs',
  ddd: 'application/vnd.fujixerox.ddd',
  xdw: 'application/vnd.fujixerox.docuworks',
  xbd: 'application/vnd.fujixerox.docuworks.binder',
  fzs: 'application/vnd.fuzzysheet',
  txd: 'application/vnd.genomatix.tuxedo',
  ggb: 'application/vnd.geogebra.file',
  ggt: 'application/vnd.geogebra.tool',
  gex: 'application/vnd.geometry-explorer',
  gre: 'application/vnd.geometry-explorer',
  gxt: 'application/vnd.geonext',
  g2w: 'application/vnd.geoplan',
  g3w: 'application/vnd.geospace',
  gmx: 'application/vnd.gmx',
  kml: 'application/vnd.google-earth.kml+xml',
  kmz: 'application/vnd.google-earth.kmz',
  gqf: 'application/vnd.grafeq',
  gqs: 'application/vnd.grafeq',
  gac: 'application/vnd.groove-account',
  ghf: 'application/vnd.groove-help',
  gim: 'application/vnd.groove-identity-message',
  grv: 'application/vnd.groove-injector',
  gtm: 'application/vnd.groove-tool-message',
  tpl: 'application/vnd.groove-tool-template',
  vcg: 'application/vnd.groove-vcard',
  hal: 'application/vnd.hal+xml',
  zmm: 'application/vnd.handheld-entertainment+xml',
  hbci: 'application/vnd.hbci',
  les: 'application/vnd.hhe.lesson-player',
  hpgl: 'application/vnd.hp-hpgl',
  hpid: 'application/vnd.hp-hpid',
  hps: 'application/vnd.hp-hps',
  jlt: 'application/vnd.hp-jlyt',
  pcl: 'application/vnd.hp-pcl',
  pclxl: 'application/vnd.hp-pclxl',
  'sfd-hdstx': 'application/vnd.hydrostatix.sof-data',
  mpy: 'application/vnd.ibm.minipay',
  afp: 'application/vnd.ibm.modcap',
  listafp: 'application/vnd.ibm.modcap',
  list3820: 'application/vnd.ibm.modcap',
  irm: 'application/vnd.ibm.rights-management',
  sc: 'application/vnd.ibm.secure-container',
  icc: 'application/vnd.iccprofile',
  icm: 'application/vnd.iccprofile',
  igl: 'application/vnd.igloader',
  ivp: 'application/vnd.immervision-ivp',
  ivu: 'application/vnd.immervision-ivu',
  igm: 'application/vnd.insors.igm',
  xpw: 'application/vnd.intercon.formnet',
  xpx: 'application/vnd.intercon.formnet',
  i2g: 'application/vnd.intergeo',
  qbo: 'application/vnd.intu.qbo',
  qfx: 'application/vnd.intu.qfx',
  rcprofile: 'application/vnd.ipunplugged.rcprofile',
  irp: 'application/vnd.irepository.package+xml',
  xpr: 'application/vnd.is-xpr',
  fcs: 'application/vnd.isac.fcs',
  jam: 'application/vnd.jam',
  rms: 'application/vnd.jcp.javame.midlet-rms',
  jisp: 'application/vnd.jisp',
  joda: 'application/vnd.joost.joda-archive',
  ktz: 'application/vnd.kahootz',
  ktr: 'application/vnd.kahootz',
  karbon: 'application/vnd.kde.karbon',
  chrt: 'application/vnd.kde.kchart',
  kfo: 'application/vnd.kde.kformula',
  flw: 'application/vnd.kde.kivio',
  kon: 'application/vnd.kde.kontour',
  kpr: 'application/vnd.kde.kpresenter',
  kpt: 'application/vnd.kde.kpresenter',
  ksp: 'application/vnd.kde.kspread',
  kwd: 'application/vnd.kde.kword',
  kwt: 'application/vnd.kde.kword',
  htke: 'application/vnd.kenameaapp',
  kia: 'application/vnd.kidspiration',
  kne: 'application/vnd.kinar',
  knp: 'application/vnd.kinar',
  skp: 'application/vnd.koan',
  skd: 'application/vnd.koan',
  skt: 'application/vnd.koan',
  skm: 'application/vnd.koan',
  sse: 'application/vnd.kodak-descriptor',
  lasxml: 'application/vnd.las.las+xml',
  lbd: 'application/vnd.llamagraphics.life-balance.desktop',
  lbe: 'application/vnd.llamagraphics.life-balance.exchange+xml',
  apr: 'application/vnd.lotus-approach',
  pre: 'application/vnd.lotus-freelance',
  nsf: 'application/vnd.lotus-notes',
  org: 'application/vnd.lotus-organizer',
  scm: 'application/vnd.lotus-screencam',
  lwp: 'application/vnd.lotus-wordpro',
  portpkg: 'application/vnd.macports.portpkg',
  mcd: 'application/vnd.mcd',
  mc1: 'application/vnd.medcalcdata',
  cdkey: 'application/vnd.mediastation.cdkey',
  mwf: 'application/vnd.mfer',
  mfm: 'application/vnd.mfmp',
  flo: 'application/vnd.micrografx.flo',
  igx: 'application/vnd.micrografx.igx',
  mif: 'application/vnd.mif',
  daf: 'application/vnd.mobius.daf',
  dis: 'application/vnd.mobius.dis',
  mbk: 'application/vnd.mobius.mbk',
  mqy: 'application/vnd.mobius.mqy',
  msl: 'application/vnd.mobius.msl',
  plc: 'application/vnd.mobius.plc',
  txf: 'application/vnd.mobius.txf',
  mpn: 'application/vnd.mophun.application',
  mpc: 'application/vnd.mophun.certificate',
  xul: 'application/vnd.mozilla.xul+xml',
  cil: 'application/vnd.ms-artgalry',
  cab: 'application/vnd.ms-cab-compressed',
  xls: 'application/vnd.ms-excel',
  xlm: 'application/vnd.ms-excel',
  xla: 'application/vnd.ms-excel',
  xlc: 'application/vnd.ms-excel',
  xlt: 'application/vnd.ms-excel',
  xlw: 'application/vnd.ms-excel',
  xlam: 'application/vnd.ms-excel.addin.macroenabled.12',
  xlsb: 'application/vnd.ms-excel.sheet.binary.macroenabled.12',
  xlsm: 'application/vnd.ms-excel.sheet.macroenabled.12',
  xltm: 'application/vnd.ms-excel.template.macroenabled.12',
  eot: 'application/vnd.ms-fontobject',
  chm: 'application/vnd.ms-htmlhelp',
  ims: 'application/vnd.ms-ims',
  lrm: 'application/vnd.ms-lrm',
  thmx: 'application/vnd.ms-officetheme',
  cat: 'application/vnd.ms-pki.seccat',
  stl: 'application/vnd.ms-pki.stl',
  ppt: 'application/vnd.ms-powerpoint',
  pps: 'application/vnd.ms-powerpoint',
  pot: 'application/vnd.ms-powerpoint',
  ppam: 'application/vnd.ms-powerpoint.addin.macroenabled.12',
  pptm: 'application/vnd.ms-powerpoint.presentation.macroenabled.12',
  sldm: 'application/vnd.ms-powerpoint.slide.macroenabled.12',
  ppsm: 'application/vnd.ms-powerpoint.slideshow.macroenabled.12',
  potm: 'application/vnd.ms-powerpoint.template.macroenabled.12',
  mpp: 'application/vnd.ms-project',
  mpt: 'application/vnd.ms-project',
  docm: 'application/vnd.ms-word.document.macroenabled.12',
  dotm: 'application/vnd.ms-word.template.macroenabled.12',
  wps: 'application/vnd.ms-works',
  wks: 'application/vnd.ms-works',
  wcm: 'application/vnd.ms-works',
  wdb: 'application/vnd.ms-works',
  wpl: 'application/vnd.ms-wpl',
  xps: 'application/vnd.ms-xpsdocument',
  mseq: 'application/vnd.mseq',
  mus: 'application/vnd.musician',
  msty: 'application/vnd.muvee.style',
  taglet: 'application/vnd.mynfc',
  nlu: 'application/vnd.neurolanguage.nlu',
  ntf: 'application/vnd.nitf',
  nitf: 'application/vnd.nitf',
  nnd: 'application/vnd.noblenet-directory',
  nns: 'application/vnd.noblenet-sealer',
  nnw: 'application/vnd.noblenet-web',
  ngdat: 'application/vnd.nokia.n-gage.data',
  'n-gage': 'application/vnd.nokia.n-gage.symbian.install',
  rpst: 'application/vnd.nokia.radio-preset',
  rpss: 'application/vnd.nokia.radio-presets',
  edm: 'application/vnd.novadigm.edm',
  edx: 'application/vnd.novadigm.edx',
  ext: 'application/vnd.novadigm.ext',
  odc: 'application/vnd.oasis.opendocument.chart',
  otc: 'application/vnd.oasis.opendocument.chart-template',
  odb: 'application/vnd.oasis.opendocument.database',
  odf: 'application/vnd.oasis.opendocument.formula',
  odft: 'application/vnd.oasis.opendocument.formula-template',
  odg: 'application/vnd.oasis.opendocument.graphics',
  otg: 'application/vnd.oasis.opendocument.graphics-template',
  odi: 'application/vnd.oasis.opendocument.image',
  oti: 'application/vnd.oasis.opendocument.image-template',
  odp: 'application/vnd.oasis.opendocument.presentation',
  otp: 'application/vnd.oasis.opendocument.presentation-template',
  ods: 'application/vnd.oasis.opendocument.spreadsheet',
  ots: 'application/vnd.oasis.opendocument.spreadsheet-template',
  odt: 'application/vnd.oasis.opendocument.text',
  odm: 'application/vnd.oasis.opendocument.text-master',
  ott: 'application/vnd.oasis.opendocument.text-template',
  oth: 'application/vnd.oasis.opendocument.text-web',
  xo: 'application/vnd.olpc-sugar',
  dd2: 'application/vnd.oma.dd2+xml',
  oxt: 'application/vnd.openofficeorg.extension',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  sldx: 'application/vnd.openxmlformats-officedocument.presentationml.slide',
  ppsx: 'application/vnd.openxmlformats-officedocument.presentationml.slideshow',
  potx: 'application/vnd.openxmlformats-officedocument.presentationml.template',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  xltx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.template',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  dotx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.template',
  mgp: 'application/vnd.osgeo.mapguide.package',
  dp: 'application/vnd.osgi.dp',
  esa: 'application/vnd.osgi.subsystem',
  pdb: 'application/vnd.palm',
  pqa: 'application/vnd.palm',
  oprc: 'application/vnd.palm',
  paw: 'application/vnd.pawaafile',
  str: 'application/vnd.pg.format',
  ei6: 'application/vnd.pg.osasli',
  efif: 'application/vnd.picsel',
  wg: 'application/vnd.pmi.widget',
  plf: 'application/vnd.pocketlearn',
  pbd: 'application/vnd.powerbuilder6',
  box: 'application/vnd.previewsystems.box',
  mgz: 'application/vnd.proteus.magazine',
  qps: 'application/vnd.publishare-delta-tree',
  ptid: 'application/vnd.pvi.ptid1',
  qxd: 'application/vnd.quark.quarkxpress',
  qxt: 'application/vnd.quark.quarkxpress',
  qwd: 'application/vnd.quark.quarkxpress',
  qwt: 'application/vnd.quark.quarkxpress',
  qxl: 'application/vnd.quark.quarkxpress',
  qxb: 'application/vnd.quark.quarkxpress',
  bed: 'application/vnd.realvnc.bed',
  mxl: 'application/vnd.recordare.musicxml',
  musicxml: 'application/vnd.recordare.musicxml+xml',
  cryptonote: 'application/vnd.rig.cryptonote',
  cod: 'application/vnd.rim.cod',
  rm: 'application/vnd.rn-realmedia',
  rmvb: 'application/vnd.rn-realmedia-vbr',
  link66: 'application/vnd.route66.link66+xml',
  st: 'application/vnd.sailingtracker.track',
  see: 'application/vnd.seemail',
  sema: 'application/vnd.sema',
  semd: 'application/vnd.semd',
  semf: 'application/vnd.semf',
  ifm: 'application/vnd.shana.informed.formdata',
  itp: 'application/vnd.shana.informed.formtemplate',
  iif: 'application/vnd.shana.informed.interchange',
  ipk: 'application/vnd.shana.informed.package',
  twd: 'application/vnd.simtech-mindmapper',
  twds: 'application/vnd.simtech-mindmapper',
  mmf: 'application/vnd.smaf',
  teacher: 'application/vnd.smart.teacher',
  sdkm: 'application/vnd.solent.sdkm+xml',
  sdkd: 'application/vnd.solent.sdkm+xml',
  dxp: 'application/vnd.spotfire.dxp',
  sfs: 'application/vnd.spotfire.sfs',
  sdc: 'application/vnd.stardivision.calc',
  sda: 'application/vnd.stardivision.draw',
  sdd: 'application/vnd.stardivision.impress',
  smf: 'application/vnd.stardivision.math',
  sdw: 'application/vnd.stardivision.writer',
  vor: 'application/vnd.stardivision.writer',
  sgl: 'application/vnd.stardivision.writer-global',
  smzip: 'application/vnd.stepmania.package',
  sm: 'application/vnd.stepmania.stepchart',
  sxc: 'application/vnd.sun.xml.calc',
  stc: 'application/vnd.sun.xml.calc.template',
  sxd: 'application/vnd.sun.xml.draw',
  std: 'application/vnd.sun.xml.draw.template',
  sxi: 'application/vnd.sun.xml.impress',
  sti: 'application/vnd.sun.xml.impress.template',
  sxm: 'application/vnd.sun.xml.math',
  sxw: 'application/vnd.sun.xml.writer',
  sxg: 'application/vnd.sun.xml.writer.global',
  stw: 'application/vnd.sun.xml.writer.template',
  sus: 'application/vnd.sus-calendar',
  susp: 'application/vnd.sus-calendar',
  svd: 'application/vnd.svd',
  sis: 'application/vnd.symbian.install',
  sisx: 'application/vnd.symbian.install',
  xsm: 'application/vnd.syncml+xml',
  bdm: 'application/vnd.syncml.dm+wbxml',
  xdm: 'application/vnd.syncml.dm+xml',
  tao: 'application/vnd.tao.intent-module-archive',
  pcap: 'application/vnd.tcpdump.pcap',
  cap: 'application/vnd.tcpdump.pcap',
  dmp: 'application/vnd.tcpdump.pcap',
  tmo: 'application/vnd.tmobile-livetv',
  tpt: 'application/vnd.trid.tpt',
  mxs: 'application/vnd.triscape.mxs',
  tra: 'application/vnd.trueapp',
  ufd: 'application/vnd.ufdl',
  ufdl: 'application/vnd.ufdl',
  utz: 'application/vnd.uiq.theme',
  umj: 'application/vnd.umajin',
  unityweb: 'application/vnd.unity',
  uoml: 'application/vnd.uoml+xml',
  vcx: 'application/vnd.vcx',
  vsd: 'application/vnd.visio',
  vst: 'application/vnd.visio',
  vss: 'application/vnd.visio',
  vsw: 'application/vnd.visio',
  vis: 'application/vnd.visionary',
  vsf: 'application/vnd.vsf',
  wbxml: 'application/vnd.wap.wbxml',
  wmlc: 'application/vnd.wap.wmlc',
  wmlsc: 'application/vnd.wap.wmlscriptc',
  wtb: 'application/vnd.webturbo',
  nbp: 'application/vnd.wolfram.player',
  wpd: 'application/vnd.wordperfect',
  wqd: 'application/vnd.wqd',
  stf: 'application/vnd.wt.stf',
  xar: 'application/vnd.xara',
  xfdl: 'application/vnd.xfdl',
  hvd: 'application/vnd.yamaha.hv-dic',
  hvs: 'application/vnd.yamaha.hv-script',
  hvp: 'application/vnd.yamaha.hv-voice',
  osf: 'application/vnd.yamaha.openscoreformat',
  osfpvg: 'application/vnd.yamaha.openscoreformat.osfpvg+xml',
  saf: 'application/vnd.yamaha.smaf-audio',
  spf: 'application/vnd.yamaha.smaf-phrase',
  cmp: 'application/vnd.yellowriver-custom-menu',
  zir: 'application/vnd.zul',
  zirz: 'application/vnd.zul',
  zaz: 'application/vnd.zzazz.deck+xml',
  vxml: 'application/voicexml+xml',
  wgt: 'application/widget',
  hlp: 'application/winhlp',
  wsdl: 'application/wsdl+xml',
  wspolicy: 'application/wspolicy+xml',
  '7z': 'application/x-7z-compressed',
  abw: 'application/x-abiword',
  ace: 'application/x-ace-compressed',
  dmg: 'application/x-apple-diskimage',
  aab: 'application/x-authorware-bin',
  x32: 'application/x-authorware-bin',
  u32: 'application/x-authorware-bin',
  vox: 'application/x-authorware-bin',
  aam: 'application/x-authorware-map',
  aas: 'application/x-authorware-seg',
  bcpio: 'application/x-bcpio',
  torrent: 'application/x-bittorrent',
  blb: 'application/x-blorb',
  blorb: 'application/x-blorb',
  bz: 'application/x-bzip',
  bz2: 'application/x-bzip2',
  boz: 'application/x-bzip2',
  cbr: 'application/x-cbr',
  cba: 'application/x-cbr',
  cbt: 'application/x-cbr',
  cbz: 'application/x-cbr',
  cb7: 'application/x-cbr',
  vcd: 'application/x-cdlink',
  cfs: 'application/x-cfs-compressed',
  chat: 'application/x-chat',
  pgn: 'application/x-chess-pgn',
  nsc: 'application/x-conference',
  cpio: 'application/x-cpio',
  csh: 'application/x-csh',
  deb: 'application/x-debian-package',
  udeb: 'application/x-debian-package',
  dgc: 'application/x-dgc-compressed',
  dir: 'application/x-director',
  dcr: 'application/x-director',
  dxr: 'application/x-director',
  cst: 'application/x-director',
  cct: 'application/x-director',
  cxt: 'application/x-director',
  w3d: 'application/x-director',
  fgd: 'application/x-director',
  swa: 'application/x-director',
  wad: 'application/x-doom',
  ncx: 'application/x-dtbncx+xml',
  dtb: 'application/x-dtbook+xml',
  res: 'application/x-dtbresource+xml',
  dvi: 'application/x-dvi',
  evy: 'application/x-envoy',
  eva: 'application/x-eva',
  bdf: 'application/x-font-bdf',
  gsf: 'application/x-font-ghostscript',
  psf: 'application/x-font-linux-psf',
  otf: 'application/x-font-otf',
  pcf: 'application/x-font-pcf',
  snf: 'application/x-font-snf',
  ttf: 'application/x-font-ttf',
  ttc: 'application/x-font-ttf',
  pfa: 'application/x-font-type1',
  pfb: 'application/x-font-type1',
  pfm: 'application/x-font-type1',
  afm: 'application/x-font-type1',
  woff: 'application/x-font-woff',
  arc: 'application/x-freearc',
  spl: 'application/x-futuresplash',
  gca: 'application/x-gca-compressed',
  ulx: 'application/x-glulx',
  gnumeric: 'application/x-gnumeric',
  gramps: 'application/x-gramps-xml',
  gtar: 'application/x-gtar',
  hdf: 'application/x-hdf',
  install: 'application/x-install-instructions',
  iso: 'application/x-iso9660-image',
  jnlp: 'application/x-java-jnlp-file',
  latex: 'application/x-latex',
  lzh: 'application/x-lzh-compressed',
  lha: 'application/x-lzh-compressed',
  mie: 'application/x-mie',
  prc: 'application/x-mobipocket-ebook',
  mobi: 'application/x-mobipocket-ebook',
  application: 'application/x-ms-application',
  lnk: 'application/x-ms-shortcut',
  wmd: 'application/x-ms-wmd',
  wmz: 'application/x-msmetafile',
  xbap: 'application/x-ms-xbap',
  mdb: 'application/x-msaccess',
  obd: 'application/x-msbinder',
  crd: 'application/x-mscardfile',
  clp: 'application/x-msclip',
  exe: 'application/x-msdownload',
  dll: 'application/x-msdownload',
  com: 'application/x-msdownload',
  bat: 'application/x-msdownload',
  msi: 'application/x-msdownload',
  mvb: 'application/x-msmediaview',
  m13: 'application/x-msmediaview',
  m14: 'application/x-msmediaview',
  wmf: 'application/x-msmetafile',
  emf: 'application/x-msmetafile',
  emz: 'application/x-msmetafile',
  mny: 'application/x-msmoney',
  pub: 'application/x-mspublisher',
  scd: 'application/x-msschedule',
  trm: 'application/x-msterminal',
  wri: 'application/x-mswrite',
  nc: 'application/x-netcdf',
  cdf: 'application/x-netcdf',
  nzb: 'application/x-nzb',
  p12: 'application/x-pkcs12',
  pfx: 'application/x-pkcs12',
  p7b: 'application/x-pkcs7-certificates',
  spc: 'application/x-pkcs7-certificates',
  p7r: 'application/x-pkcs7-certreqresp',
  rar: 'application/x-rar-compressed',
  ris: 'application/x-research-info-systems',
  sh: 'application/x-sh',
  shar: 'application/x-shar',
  swf: 'application/x-shockwave-flash',
  xap: 'application/x-silverlight-app',
  sql: 'application/x-sql',
  sit: 'application/x-stuffit',
  sitx: 'application/x-stuffitx',
  srt: 'application/x-subrip',
  sv4cpio: 'application/x-sv4cpio',
  sv4crc: 'application/x-sv4crc',
  t3: 'application/x-t3vm-image',
  gam: 'application/x-tads',
  tar: 'application/x-tar',
  tcl: 'application/x-tcl',
  tex: 'application/x-tex',
  tfm: 'application/x-tex-tfm',
  texinfo: 'application/x-texinfo',
  texi: 'application/x-texinfo',
  obj: 'application/x-tgif',
  ustar: 'application/x-ustar',
  src: 'application/x-wais-source',
  der: 'application/x-x509-ca-cert',
  crt: 'application/x-x509-ca-cert',
  fig: 'application/x-xfig',
  xlf: 'application/x-xliff+xml',
  xpi: 'application/x-xpinstall',
  xz: 'application/x-xz',
  z1: 'application/x-zmachine',
  z2: 'application/x-zmachine',
  z3: 'application/x-zmachine',
  z4: 'application/x-zmachine',
  z5: 'application/x-zmachine',
  z6: 'application/x-zmachine',
  z7: 'application/x-zmachine',
  z8: 'application/x-zmachine',
  xaml: 'application/xaml+xml',
  xdf: 'application/xcap-diff+xml',
  xenc: 'application/xenc+xml',
  xhtml: 'application/xhtml+xml',
  xht: 'application/xhtml+xml',
  xml: 'application/xml',
  xsl: 'application/xml',
  dtd: 'application/xml-dtd',
  xop: 'application/xop+xml',
  xpl: 'application/xproc+xml',
  xslt: 'application/xslt+xml',
  xspf: 'application/xspf+xml',
  mxml: 'application/xv+xml',
  xhvml: 'application/xv+xml',
  xvml: 'application/xv+xml',
  xvm: 'application/xv+xml',
  yang: 'application/yang',
  yin: 'application/yin+xml',
  zip: 'application/zip',
  adp: 'audio/adpcm',
  au: 'audio/basic',
  snd: 'audio/basic',
  mid: 'audio/midi',
  midi: 'audio/midi',
  kar: 'audio/midi',
  rmi: 'audio/midi',
  mp4a: 'audio/mp4',
  mpga: 'audio/mpeg',
  mp2: 'audio/mpeg',
  mp2a: 'audio/mpeg',
  mp3: 'audio/mpeg',
  m2a: 'audio/mpeg',
  m3a: 'audio/mpeg',
  oga: 'audio/ogg',
  ogg: 'audio/ogg',
  spx: 'audio/ogg',
  s3m: 'audio/s3m',
  sil: 'audio/silk',
  uva: 'audio/vnd.dece.audio',
  uvva: 'audio/vnd.dece.audio',
  eol: 'audio/vnd.digital-winds',
  dra: 'audio/vnd.dra',
  dts: 'audio/vnd.dts',
  dtshd: 'audio/vnd.dts.hd',
  lvp: 'audio/vnd.lucent.voice',
  pya: 'audio/vnd.ms-playready.media.pya',
  ecelp4800: 'audio/vnd.nuera.ecelp4800',
  ecelp7470: 'audio/vnd.nuera.ecelp7470',
  ecelp9600: 'audio/vnd.nuera.ecelp9600',
  rip: 'audio/vnd.rip',
  weba: 'audio/webm',
  aac: 'audio/x-aac',
  aif: 'audio/x-aiff',
  aiff: 'audio/x-aiff',
  aifc: 'audio/x-aiff',
  caf: 'audio/x-caf',
  flac: 'audio/x-flac',
  mka: 'audio/x-matroska',
  m3u: 'audio/x-mpegurl',
  wax: 'audio/x-ms-wax',
  wma: 'audio/x-ms-wma',
  ram: 'audio/x-pn-realaudio',
  ra: 'audio/x-pn-realaudio',
  rmp: 'audio/x-pn-realaudio-plugin',
  wav: 'audio/x-wav',
  xm: 'audio/xm',
  cdx: 'chemical/x-cdx',
  cif: 'chemical/x-cif',
  cmdf: 'chemical/x-cmdf',
  cml: 'chemical/x-cml',
  csml: 'chemical/x-csml',
  xyz: 'chemical/x-xyz',
  bmp: 'image/bmp',
  cgm: 'image/cgm',
  g3: 'image/g3fax',
  gif: 'image/gif',
  ief: 'image/ief',
  jpeg: 'image/jpeg',
  jpg: 'image/jpeg',
  jpe: 'image/jpeg',
  ktx: 'image/ktx',
  png: 'image/png',
  btif: 'image/prs.btif',
  sgi: 'image/sgi',
  svg: 'image/svg+xml',
  svgz: 'image/svg+xml',
  tiff: 'image/tiff',
  tif: 'image/tiff',
  psd: 'image/vnd.adobe.photoshop',
  uvi: 'image/vnd.dece.graphic',
  uvvi: 'image/vnd.dece.graphic',
  uvg: 'image/vnd.dece.graphic',
  uvvg: 'image/vnd.dece.graphic',
  sub: 'text/vnd.dvb.subtitle',
  djvu: 'image/vnd.djvu',
  djv: 'image/vnd.djvu',
  dwg: 'image/vnd.dwg',
  dxf: 'image/vnd.dxf',
  fbs: 'image/vnd.fastbidsheet',
  fpx: 'image/vnd.fpx',
  fst: 'image/vnd.fst',
  mmr: 'image/vnd.fujixerox.edmics-mmr',
  rlc: 'image/vnd.fujixerox.edmics-rlc',
  mdi: 'image/vnd.ms-modi',
  wdp: 'image/vnd.ms-photo',
  npx: 'image/vnd.net-fpx',
  wbmp: 'image/vnd.wap.wbmp',
  xif: 'image/vnd.xiff',
  webp: 'image/webp',
  '3ds': 'image/x-3ds',
  ras: 'image/x-cmu-raster',
  cmx: 'image/x-cmx',
  fh: 'image/x-freehand',
  fhc: 'image/x-freehand',
  fh4: 'image/x-freehand',
  fh5: 'image/x-freehand',
  fh7: 'image/x-freehand',
  ico: 'image/x-icon',
  sid: 'image/x-mrsid-image',
  pcx: 'image/x-pcx',
  pic: 'image/x-pict',
  pct: 'image/x-pict',
  pnm: 'image/x-portable-anymap',
  pbm: 'image/x-portable-bitmap',
  pgm: 'image/x-portable-graymap',
  ppm: 'image/x-portable-pixmap',
  rgb: 'image/x-rgb',
  tga: 'image/x-tga',
  xbm: 'image/x-xbitmap',
  xpm: 'image/x-xpixmap',
  xwd: 'image/x-xwindowdump',
  eml: 'message/rfc822',
  mime: 'message/rfc822',
  igs: 'model/iges',
  iges: 'model/iges',
  msh: 'model/mesh',
  mesh: 'model/mesh',
  silo: 'model/mesh',
  dae: 'model/vnd.collada+xml',
  dwf: 'model/vnd.dwf',
  gdl: 'model/vnd.gdl',
  gtw: 'model/vnd.gtw',
  mts: 'model/vnd.mts',
  vtu: 'model/vnd.vtu',
  wrl: 'model/vrml',
  vrml: 'model/vrml',
  x3db: 'model/x3d+binary',
  x3dbz: 'model/x3d+binary',
  x3dv: 'model/x3d+vrml',
  x3dvz: 'model/x3d+vrml',
  x3d: 'model/x3d+xml',
  x3dz: 'model/x3d+xml',
  appcache: 'text/cache-manifest',
  ics: 'text/calendar',
  ifb: 'text/calendar',
  css: 'text/css',
  csv: 'text/csv',
  html: 'text/html',
  htm: 'text/html',
  n3: 'text/n3',
  txt: 'text/plain',
  text: 'text/plain',
  conf: 'text/plain',
  def: 'text/plain',
  list: 'text/plain',
  log: 'text/plain',
  in: 'text/plain',
  dsc: 'text/prs.lines.tag',
  rtx: 'text/richtext',
  sgml: 'text/sgml',
  sgm: 'text/sgml',
  tsv: 'text/tab-separated-values',
  t: 'text/troff',
  tr: 'text/troff',
  roff: 'text/troff',
  man: 'text/troff',
  me: 'text/troff',
  ms: 'text/troff',
  ttl: 'text/turtle',
  uri: 'text/uri-list',
  uris: 'text/uri-list',
  urls: 'text/uri-list',
  vcard: 'text/vcard',
  curl: 'text/vnd.curl',
  dcurl: 'text/vnd.curl.dcurl',
  scurl: 'text/vnd.curl.scurl',
  mcurl: 'text/vnd.curl.mcurl',
  fly: 'text/vnd.fly',
  flx: 'text/vnd.fmi.flexstor',
  gv: 'text/vnd.graphviz',
  '3dml': 'text/vnd.in3d.3dml',
  spot: 'text/vnd.in3d.spot',
  jad: 'text/vnd.sun.j2me.app-descriptor',
  wml: 'text/vnd.wap.wml',
  wmls: 'text/vnd.wap.wmlscript',
  s: 'text/x-asm',
  asm: 'text/x-asm',
  c: 'text/x-c',
  cc: 'text/x-c',
  cxx: 'text/x-c',
  cpp: 'text/x-c',
  h: 'text/x-c',
  hh: 'text/x-c',
  dic: 'text/x-c',
  f: 'text/x-fortran',
  for: 'text/x-fortran',
  f77: 'text/x-fortran',
  f90: 'text/x-fortran',
  java: 'text/x-java-source',
  opml: 'text/x-opml',
  p: 'text/x-pascal',
  pas: 'text/x-pascal',
  nfo: 'text/x-nfo',
  etx: 'text/x-setext',
  sfv: 'text/x-sfv',
  uu: 'text/x-uuencode',
  vcs: 'text/x-vcalendar',
  vcf: 'text/x-vcard',
  '3gp': 'video/3gpp',
  '3g2': 'video/3gpp2',
  h261: 'video/h261',
  h263: 'video/h263',
  h264: 'video/h264',
  jpgv: 'video/jpeg',
  jpm: 'video/jpm',
  jpgm: 'video/jpm',
  mj2: 'video/mj2',
  mjp2: 'video/mj2',
  mp4: 'video/mp4',
  mp4v: 'video/mp4',
  mpg4: 'video/mp4',
  mpeg: 'video/mpeg',
  mpg: 'video/mpeg',
  mpe: 'video/mpeg',
  m1v: 'video/mpeg',
  m2v: 'video/mpeg',
  ogv: 'video/ogg',
  qt: 'video/quicktime',
  mov: 'video/quicktime',
  uvh: 'video/vnd.dece.hd',
  uvvh: 'video/vnd.dece.hd',
  uvm: 'video/vnd.dece.mobile',
  uvvm: 'video/vnd.dece.mobile',
  uvp: 'video/vnd.dece.pd',
  uvvp: 'video/vnd.dece.pd',
  uvs: 'video/vnd.dece.sd',
  uvvs: 'video/vnd.dece.sd',
  uvv: 'video/vnd.dece.video',
  uvvv: 'video/vnd.dece.video',
  dvb: 'video/vnd.dvb.file',
  fvt: 'video/vnd.fvt',
  mxu: 'video/vnd.mpegurl',
  m4u: 'video/vnd.mpegurl',
  pyv: 'video/vnd.ms-playready.media.pyv',
  uvu: 'video/vnd.uvvu.mp4',
  uvvu: 'video/vnd.uvvu.mp4',
  viv: 'video/vnd.vivo',
  webm: 'video/webm',
  f4v: 'video/x-f4v',
  fli: 'video/x-fli',
  flv: 'video/x-flv',
  m4v: 'video/x-m4v',
  mkv: 'video/x-matroska',
  mk3d: 'video/x-matroska',
  mks: 'video/x-matroska',
  mng: 'video/x-mng',
  asf: 'video/x-ms-asf',
  asx: 'video/x-ms-asf',
  vob: 'video/x-ms-vob',
  wm: 'video/x-ms-wm',
  wmv: 'video/x-ms-wmv',
  wmx: 'video/x-ms-wmx',
  wvx: 'video/x-ms-wvx',
  avi: 'video/x-msvideo',
  movie: 'video/x-sgi-movie',
  smv: 'video/x-smv',
  ice: 'x-conference/x-cooltalk' }

});
require.register("RedVentures-reduce/index.js", function(exports, require, module){

/**
 * Reduce `arr` with `fn`.
 *
 * @param {Array} arr
 * @param {Function} fn
 * @param {Mixed} initial
 *
 * TODO: combatible error handling?
 */

module.exports = function(arr, fn, initial){  
  var idx = 0;
  var len = arr.length;
  var curr = arguments.length == 3
    ? initial
    : arr[idx++];

  while (idx < len) {
    curr = fn.call(null, curr, arr[idx], ++idx, arr);
  }
  
  return curr;
};
});
require.register("visionmedia-superagent/lib/client.js", function(exports, require, module){

/**
 * Module dependencies.
 */

var Emitter = require('emitter')
  , reduce = require('reduce');

/**
 * Root reference for iframes.
 */

var root = 'undefined' == typeof window
  ? this
  : window;

/**
 * Noop.
 */

function noop(){};

/**
 * Determine XHR.
 */

function getXHR() {
  if (root.XMLHttpRequest
    && ('file:' != root.location.protocol || !root.ActiveXObject)) {
    return new XMLHttpRequest;
  } else {
    try { return new ActiveXObject('Microsoft.XMLHTTP'); } catch(e) {}
    try { return new ActiveXObject('Msxml2.XMLHTTP.6.0'); } catch(e) {}
    try { return new ActiveXObject('Msxml2.XMLHTTP.3.0'); } catch(e) {}
    try { return new ActiveXObject('Msxml2.XMLHTTP'); } catch(e) {}
  }
  return false;
}

/**
 * Removes leading and trailing whitespace, added to support IE.
 *
 * @param {String} s
 * @return {String}
 * @api private
 */

var trim = ''.trim
  ? function(s) { return s.trim(); }
  : function(s) { return s.replace(/(^\s*|\s*$)/g, ''); };

/**
 * Check if `obj` is an object.
 *
 * @param {Object} obj
 * @return {Boolean}
 * @api private
 */

function isObject(obj) {
  return obj === Object(obj);
}

/**
 * Serialize the given `obj`.
 *
 * @param {Object} obj
 * @return {String}
 * @api private
 */

function serialize(obj) {
  if (!isObject(obj)) return obj;
  var pairs = [];
  for (var key in obj) {
    pairs.push(encodeURIComponent(key)
      + '=' + encodeURIComponent(obj[key]));
  }
  return pairs.join('&');
}

/**
 * Expose serialization method.
 */

 request.serializeObject = serialize;

 /**
  * Parse the given x-www-form-urlencoded `str`.
  *
  * @param {String} str
  * @return {Object}
  * @api private
  */

function parseString(str) {
  var obj = {};
  var pairs = str.split('&');
  var parts;
  var pair;

  for (var i = 0, len = pairs.length; i < len; ++i) {
    pair = pairs[i];
    parts = pair.split('=');
    obj[decodeURIComponent(parts[0])] = decodeURIComponent(parts[1]);
  }

  return obj;
}

/**
 * Expose parser.
 */

request.parseString = parseString;

/**
 * Default MIME type map.
 *
 *     superagent.types.xml = 'application/xml';
 *
 */

request.types = {
  html: 'text/html',
  json: 'application/json',
  urlencoded: 'application/x-www-form-urlencoded',
  'form': 'application/x-www-form-urlencoded',
  'form-data': 'application/x-www-form-urlencoded'
};

/**
 * Default serialization map.
 *
 *     superagent.serialize['application/xml'] = function(obj){
 *       return 'generated xml here';
 *     };
 *
 */

 request.serialize = {
   'application/x-www-form-urlencoded': serialize,
   'application/json': JSON.stringify
 };

 /**
  * Default parsers.
  *
  *     superagent.parse['application/xml'] = function(str){
  *       return { object parsed from str };
  *     };
  *
  */

request.parse = {
  'application/x-www-form-urlencoded': parseString,
  'application/json': JSON.parse
};

/**
 * Parse the given header `str` into
 * an object containing the mapped fields.
 *
 * @param {String} str
 * @return {Object}
 * @api private
 */

function parseHeader(str) {
  var lines = str.split(/\r?\n/);
  var fields = {};
  var index;
  var line;
  var field;
  var val;

  lines.pop(); // trailing CRLF

  for (var i = 0, len = lines.length; i < len; ++i) {
    line = lines[i];
    index = line.indexOf(':');
    field = line.slice(0, index).toLowerCase();
    val = trim(line.slice(index + 1));
    fields[field] = val;
  }

  return fields;
}

/**
 * Return the mime type for the given `str`.
 *
 * @param {String} str
 * @return {String}
 * @api private
 */

function type(str){
  return str.split(/ *; */).shift();
};

/**
 * Return header field parameters.
 *
 * @param {String} str
 * @return {Object}
 * @api private
 */

function params(str){
  return reduce(str.split(/ *; */), function(obj, str){
    var parts = str.split(/ *= */)
      , key = parts.shift()
      , val = parts.shift();

    if (key && val) obj[key] = val;
    return obj;
  }, {});
};

/**
 * Initialize a new `Response` with the given `xhr`.
 *
 *  - set flags (.ok, .error, etc)
 *  - parse header
 *
 * Examples:
 *
 *  Aliasing `superagent` as `request` is nice:
 *
 *      request = superagent;
 *
 *  We can use the promise-like API, or pass callbacks:
 *
 *      request.get('/').end(function(res){});
 *      request.get('/', function(res){});
 *
 *  Sending data can be chained:
 *
 *      request
 *        .post('/user')
 *        .send({ name: 'tj' })
 *        .end(function(res){});
 *
 *  Or passed to `.send()`:
 *
 *      request
 *        .post('/user')
 *        .send({ name: 'tj' }, function(res){});
 *
 *  Or passed to `.post()`:
 *
 *      request
 *        .post('/user', { name: 'tj' })
 *        .end(function(res){});
 *
 * Or further reduced to a single call for simple cases:
 *
 *      request
 *        .post('/user', { name: 'tj' }, function(res){});
 *
 * @param {XMLHTTPRequest} xhr
 * @param {Object} options
 * @api private
 */

function Response(xhr, options) {
  options = options || {};
  this.xhr = xhr;
  this.text = xhr.responseText;
  this.setStatusProperties(xhr.status);
  this.header = this.headers = parseHeader(xhr.getAllResponseHeaders());
  // getAllResponseHeaders sometimes falsely returns "" for CORS requests, but
  // getResponseHeader still works. so we get content-type even if getting
  // other headers fails.
  this.header['content-type'] = xhr.getResponseHeader('content-type');
  this.setHeaderProperties(this.header);
  this.body = this.parseBody(this.text);
}

/**
 * Get case-insensitive `field` value.
 *
 * @param {String} field
 * @return {String}
 * @api public
 */

Response.prototype.get = function(field){
  return this.header[field.toLowerCase()];
};

/**
 * Set header related properties:
 *
 *   - `.type` the content type without params
 *
 * A response of "Content-Type: text/plain; charset=utf-8"
 * will provide you with a `.type` of "text/plain".
 *
 * @param {Object} header
 * @api private
 */

Response.prototype.setHeaderProperties = function(header){
  // content-type
  var ct = this.header['content-type'] || '';
  this.type = type(ct);

  // params
  var obj = params(ct);
  for (var key in obj) this[key] = obj[key];
};

/**
 * Parse the given body `str`.
 *
 * Used for auto-parsing of bodies. Parsers
 * are defined on the `superagent.parse` object.
 *
 * @param {String} str
 * @return {Mixed}
 * @api private
 */

Response.prototype.parseBody = function(str){
  var parse = request.parse[this.type];
  return parse
    ? parse(str)
    : null;
};

/**
 * Set flags such as `.ok` based on `status`.
 *
 * For example a 2xx response will give you a `.ok` of __true__
 * whereas 5xx will be __false__ and `.error` will be __true__. The
 * `.clientError` and `.serverError` are also available to be more
 * specific, and `.statusType` is the class of error ranging from 1..5
 * sometimes useful for mapping respond colors etc.
 *
 * "sugar" properties are also defined for common cases. Currently providing:
 *
 *   - .noContent
 *   - .badRequest
 *   - .unauthorized
 *   - .notAcceptable
 *   - .notFound
 *
 * @param {Number} status
 * @api private
 */

Response.prototype.setStatusProperties = function(status){
  var type = status / 100 | 0;

  // status / class
  this.status = status;
  this.statusType = type;

  // basics
  this.info = 1 == type;
  this.ok = 2 == type;
  this.clientError = 4 == type;
  this.serverError = 5 == type;
  this.error = (4 == type || 5 == type)
    ? this.toError()
    : false;

  // sugar
  this.accepted = 202 == status;
  this.noContent = 204 == status || 1223 == status;
  this.badRequest = 400 == status;
  this.unauthorized = 401 == status;
  this.notAcceptable = 406 == status;
  this.notFound = 404 == status;
  this.forbidden = 403 == status;
};

/**
 * Return an `Error` representative of this response.
 *
 * @return {Error}
 * @api public
 */

Response.prototype.toError = function(){
  var msg = 'got ' + this.status + ' response';
  var err = new Error(msg);
  err.status = this.status;
  return err;
};

/**
 * Expose `Response`.
 */

request.Response = Response;

/**
 * Initialize a new `Request` with the given `method` and `url`.
 *
 * @param {String} method
 * @param {String} url
 * @api public
 */

function Request(method, url) {
  var self = this;
  Emitter.call(this);
  this._query = this._query || [];
  this.method = method;
  this.url = url;
  this.header = {};
  this.set('X-Requested-With', 'XMLHttpRequest');
  this.on('end', function(){
    var res = new Response(self.xhr);
    if ('HEAD' == method) res.text = null;
    self.callback(null, res);
  });
}

/**
 * Inherit from `Emitter.prototype`.
 */

Request.prototype = new Emitter;
Request.prototype.constructor = Request;

/**
 * Set timeout to `ms`.
 *
 * @param {Number} ms
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.timeout = function(ms){
  this._timeout = ms;
  return this;
};

/**
 * Clear previous timeout.
 *
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.clearTimeout = function(){
  this._timeout = 0;
  clearTimeout(this._timer);
  return this;
};

/**
 * Abort the request, and clear potential timeout.
 *
 * @return {Request}
 * @api public
 */

Request.prototype.abort = function(){
  if (this.aborted) return;
  this.aborted = true;
  this.xhr.abort();
  this.clearTimeout();
  this.emit('abort');
  return this;
};

/**
 * Set header `field` to `val`, or multiple fields with one object.
 *
 * Examples:
 *
 *      req.get('/')
 *        .set('Accept', 'application/json')
 *        .set('X-API-Key', 'foobar')
 *        .end(callback);
 *
 *      req.get('/')
 *        .set({ Accept: 'application/json', 'X-API-Key': 'foobar' })
 *        .end(callback);
 *
 * @param {String|Object} field
 * @param {String} val
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.set = function(field, val){
  if (isObject(field)) {
    for (var key in field) {
      this.set(key, field[key]);
    }
    return this;
  }
  this.header[field.toLowerCase()] = val;
  return this;
};

/**
 * Set Content-Type to `type`, mapping values from `request.types`.
 *
 * Examples:
 *
 *      superagent.types.xml = 'application/xml';
 *
 *      request.post('/')
 *        .type('xml')
 *        .send(xmlstring)
 *        .end(callback);
 *
 *      request.post('/')
 *        .type('application/xml')
 *        .send(xmlstring)
 *        .end(callback);
 *
 * @param {String} type
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.type = function(type){
  this.set('Content-Type', request.types[type] || type);
  return this;
};

/**
* Add query-string `val`.
*
* Examples:
*
*   request.get('/shoes')
*     .query('size=10')
*     .query({ color: 'blue' })
*
* @param {Object|String} val
* @return {Request} for chaining
* @api public
*/

Request.prototype.query = function(val){
  if ('string' != typeof val) val = serialize(val);
  this._query.push(val);
  return this;
};

/**
 * Send `data`, defaulting the `.type()` to "json" when
 * an object is given.
 *
 * Examples:
 *
 *       // querystring
 *       request.get('/search')
 *         .end(callback)
 *
 *       // multiple data "writes"
 *       request.get('/search')
 *         .send({ search: 'query' })
 *         .send({ range: '1..5' })
 *         .send({ order: 'desc' })
 *         .end(callback)
 *
 *       // manual json
 *       request.post('/user')
 *         .type('json')
 *         .send('{"name":"tj"})
 *         .end(callback)
 *
 *       // auto json
 *       request.post('/user')
 *         .send({ name: 'tj' })
 *         .end(callback)
 *
 *       // manual x-www-form-urlencoded
 *       request.post('/user')
 *         .type('form')
 *         .send('name=tj')
 *         .end(callback)
 *
 *       // auto x-www-form-urlencoded
 *       request.post('/user')
 *         .type('form')
 *         .send({ name: 'tj' })
 *         .end(callback)
 *
 *       // defaults to x-www-form-urlencoded
  *      request.post('/user')
  *        .send('name=tobi')
  *        .send('species=ferret')
  *        .end(callback)
 *
 * @param {String|Object} data
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.send = function(data){
  var obj = isObject(data);
  var type = this.header['content-type'];

  // merge
  if (obj && isObject(this._data)) {
    for (var key in data) {
      this._data[key] = data[key];
    }
  } else if ('string' == typeof data) {
    if (!type) this.type('form');
    type = this.header['content-type'];
    if ('application/x-www-form-urlencoded' == type) {
      this._data = this._data
        ? this._data + '&' + data
        : data;
    } else {
      this._data = (this._data || '') + data;
    }
  } else {
    this._data = data;
  }

  if (!obj) return this;
  if (!type) this.type('json');
  return this;
};

/**
 * Invoke the callback with `err` and `res`
 * and handle arity check.
 *
 * @param {Error} err
 * @param {Response} res
 * @api private
 */

Request.prototype.callback = function(err, res){
  var fn = this._callback;
  if (2 == fn.length) return fn(err, res);
  if (err) return this.emit('error', err);
  fn(res);
};

/**
 * Invoke callback with x-domain error.
 *
 * @api private
 */

Request.prototype.crossDomainError = function(){
  var err = new Error('Origin is not allowed by Access-Control-Allow-Origin');
  err.crossDomain = true;
  this.callback(err);
};

/**
 * Invoke callback with timeout error.
 *
 * @api private
 */

Request.prototype.timeoutError = function(){
  var timeout = this._timeout;
  var err = new Error('timeout of ' + timeout + 'ms exceeded');
  err.timeout = timeout;
  this.callback(err);
};

/**
 * Enable transmission of cookies with x-domain requests.
 *
 * Note that for this to work the origin must not be
 * using "Access-Control-Allow-Origin" with a wildcard,
 * and also must set "Access-Control-Allow-Credentials"
 * to "true".
 *
 * @api public
 */

Request.prototype.withCredentials = function(){
  this._withCredentials = true;
  return this;
};

/**
 * Initiate request, invoking callback `fn(res)`
 * with an instanceof `Response`.
 *
 * @param {Function} fn
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.end = function(fn){
  var self = this;
  var xhr = this.xhr = getXHR();
  var query = this._query.join('&');
  var timeout = this._timeout;
  var data = this._data;

  // store callback
  this._callback = fn || noop;

  // CORS
  if (this._withCredentials) xhr.withCredentials = true;

  // state change
  xhr.onreadystatechange = function(){
    if (4 != xhr.readyState) return;
    if (0 == xhr.status) {
      if (self.aborted) return self.timeoutError();
      return self.crossDomainError();
    }
    self.emit('end');
  };

  // progress
  if (xhr.upload) {
    xhr.upload.onprogress = function(e){
      e.percent = e.loaded / e.total * 100;
      self.emit('progress', e);
    };
  }

  // timeout
  if (timeout && !this._timer) {
    this._timer = setTimeout(function(){
      self.abort();
    }, timeout);
  }

  // querystring
  if (query) {
    query = request.serializeObject(query);
    this.url += ~this.url.indexOf('?')
      ? '&' + query
      : '?' + query;
  }

  // initiate request
  xhr.open(this.method, this.url, true);

  // body
  if ('GET' != this.method && 'HEAD' != this.method && 'string' != typeof data) {
    // serialize stuff
    var serialize = request.serialize[this.header['content-type']];
    if (serialize) data = serialize(data);
  }

  // set header fields
  for (var field in this.header) {
    xhr.setRequestHeader(field, this.header[field]);
  }

  // send stuff
  xhr.send(data);
  return this;
};

/**
 * Expose `Request`.
 */

request.Request = Request;

/**
 * Issue a request:
 *
 * Examples:
 *
 *    request('GET', '/users').end(callback)
 *    request('/users').end(callback)
 *    request('/users', callback)
 *
 * @param {String} method
 * @param {String|Function} url or callback
 * @return {Request}
 * @api public
 */

function request(method, url) {
  // callback
  if ('function' == typeof url) {
    return new Request('GET', method).end(url);
  }

  // url first
  if (1 == arguments.length) {
    return new Request('GET', method);
  }

  return new Request(method, url);
}

/**
 * GET `url` with optional callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed|Function} data or fn
 * @param {Function} fn
 * @return {Request}
 * @api public
 */

request.get = function(url, data, fn){
  var req = request('GET', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.query(data);
  if (fn) req.end(fn);
  return req;
};

/**
 * GET `url` with optional callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed|Function} data or fn
 * @param {Function} fn
 * @return {Request}
 * @api public
 */

request.head = function(url, data, fn){
  var req = request('HEAD', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.send(data);
  if (fn) req.end(fn);
  return req;
};

/**
 * DELETE `url` with optional callback `fn(res)`.
 *
 * @param {String} url
 * @param {Function} fn
 * @return {Request}
 * @api public
 */

request.del = function(url, fn){
  var req = request('DELETE', url);
  if (fn) req.end(fn);
  return req;
};

/**
 * PATCH `url` with optional `data` and callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed} data
 * @param {Function} fn
 * @return {Request}
 * @api public
 */

request.patch = function(url, data, fn){
  var req = request('PATCH', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.send(data);
  if (fn) req.end(fn);
  return req;
};

/**
 * POST `url` with optional `data` and callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed} data
 * @param {Function} fn
 * @return {Request}
 * @api public
 */

request.post = function(url, data, fn){
  var req = request('POST', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.send(data);
  if (fn) req.end(fn);
  return req;
};

/**
 * PUT `url` with optional `data` and callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed|Function} data or fn
 * @param {Function} fn
 * @return {Request}
 * @api public
 */

request.put = function(url, data, fn){
  var req = request('PUT', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.send(data);
  if (fn) req.end(fn);
  return req;
};

/**
 * Expose `request`.
 */

module.exports = request;

});
require.register("component-s3/index.js", function(exports, require, module){

/**
 * Module dependencies.
 */

var Emitter = require('emitter')
  , request = require('superagent');

/**
 * Expose `Upload`.
 */

module.exports = Upload;

/**
 * Initialize a new `Upload` file` and options.
 *
 * Options:
 *
 *   - `name` remote filename or `file.name`
 *   - `type` content-type or `file.type` / application/octet-stream
 *   - `route` signature GET route [/sign]
 *
 * Events:
 *
 *   - `error` an error occurred
 *   - `abort` upload was aborted
 *   - `progress` upload in progress (`e.percent` etc)
 *   - `end` upload is complete
 *
 * @param {File} file
 * @param {Object} [options]
 * @api private
 */

function Upload(file, options) {
  if (!(this instanceof Upload)) return new Upload(file, options);
  options = options || {};
  this.file = file;
  this.type = options.type || file.type || 'application/octet-stream';
  this.name = options.name || file.name;
  this.route = options.route || '/sign';
  this.header = {};
}

/**
 * Mixin emitter.
 */

Emitter(Upload.prototype);

/**
 * Set header `field` to `val`.
 *
 * @param {String} field
 * @param {String} val
 * @return {Upload} self
 * @api public
 */

Upload.prototype.set = function(field, val){
  this.header[field] = val;
  return this;
};

/**
 * Fetch signed url and invoke `fn(err, url)`.
 *
 * @param {Function} fn
 * @api private
 */

Upload.prototype.sign = function(fn){
  request
  .get(this.route)
  .query({ name: this.name, mime: this.type })
  .end(function(res){
    fn(null, res.text);
  });
};

/**
 * Upload the file and invoke `fn(err)`.
 *
 * @param {Function} [fn]
 * @api public
 */

Upload.prototype.end = function(fn){
  var self = this;
  fn = fn || function(){};
  this.sign(function(err, url){
    if (err) return fn(err);
    self.put(url, fn);
  });
};

/**
 * PUT to `url` and invoke `fn(err)`.
 *
 * @param {String} url
 * @param {Function} fn
 * @api private
 */

Upload.prototype.put = function(url, fn){
  var self = this;
  var req = this.req = request.put(url);

  // header
  req.set('X-Requested-With', null);
  req.set('Content-Type', this.type);
  req.set('x-amz-acl', 'public-read');

  // custom fields
  for (var key in this.header) {
    req.set(key, this.header[key]);
  }

  // progress
  req.on('progress', function(e){
    self.emit('progress', e);
  });

  // send
  var file = this.file.toFile
    ? this.file.toFile()
    : this.file;

  req.send(file);

  req.end(function(res){
    if (res.error) return fn(res.error);
    self.emit('end');
    fn();
  });
};

/**
 * Abort the XHR.
 *
 * @api public
 */

Upload.prototype.abort = function(){
  this.emit('abort');
  this.req.abort();
};

});
require.register("component-type/index.js", function(exports, require, module){

/**
 * toString ref.
 */

var toString = Object.prototype.toString;

/**
 * Return the type of `val`.
 *
 * @param {Mixed} val
 * @return {String}
 * @api public
 */

module.exports = function(val){
  switch (toString.call(val)) {
    case '[object Function]': return 'function';
    case '[object Date]': return 'date';
    case '[object RegExp]': return 'regexp';
    case '[object Arguments]': return 'arguments';
    case '[object Array]': return 'array';
    case '[object String]': return 'string';
  }

  if (val === null) return 'null';
  if (val === undefined) return 'undefined';
  if (val && val.nodeType === 1) return 'element';
  if (val === Object(val)) return 'object';

  return typeof val;
};

});
require.register("davidtsuji-sg-random-between/index.js", function(exports, require, module){
module.exports = function(_min, _max) {

	var min = _min < _max ? _min : _max
	  , max = _min < _max ? _max : _min
	  , minAndMaxAreNumbers = typeof min == 'number' && typeof max == 'number'

	return minAndMaxAreNumbers ? Math.floor(Math.random() * (max - min + 1)) + min : NaN;

}
});
require.register("davidtsuji-sg-uid/index.js", function(exports, require, module){
var randomBetween = require('sg-random-between');

module.exports = function(_length) {

	var alphabet = ['a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z']
	  , length = typeof _length == 'number' && _length > 0 ? _length : 16
	  , beginWith = alphabet[randomBetween(0, 25)]
	  , uid = Math.random().toString(35).substr(2,length-1)

	return beginWith + uid;

}
});
require.register("sg-upload-to-s3/index.js", function(exports, require, module){
var async = require('async')
  , uid = require('sg-uid')
  , mime = require('mime')
  , type = require('type')
  , Emitter = require('emitter')
  , Upload = require('s3')

Emitter(exports);

function queueDrained(_error) {

	exports.emit('end', _error, exports);

}

function processUpload(_file, _callback) {

	var self = exports
	  , upload = Upload(_file.file, {name: _file.fileName});

	_file.upload = upload;

	upload.route = _file.route;

	upload.on('progress', function(_event){

		_file.progress = _event.percent | 0;
		calculateProgress();

	});

	upload.on('abort', function(){

		var abortedFiles;

		self.data.totalBytes -= _file.file.size;

		for (var i=0; i<self.data.uploads.length; i++) {

			if (self.data.uploads[i] === _file) {
				abortedFiles = self.data.uploads.splice(i, 1);
				break;
			}

		}

		self.emit('abort', abortedFiles, self);
		_callback();

	});

	upload.end(function(_error){

		if (_error) {
			_file.progress = 0;
			_file.error = _error;
			self.data.totalBytes -= _file.file.size | 0;
			self.emit('error', _error, self);
		} else {
			_file.progress = 100;
		}

		calculateProgress();

		_callback(_error);
		
	});

}

function lookupFileExtension(_file) {

	var extension
	  , mimeTypes = Object.keys(mime.types)

	for (var i=0; i < mimeTypes.length; i++) {

		if (mime.types[mimeTypes[i]] == _file.type) {
			extension = mimeTypes[i];
			break;
		}

	};

	return extension;

}

function getUTCUnixTimestamp() {
	return Date.parse(new Date().toUTCString()) / 1000;
}

function sumUploadedBytes(_files) {

	var uploadedBytes = 0;

	_files.forEach(function(_file){
		
		uploadedBytes += _file['error'] ? 0 : _file.file.size * (_file.progress / 100);

	});

	return uploadedBytes;

}

function calculateProgress() {

	var self = exports

	self.data.uploadedBytes = sumUploadedBytes(self.data.uploads);
	self.data.progress = (self.data.uploadedBytes / self.data.totalBytes) * 100;
	self.emit('progress', self);

}

exports.data = {

	uploads: [],
	totalBytes: 0,
	uploadedBytes: 0,
	progress: 0

}

exports.upload = function(_files, _signaturePath, _generateFileName) {

	console.log(_files);

	var self = this;

	self.emit('start', self);
	self.started = true;

	if ( ! self['queue']) {
		self.queue = async.queue(processUpload, self.defaults.numSimultaneousUploads);
		self.queue.drained = queueDrained;
	}

	for (var i=0; i<_files.length; i++) {

		var upload = {

			file: _files[i],
			progress: 0,
			fileName: (_generateFileName || self.defaults.generateFileName) ? getUTCUnixTimestamp() + '-' + uid(4) + '.' + lookupFileExtension(_files[i]) : _files[i].name,
			route: _signaturePath || self.defaults.signaturePath

		}

		self.data.totalBytes += upload.file.size | 0;
		self.data.uploads.push(upload);
		self.queue.push(upload);

	}

}

exports.defaults = {

	numSimultaneousUploads: 2,
	signaturePath: '/signS3',
	generateFileName: false,

}
});
require.register("sg-upload-to-s3/sign.js", function(exports, require, module){
/**
 * S3 Buckets require a CORS configuration that includes your origin in the <AllowedOrigin>
 *
 * <?xml version="1.0" encoding="UTF-8"?>
 * <CORSConfiguration xmlns="http://s3.amazonaws.com/doc/2006-03-01/">
 *     <CORSRule>
 *         <AllowedOrigin>*</AllowedOrigin>
 *         <AllowedMethod>GET</AllowedMethod>
 *         <MaxAgeSeconds>3000</MaxAgeSeconds>
 *         <AllowedHeader>Authorization</AllowedHeader>
 *     </CORSRule>
 *     <CORSRule>
 *         <AllowedOrigin>http://localhost:5000</AllowedOrigin>
 *         <AllowedMethod>PUT</AllowedMethod>
 *         <MaxAgeSeconds>3000</MaxAgeSeconds>
 *         <AllowedHeader>*</AllowedHeader>
 *     </CORSRule>
 * </CORSConfiguration>
 * 
 */

var crypto = require('crypto')
  , config

function sign(options) {

	var expires = (Date.now() + options.expires) / 1000 | 0;

	var str = options.method.toUpperCase()
		+ '\n\n' + options.mime
		+ '\n' + expires
		+ '\nx-amz-acl:public-read'
		+ '\n/' + options.bucket
		+ '/' + options.name;

	var sig = crypto
		.createHmac('sha1', options.secret)
		.update(str)
		.digest('base64');

	sig = encodeURIComponent(sig);

	return 'http://' + options.bucket
		+ '.' + config.region + '/'
		+ options.name
		+ '?Expires=' + expires
		+ '&AWSAccessKeyId=' + options.key
		+ '&Signature=' + sig;
}

module.exports = function(_config) {

	config = _config;

	return function(_req, _res, _next) {

		var obj = {
			bucket: config.bucket,
			key: config.key,
			secret: config.secret,
			expires: 5 * 60 * 1000,
			mime: _req.query.mime,
			name: _req.query.name,
			method: 'PUT'
		};

		_req.signed = sign(obj);
		_next();

	}

}
});
require.alias("caolan-async/lib/async.js", "sg-upload-to-s3/deps/async/lib/async.js");
require.alias("caolan-async/lib/async.js", "sg-upload-to-s3/deps/async/index.js");
require.alias("caolan-async/lib/async.js", "async/index.js");
require.alias("caolan-async/lib/async.js", "caolan-async/index.js");

require.alias("component-emitter/index.js", "sg-upload-to-s3/deps/emitter/index.js");
require.alias("component-emitter/index.js", "emitter/index.js");
require.alias("component-indexof/index.js", "component-emitter/deps/indexof/index.js");

require.alias("component-mime/index.js", "sg-upload-to-s3/deps/mime/index.js");
require.alias("component-mime/types.js", "sg-upload-to-s3/deps/mime/types.js");
require.alias("component-mime/index.js", "mime/index.js");

require.alias("component-s3/index.js", "sg-upload-to-s3/deps/s3/index.js");
require.alias("component-s3/index.js", "s3/index.js");
require.alias("component-emitter/index.js", "component-s3/deps/emitter/index.js");
require.alias("component-indexof/index.js", "component-emitter/deps/indexof/index.js");

require.alias("visionmedia-superagent/lib/client.js", "component-s3/deps/superagent/lib/client.js");
require.alias("visionmedia-superagent/lib/client.js", "component-s3/deps/superagent/index.js");
require.alias("component-emitter/index.js", "visionmedia-superagent/deps/emitter/index.js");
require.alias("component-indexof/index.js", "component-emitter/deps/indexof/index.js");

require.alias("RedVentures-reduce/index.js", "visionmedia-superagent/deps/reduce/index.js");

require.alias("visionmedia-superagent/lib/client.js", "visionmedia-superagent/index.js");

require.alias("component-type/index.js", "sg-upload-to-s3/deps/type/index.js");
require.alias("component-type/index.js", "type/index.js");

require.alias("davidtsuji-sg-uid/index.js", "sg-upload-to-s3/deps/sg-uid/index.js");
require.alias("davidtsuji-sg-uid/index.js", "sg-upload-to-s3/deps/sg-uid/index.js");
require.alias("davidtsuji-sg-uid/index.js", "sg-uid/index.js");
require.alias("davidtsuji-sg-random-between/index.js", "davidtsuji-sg-uid/deps/sg-random-between/index.js");
require.alias("davidtsuji-sg-random-between/index.js", "davidtsuji-sg-uid/deps/sg-random-between/index.js");
require.alias("davidtsuji-sg-random-between/index.js", "davidtsuji-sg-random-between/index.js");

require.alias("davidtsuji-sg-uid/index.js", "davidtsuji-sg-uid/index.js");

require.alias("sg-upload-to-s3/index.js", "sg-upload-to-s3/index.js");

if (typeof exports == "object") {
  module.exports = require("sg-upload-to-s3");
} else if (typeof define == "function" && define.amd) {
  define(function(){ return require("sg-upload-to-s3"); });
} else {
  this["sgUploadToS3"] = require("sg-upload-to-s3");
}})();