var path = require('path');
var lib_dir = path.join(__dirname, '..');

var logging = require(path.join(lib_dir, 'logging'));
var obj_patch = require(path.join(lib_dir, 'obj_patch'));
var wrapper = require(path.join(lib_dir, 'wrapper'));
var collector = require(path.join(lib_dir, 'collector'));

var LOG = new logging.Logger(path.basename(module.filename));
var COLLECTOR = collector.getCollector();

function render(func, name) {
    var cbName = name + '.callback';
    var wrapped = wrapper.callWrapper(func, name);
    return function (view, options, callback) {
        
        if ('function' === typeof options) {
            callback = options;
            options = null;
        }
        
        if (callback) {
            var t, tr, ret, error;
            LOG.debug("Wrapped call: %s", name);            
            t = COLLECTOR.getTransaction();
            tr = COLLECTOR.beginTrace(name);
            tr.setAsync(true);
            try {
                ret = func.call(this, options, wrapper.callbackWrapper(callback, cbName, t, tr));
            } catch(e) { 
                if (tr) tr.addException(e);
                error = e;
            } finally {
                if (tr) {
                    COLLECTOR.exitTrace(tr);
                    COLLECTOR.exitTransaction(t);
                }
            }
            if (error) throw error;
            
            return ret;
        }

        return wrapped.call(this, view, options, callback);
    };
}


function patch(express) {
    obj_patch.add(express.response, 'express.response', 'render', render);
}

module.exports.patch = patch
