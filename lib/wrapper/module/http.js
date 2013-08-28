var path = require('path')
var logging = require(path.join(__dirname, '..', '..', 'logging'));
var obj_patch = require(path.join(__dirname, '..', '..', 'obj_patch'));
var common = require(path.join(__dirname, '..', 'common'));
var collector = require(path.join(__dirname, '..', '..', 'collector'));

var LOG = new logging.Logger(path.basename(module.filename));
var COLLECTOR = collector.getCollector();

function createServer(func, name) {
    return function (handler) {
        var wrapper = common.transactionWrapper(handler, name + '.handler');
        return func(wrapper);
    };
}

function request(func, name) {
    return function (options, callback) {
        var t, tr, ret, error;
        
        LOG.debug("Wrapped call: %s", name);
        
        t = COLLECTOR.createNestedTransaction();
        tr = COLLECTOR.beginTrace(name);
        tr.addTransaction(t);
        try {
            ret = func.call(this, options, common.callbackWrapper(callback, name, t));
        } catch(e) { 
            tr.addException(e);
            error = e;
        } finally {
            COLLECTOR.endTrace();
        }
        if (error) throw error;
        
        return ret;
    }
}

module.exports.createServer = createServer
module.exports.request = request
