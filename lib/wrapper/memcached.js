var path = require('path');
var lib_dir = path.join(__dirname, '..');

var logging = require(path.join(lib_dir, 'logging'));
var obj_patch = require(path.join(lib_dir, 'obj_patch'));
var wrapper = require(path.join(lib_dir, 'wrapper'));
var collector = require(path.join(lib_dir, 'collector'));

var LOG = new logging.Logger(path.basename(module.filename));
var COLLECTOR = collector.getCollector();


function command(func, name) {
    return function (queryCompiler, server) {
        var t, tr, ret, error;
        var query = queryCompiler();
        var name = 'memcached.' + query.type;
        
        t = COLLECTOR.getTransaction();
        tr = t.beginTrace(name);
        tr.setAsync(true);
        
        query.callback = wrapper.callbackWrapper(query.callback, name, t, tr);
        
        try {
            ret = func.call(this, function () {return query}, server);
        } catch(e) { 
            if (t) t.addException(msg);
            error = e;
        } finally {
            if (tr) t.exitTrace(tr);
        }
        if (error) throw error;
        
        return ret;
    };
}

function patch(memcached) {
    obj_patch.add(memcached.prototype, 'memcached.prototype', 'command', command);
}

module.exports.patch = patch
