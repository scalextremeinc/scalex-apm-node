var path = require('path');
var lib_dir = path.join(__dirname, '..');

var logging = require(path.join(lib_dir, 'logging'));
var obj_patch = require(path.join(lib_dir, 'obj_patch'));
var wrapper = require(path.join(lib_dir, 'wrapper'));
var collector = require(path.join(lib_dir, 'collector'));

var LOG = new logging.Logger(path.basename(module.filename));
var COLLECTOR = collector.getCollector();


function parallel(func, name) {
    return function () {
        var t = COLLECTOR.getTransaction();
        if (!t)
            return func.apply(this, arguments);
        
        LOG.debug("Wrapped call: %s", name);
        var ret, tr, error;
        var args = Array.prototype.slice.call(arguments, 0);
        
        for (var i = 0; i < args.length - 1; i++) {
            args[i] = wrapper.callWrapper(args[i], name);
        }
        
        tr = t.beginTrace(name);
        
        // wrap callback param (last param)
        args[args.length - 1] = wrapper.callbackWrapper(args[args.length - 1], name, t, tr);
        
        try {
            ret = func.apply(this, args);
        } catch(e) { 
            t.addException(msg);
            error = e;
        } finally {
            t.exitTrace(tr);
        }
        if (error)
            throw error;
        
        return ret;
    };
}

function patch(async) {
    obj_patch.add(async, 'async', 'parallel', parallel);
}

module.exports.patch = patch
