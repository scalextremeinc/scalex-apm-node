var path = require('path');
var lib_dir = path.join(__dirname, '..');

var logging = require(path.join(lib_dir, 'logging'));
var obj_patch = require(path.join(lib_dir, 'obj_patch'));
var wrapper = require(path.join(lib_dir, 'wrapper'));
var collector = require(path.join(lib_dir, 'collector'));

var LOG = new logging.Logger(path.basename(module.filename));
var COLLECTOR = collector.getCollector();


function connect(func, name) {
    return function (url, options, callback) {
        var transaction = COLLECTOR.getTransaction();
        if(!transaction)
            return func.call(this, url, options, callback);
        
        var transaction, trace, ret, error;
        LOG.debug("Wrapped mongo connect: %s", url);
        
        trace = transaction.beginTrace(name);
        trace.setAsync(true);
        trace.setArgs(arguments);
        
        try {
            ret = func.call(this, url, options,
                wrapper.callbackWrapper(callback, name, transaction, trace));
        } catch(e) { 
            transaction.addException(e);
            error = e;
        } finally {
            transaction.exitTrace(trace);
        }
        if (error) throw error;
        
        return ret;
    };
}

function crud(func, name) {
    return function () {
        var tansaction = COLLECTOR.getTransaction();
        if(!tansaction)
            return func.apply(this, arguments);
        
        var trace, ret, error;
        var args = Array.prototype.slice.call(arguments, 0);
        var hasCallback = typeof args[args.length - 1] === 'function';
        
        var stack = new Error().stack;
        console.log("PRINTING CALL STACK");
        console.log(stack);
        LOG.debug("Wrapped mongo call: %s, has callback: %s", name, hasCallback);
        
        trace = tansaction.beginTrace(name);
        trace.setAsync(true);
        trace.setArgs(arguments);
        
        if (hasCallback) {
            var callback = args[args.length - 1];
            args[args.length - 1] = wrapper.callbackWrapper(callback, name, tansaction, trace)
        }
        
        try {
            ret = func.apply(this, args);
        } catch(e) { 
            tansaction.addException(e);
            error = e;
        } finally {
            if (!hasCallback) {
                tansaction.exitTrace(tr);
                // wrapp cursor in case callback is not given
                obj_patch.add(ret, 'mongodb.cursor', 'each', cursorEachWrapper(tansaction, trace));
            } else
                tansaction.exitTrace(trace);
        }
        if (error) throw error;
        
        return ret;
    };
}

function crud(func, name) {
    return function () {
        var transaction = COLLECTOR.getTransaction();
        if(!transaction)
            return func.apply(this, arguments);
        
        var trace, ret, error;
        var args = Array.prototype.slice.call(arguments, 0);
        var hasCallback = typeof args[args.length - 1] === 'function';

        LOG.debug("Wrapped mongo call: %s, has callback: %s", name, hasCallback);
        
        trace = transaction.beginTrace(name);
        trace.setAsync(true);
        trace.setArgs(arguments);
        
        if (hasCallback) {
            var callback = args[args.length - 1];
            args[args.length - 1] = wrapper.callbackWrapper(callback, name, transaction, trace)
        }
        
        try {
            ret = func.apply(this, args);
        } catch(e) { 
            transaction.addException(e);
            error = e;
        } finally {
            if (!hasCallback) {
                transaction.exitTrace(trace);
                // wrapp cursor in case callback is not given
                obj_patch.add(ret, 'mongodb.cursor', 'each', cursorEachWrapper(transaction, trace));
                obj_patch.add(ret, 'mongodb.cursor', 'nextObject',
                    nextObjectWrapper(transaction, trace));
                
            } else
                transaction.exitTrace(trace);
        }
        if (error) throw error;
        
        return ret;
    };
}

function cursorEachCallback(callback, name, transaction, trace) {
    return function(err, doc) {
        if (!doc) {
            transaction.endTrace(trace);
        }
        return callback.call(this, err, doc);
    }
}

function nextObjectWrapper(transaction, trace) {
    return function nextObject(func, name) {
        var cbName = name + '.callback';
        return function (callback) {
            var ret, error;
            
            // findOne method requires special treatment
            var isFindOne = this.limitValue == -1 && this.batchSizeValue == 1;
            
            LOG.debug("Wrapped call: %s", name);
            
            try {
                ret = func.call(this, function(err, item) {
                    var ret2 = callback.apply(this, arguments);
                    if (isFindOne) {
                        if (err)
                            transaction.addException(err);
                        transaction.endTrace(trace);
                    }
                    return ret2;
                });
            } catch(e) { 
                if (isFindOne)
                    transaction.addException(e);
                error = e;
            } finally {
                // empty
            }
            if (error) throw error;
            
            return ret;
        };
    };
}

function cursorEachWrapper(transaction, trace) {
    return function cursorEach(func, name) {
        var cbName = name + '.callback';
        return function (callback) {
            var ret, error;
            
            LOG.debug("Wrapped call: %s", name);
            
            try {
                ret = func.call(this, cursorEachCallback(callback, cbName, transaction, trace));
            } catch(e) { 
                if (transaction)
                    transaction.addException(e);
                error = e;
            } finally {
                // empty
            }
            if (error) throw error;
            
            return ret;
        };
    };
}

function patch(mongodb) {
    obj_patch.add(mongodb.MongoClient,
        'mongodb.MongoClient', 'connect', crud);
    obj_patch.add(mongodb.Collection.prototype,
        'mongodb.Collection.prototype', 'insert', crud);
    obj_patch.add(mongodb.Collection.prototype,
        'mongodb.Collection.prototype', 'find', crud);
    //obj_patch.add(mongodb.Collection.prototype,
    //    'mongodb.Collection.prototype', 'findOne', findOne);
    obj_patch.add(mongodb.Collection.prototype,
        'mongodb.Collection.prototype', 'update', crud);
    obj_patch.add(mongodb.Collection.prototype,
        'mongodb.Collection.prototype', 'remove', crud);
    obj_patch.add(mongodb.Collection.prototype,
        'mongodb.Collection.prototype', 'count', crud);
}

module.exports.patch = patch
