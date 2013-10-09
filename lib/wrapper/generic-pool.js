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
        var t = COLLECTOR.getTransaction();
        if (!t)
            return func.apply(this, arguments);
        
        var tr, ret, error;
        LOG.debug("Wrapped call: %s", name);
        
        tr = t.beginTrace(name);
        tr.setAsync(true);
        
        callback = wrapper.callbackWrapper(callback, name, t, tr);
    
        try {
            ret = func.call(this, callback, priority);
        } catch(e) { 
            t.addException(msg);
            error = e;
        } finally {
            t.exitTrace(tr);
        }
        if (error) throw error;
        
        return ret;
    };
}

function Pool(func, name) {
    return function () {
        var t = COLLECTOR.getTransaction();
        if(!t)
            return func.apply(this, arguments);
        
        var t, tr, ret, error;
        LOG.debug("Wrapped pool creation: %s", name);
        
        tr = t.beginTrace(name);
        tr.setAsync(true);
        try {
            ret = func.apply(this, arguments);
        } catch(e) { 
            t.addException(e);
            error = e;
        } finally {
            t.finishTrace(tr);
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
