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
        LOG.info("Call, func: %s, duration: %s", name, Date.now() - start);
        return ret;
    }
}

function transactionWrapper(func, name) {
    return function () {
        var ret, error;
        
        LOG.debug("New transaction: %s", name);

        transaction = COLLECTOR.beginTransaction('STD', name);
        transaction.trace.setArgs(arguments);
        try {
            ret = func.apply(this, arguments);
        } catch(e) { 
            if (transaction) transaction.addException(e);
            error = e;
        } finally {
            if (transaction) transaction.end();
        }
        if (error) throw error;
        
        return ret;
    }
}

function callWrapper(func, name, transaction) {
    return function () {
        if (!transaction)  {
            transaction = COLLECTOR.getTransaction();
            if (!transaction)
                return func.apply(this, arguments);
        }
        LOG.debug("Wrapped call: %s", name);
            
        var trace, ret, error;
        trace = transaction.beginTrace(name);
        trace.setArgs(arguments);
        try {
            ret = func.apply(this, arguments);
        } catch(e) { 
            transaction.addException(e);
            error = e;
        } finally {
            transaction.finishTrace(trace);
        }
        if (error) throw error;
        
        return ret;
    }
}

function callbackWrapper(callback, baseName, transaction, trace) {
    return function() {
        var ret;
        //var error;
        var name = baseName + '.' + (callback.name || 'callback');
        
        LOG.debug("Callback call: %s", name);

        transaction.enterTrace(trace);

        COLLECTOR.enterTransaction(transaction);
        var cbtr = transaction.beginTrace(name);
        cbtr.setArgs(arguments);
        try {
            ret = callback.apply(this, arguments);
        } catch(e) {
            var msg = e.stack || e;
            LOG.error("Failed executing callback: %s, %s", name, msg);
            transaction.addException(e);
            //error = e;
        } finally {
            if (cbtr) transaction.finishTrace(cbtr);
            if (trace) transaction.finishTrace(trace);
        }
        //if (error) throw error;
        
        return ret;
    }
}

function callWithCallbackWrapper(func, name) {
    return function () {
        var transaction = COLLECTOR.getTransaction();
        if (!transaction)
            return func.apply(this, arguments);
        
        LOG.debug("Wrapped call: %s", name);
        var ret, trace, error;
        var args = Array.prototype.slice.call(arguments, 0);
        
        trace = transaction.beginTrace(name);
        trace.setArgs(arguments);
        // wrap callback param (last param)
        args[args.length - 1] = callbackWrapper(args[args.length - 1], name, transaction, trace);
        
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

module.exports.dummyWrapper = dummyWrapper
module.exports.transactionWrapper = transactionWrapper
module.exports.callWrapper = callWrapper
module.exports.callbackWrapper = callbackWrapper;
module.exports.callWithCallbackWrapper = callWithCallbackWrapper;
