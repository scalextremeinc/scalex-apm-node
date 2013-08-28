var path = require('path')
var logging = require(path.join(__dirname, '..', 'logging'));
var collector = require(path.join(__dirname, '..', 'collector'));

var LOG = new logging.Logger(path.basename(module.filename));
var COLLECTOR = collector.getCollector();

function dummyWrapper(func, name) {
    return function () {
        LOG.debug("Start: %s", name);
        var ret = func.apply(this, arguments);
        LOG.debug("End: %s", name);
        return ret;
    }
}

function transactionWrapper(func, name) {
    return function () {
        var tr, ret, error;
        
        LOG.debug("New transaction: %s", name);

        tr = COLLECTOR.beginTransaction(name);
        try {
            ret = func.apply(this, arguments);
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

function callWrapper(func, name) {
    return function () {
        var tr, ret, error;
        
        LOG.debug("Wrapped call: %s", name);

        tr = COLLECTOR.beginTrace(name);
        try {
            ret = func.apply(this, arguments);
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

function callbackWrapper(callback, name, transaction) {
    return function() {
        var tr, ret, error;
        
        LOG.debug("Callback call: %s", name);

        COLLECTOR.setTransaction(transaction);
        tr = COLLECTOR.beginTrace(name);
        try {
            ret = callback.apply(this, arguments);
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

module.exports.dummyWrapper = dummyWrapper
module.exports.transactionWrapper = transactionWrapper
module.exports.callWrapper = callWrapper
