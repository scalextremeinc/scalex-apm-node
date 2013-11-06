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
    return function (view, options, callback) {
        LOG.debug("Wrapped render call: %s", name);
        
        if ('function' === typeof options) {
            callback = options;
            options = null;
        }
        
        if (callback) {
            var transaction = COLLECTOR.getTransaction();
            if (!transaction)
                return func.call(this, options, callback);
            
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
    obj_patch.add(express.response, 'express.response', 'render', render);
    //obj_patch.add(express.application, 'express.application', 'render', render);
    obj_patch.add(express.Router.prototype, 'express.Router.prototype', 'route', route);
}

module.exports.patch = patch
