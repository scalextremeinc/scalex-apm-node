var path = require('path');
var lib_dir = path.join(__dirname, '..');

var logging = require(path.join(lib_dir, 'logging'));
var obj_patch = require(path.join(lib_dir, 'obj_patch'));
var wrapper = require(path.join(lib_dir, 'wrapper'));
var collector = require(path.join(lib_dir, 'collector'));

var LOG = new logging.Logger(path.basename(module.filename));
var COLLECTOR = collector.getCollector();


function acquire(func, name) {
    return function (callback, priority) {
        var transaction = COLLECTOR.getTransaction();
        if (!transaction)
            return func.apply(this, arguments);
        
        var trace, ret, error;
        LOG.debug("Wrapped call: %s", name);
        
        trace = transaction.beginTrace(name);
        trace.setAsync(true);
        trace.setArgs(arguments);
        
        callback = wrapper.callbackWrapper(callback, name, transaction, trace);
    
        try {
            ret = func.call(this, callback, priority);
        } catch(e) { 
            transaction.addException(msg);
            error = e;
        } finally {
            transaction.exitTrace(trace);
        }
        if (error) throw error;
        
        return ret;
    };
}

function Pool(func, name) {
    return function () {
        var transaction = COLLECTOR.getTransaction();
        if(!transaction)
            return func.apply(this, arguments);
        
        var transaction, trace, ret, error;
        LOG.debug("Wrapped pool creation: %s", name);
        
        trace = transaction.beginTrace(name);
        trace.setAsync(true);
        trace.setArgs(arguments);
        
        try {
            ret = func.apply(this, arguments);
        } catch(e) { 
            transaction.addException(e);
            error = e;
        } finally {
            transaction.finishTrace(trace);
        }
        if (error)
            throw error;
        
        obj_patch.add(ret, 'generic-pool.Pool', 'acquire', acquire);
        
        return ret;
    };
}

function patch(generic_pool) {
    obj_patch.add(generic_pool, 'generic-pool', 'Pool', Pool);
}

module.exports.patch = patch
