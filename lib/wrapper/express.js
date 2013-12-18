var path = require('path');
var lib_dir = path.join(__dirname, '..');

var logging = require(path.join(lib_dir, 'logging'));
var obj_patch = require(path.join(lib_dir, 'obj_patch'));
var wrapper = require(path.join(lib_dir, 'wrapper'));
var collector = require(path.join(lib_dir, 'collector'));

var LOG = new logging.Logger(path.basename(module.filename));
var COLLECTOR = collector.getCollector();

function render(func, name) {
    var wrapped = wrapper.callWrapper(func, name);
    return function (view, options, callback, parent, sub) {
        if ('function' === typeof options) {
            callback = options;
            options = null;
        }
        
        if (callback) {
            var transaction = COLLECTOR.getTransaction();
            if (!transaction)
                return func.call(this, options, callback);
            
            LOG.debug("Wrapped render call: %s, tid: %s", name, transaction._id);

            var trace, ret, error;

            trace = transaction.beginTrace(name);
            trace.setAsync(true);
            trace.setArgs(arguments);
            try {
                ret = func.call(this, options,
                    wrapper.callbackWrapper(callback, name, transaction, trace));
            } catch(e) { 
                transaction.addException(e);
                error = e;
            } finally {
                transaction.exitTrace(trace);
            }
            if (error) throw error;
            
            return ret;
        }

        return wrapped.call(this, view, options, callback);
    };
}

function route(func, name) {
    return function (method, path, callbacks) {
        var wrapped = [];
        if (!Array.isArray(callbacks)) {
            callbacks = [callbacks];
        }
        
        callbacks.forEach(function(fn, i) {
            var cbName = name + ':' + (fn.name || path);
            wrapped.push(wrapper.callWrapper(fn, cbName));
        });
        
        var ret = func.call(this, method, path, wrapped);
        return ret;
    };
}

function patch(express) {
    var version = express && express.version && express.version[0];
    if (!version && express && express.response && express.response.render
            && express.Router && express.Router.prototype) {
        version = '3';
    }
    switch (version) {
        case '2':
            var http = require('http');
            obj_patch.add(http.ServerResponse.prototype, 'http.ServerResponse.prototype',
                    'render', render);
            break;
        case '3':
            obj_patch.add(express.response, 'express.response', 'render', render);
            obj_patch.add(express.Router.prototype, 'express.Router.prototype', 'route', route);
            break;
        default:
            LOG.warn("Unrecognized express version: %s", version);
    }
}

module.exports.patch = patch
