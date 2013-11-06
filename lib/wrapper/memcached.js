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
        var tansaction = COLLECTOR.getTransaction();
        if (!tansaction)
            return func.call(this, queryCompiler, server);
        
        var trace, ret, error;    
        var query = queryCompiler();
        var name = 'memcached.' + query.type;
        
        trace = tansaction.beginTrace(name);
        trace.setAsync(true);
        trace.setArgs(arguments);
        
        query.callback = wrapper.callbackWrapper(query.callback, name, tansaction, trace);
        
        try {
            ret = func.call(this, function () {return query}, server);
        } catch(e) { 
            tansaction.addException(e);
            error = e;
        } finally {
            tansaction.exitTrace(tr);
        }
        if (error)
            throw error;
        
        return ret;
    };
}

function patch(memcached) {
    obj_patch.add(memcached.prototype, 'memcached.prototype', 'command', command);
}

module.exports.patch = patch
