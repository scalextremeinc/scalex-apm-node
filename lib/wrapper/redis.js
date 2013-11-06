var path = require('path');
var lib_dir = path.join(__dirname, '..');

var logging = require(path.join(lib_dir, 'logging'));
var obj_patch = require(path.join(lib_dir, 'obj_patch'));
var wrapper = require(path.join(lib_dir, 'wrapper'));
var collector = require(path.join(lib_dir, 'collector'));

var LOG = new logging.Logger(path.basename(module.filename));
var COLLECTOR = collector.getCollector();


function send_command(func, name) {
    return function () {
        var transaction = COLLECTOR.getTransaction();
        if (!transaction)
            return func.apply(this, arguments);
        
        var args = Array.prototype.slice.call(arguments);
        var arg_last = args[args.length -1];
        
        if ('function' === typeof arg_last && arg_last._scalex_callback) {
            return func.apply(this, args);
        } else if (Array.isArray(arg_last) 
                && typeof arg_last[arg_last.length - 1] === 'function'
                && arg_last[arg_last.length - 1]._scalex_callback) {
            return func.apply(this, args);
        }
        
        var trace, ret, error;
        var command = args[0];
        var name = 'redis.' + command;
        var callback = true;
        
        LOG.debug("Wrapped redis command: %s", command);
        
        trace = transaction.beginTrace(name);
        trace.setAsync(true);
        trace.setArgs(arguments);
        
        if ('function' === typeof arg_last) {
            var wrapped = wrapper.callbackWrapper(arg_last, name, transaction, trace);
            wrapped._scalex_callback = true;
            args[args.length -1] = wrapped;
        } else if (Array.isArray(arg_last) && typeof arg_last[arg_last.length - 1] === 'function') {
            var wrapped = wrapper.callbackWrapper(
                arg_last[arg_last.length - 1], name, transaction, trace);
            wrapped._scalex_callback = true;    
            arg_last[arg_last.length - 1] = wrapped;
        } else {
            callback = false;
        }
        
        try {
            ret = func.apply(this, args);
        } catch(e) { 
            transaction.addException(msg);
            error = e;
        } finally {
            transaction.exitTrace(trace);
            if (!callback)
                transaction.endTrace(trace);
        }
        if (error)
            throw error;
        
        return ret;
    };
}

function patch(redis) {
    obj_patch.add(redis && redis.RedisClient && redis.RedisClient.prototype,
        'redis.RedisClient.prototype', 'send_command', send_command);
}

module.exports.patch = patch
