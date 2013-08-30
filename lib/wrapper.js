var path = require('path');
var lib_dir = __dirname;

var logging = require(path.join(lib_dir, 'logging'));
var collector = require(path.join(lib_dir, 'collector'));

var LOG = new logging.Logger(path.basename(module.filename));
var COLLECTOR = collector.getCollector();

function dummyWrapper(func, name) {
    return function () {
        var start = Date.now();
        var ret = func.apply(this, arguments);
        LOG.info("Call, func: %s, time: %s", name, Date.now() - start);
        return ret;
    }
}

function transactionWrapper(func, name) {
    return function () {
        var tr, ret, error;
        
        LOG.debug("New transaction: %s", name);

        t = COLLECTOR.beginTransaction(name);
        tr = COLLECTOR.beginTrace(name);
        try {
            ret = func.apply(this, arguments);
        } catch(e) { 
            if (tr) tr.addException(e);
            error = e;
        } finally {
            if (tr) {
                COLLECTOR.endTrace(tr);
                COLLECTOR.endTransaction(t);
            }
        }
        if (error) throw error;
        
        return ret;
    }
}

function callWrapper(func, name) {
    return function () {
        var tr, ret, error;
        
        LOG.debug("Wrapped call: %s", name);

        tr = COLLECTOR.beginTrace(name);
        try {
            ret = func.apply(this, arguments);
        } catch(e) { 
            if (tr) tr.addException(e);
            error = e;
        } finally {
            if (tr) COLLECTOR.endTrace(tr);
        }
        if (error) throw error;
        
        return ret;
    }
}

function callbackWrapper(callback, name, t, tr) {
    return function() {
        var ret, error;
        
        LOG.debug("Callback call: %s", name);

        COLLECTOR.enterTransaction(t);
        COLLECTOR.enterTrace(tr);
        try {
            ret = callback.apply(this, arguments);
        } catch(e) { 
            if (tr) tr.addException(e);
            error = e;
        } finally {
            if (tr) {
                COLLECTOR.endTrace(tr);
                COLLECTOR.exitTransaction(t);
            }
        }
        if (error) throw error;
        
        return ret;
    }
}

module.exports.dummyWrapper = dummyWrapper
module.exports.transactionWrapper = transactionWrapper
module.exports.callWrapper = callWrapper
module.exports.callbackWrapper = callbackWrapper;
