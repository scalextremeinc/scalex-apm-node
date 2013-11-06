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
        var transaction = COLLECTOR.getTransaction();
        if (!transaction)
            return func.apply(this, arguments);
        
        LOG.debug("Wrapped call: %s", name);
        var ret, trace, error;
        var args = Array.prototype.slice.call(arguments, 0);
        
        for (var i = 0; i < args[0].length; i++) {
            args[0][i] = wrapper.callWrapper(args[0][i], name + '.task.' + i, transaction);
        }
        
        trace = transaction.beginTrace(name);
        trace.setArgs(arguments);
        // wrap callback param (last param)
        args[1] = wrapper.callbackWrapper(args[1], name, transaction, trace);
        
        try {
            ret = func.apply(this, args);
        } catch(e) { 
            transaction.addException(msg);
            error = e;
        } finally {
            transaction.exitTrace(trace);
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
