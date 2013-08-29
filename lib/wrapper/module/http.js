var path = require('path')
var logging = require(path.join(__dirname, '..', '..', 'logging'));
var obj_patch = require(path.join(__dirname, '..', '..', 'obj_patch'));
var wrapper = require(path.join(__dirname, '..', 'wrapper'));
var collector = require(path.join(__dirname, '..', '..', 'collector'));

var LOG = new logging.Logger(path.basename(module.filename));
var COLLECTOR = collector.getCollector();

function createServer(func, name) {
    return function (handler) {
        return func(wrapper.transactionWrapper(handler, name + '.handler'));
    };
}

function request(func, name) {
    var callbackName = name + '.callback'
    return function (options, callback) {
        var t, tr, ret, error;
        
        LOG.debug("Wrapped call: %s", name);
        
        t = COLLECTOR.getTransaction();
        tr = COLLECTOR.beginTrace(name);
        tr.setAsync(true);
        try {
            ret = func.call(this, options, wrapper.callbackWrapper(callback, callbackName, t, tr));
        } catch(e) { 
            if (tr) tr.addException(e);
            error = e;
        } finally {
            if (tr) t.exitTraceAsync(tr);
        }
        if (error) throw error;
        
        return ret;
    }
}

module.exports.createServer = createServer
module.exports.request = request
