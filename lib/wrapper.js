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
        var tr, ret, error;
        
        LOG.debug("New transaction: %s", name);

        t = COLLECTOR.beginTransaction('STD', name);
        try {
            ret = func.apply(this, arguments);
        } catch(e) { 
            if (t) t.addException(e);
            error = e;
        } finally {
            if (t) t.end();
        }
        if (error) throw error;
        
        return ret;
    }
}

function callWrapper(func, name, t) {
    return function () {
        if (!t)  {
            t = COLLECTOR.getTransaction();
            if (!t)
                return func.apply(this, arguments);
        }
        LOG.debug("Wrapped call: %s", name);
            
        var tr, ret, error;
        tr = t.beginTrace(name);
        
        try {
            ret = func.apply(this, arguments);
        } catch(e) { 
            t.addException(e);
            error = e;
        } finally {
            t.finishTrace(tr);
        }
        if (error) throw error;
        
        return ret;
    }
}

function callbackWrapper(callback, baseName, t, tr) {
    return function() {
        var ret;
        //var error;
        var name = baseName + '.' + (callback.name || 'callback');
        
        LOG.debug("Callback call: %s", name);

        t.enterTrace(tr);

        COLLECTOR.enterTransaction(t);
        var cbtr = t.beginTrace(name);
        
        try {
            ret = callback.apply(this, arguments);
        } catch(e) {
            var msg = e.stack || e;
            LOG.error("Failed executing callback: %s, %s", name, msg);
            t.addException(e);
            //error = e;
        } finally {
            if (cbtr) t.finishTrace(cbtr);
            if (tr) t.finishTrace(tr);
        }
        //if (error) throw error;
        
        return ret;
    }
}

function callWithCallbackWrapper(func, name) {
    return function () {
        var t = COLLECTOR.getTransaction();
        if (!t)
            return func.apply(this, arguments);
        
        LOG.debug("Wrapped call: %s", name);
        var ret, tr, error;
        var args = Array.prototype.slice.call(arguments, 0);
        
        tr = t.beginTrace(name);
        
        // wrap callback param (last param)
        args[args.length - 1] = callbackWrapper(args[args.length - 1], name, t, tr);
        
        try {
            ret = func.apply(this, args);
        } catch(e) { 
            t.addException(msg);
            error = e;
        } finally {
            t.exitTrace(tr);
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
