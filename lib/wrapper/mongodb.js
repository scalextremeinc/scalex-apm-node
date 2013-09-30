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
        var t = COLLECTOR.getTransaction();
        if(!t)
            return func.call(this, url, options, callback);
        
        var t, tr, ret, error;
        LOG.debug("Wrapped mongo connect: %s", url);
        
        tr = t.beginTrace(name);
        tr.setAsync(true);
        try {
            ret = func.call(this, url, options, wrapper.callbackWrapper(callback, name, t, tr));
        } catch(e) { 
            t.addException(e);
            error = e;
        } finally {
            t.exitTrace(tr);
        }
        if (error) throw error;
        
        return ret;
    };
}

function crud(func, name) {
    return function () {
        var t = COLLECTOR.getTransaction();
        if(!t)
            return func.apply(this, arguments);
        
        var tr, ret, error;
        LOG.debug("Wrapped mongo call: %s, has callback: %s", name, hasCallback);
        
        var args = Array.prototype.slice.call(arguments, 0);
        var hasCallback = typeof args[args.length - 1] === 'function';
        
        tr = t.beginTrace(name);
        tr.setAsync(true);
        
        if (hasCallback) {
            var callback = args[args.length - 1];
            args[args.length - 1] = wrapper.callbackWrapper(callback, name, t, tr)
        }
        
        try {
            ret = func.apply(this, args);
        } catch(e) { 
            t.addException(e);
            error = e;
        } finally {
            if (!hasCallback) {
                t.exitTrace(tr);
                // wrapp cursor in case callback is not given
                obj_patch.add(ret, 'mongodb.cursor', 'each', cursorEachWrapper(t, tr));
            } else
                t.exitTrace(tr);
        }
        if (error) throw error;
        
        return ret;
    };
}

function cursorEachCallback(callback, name, t, tr) {
    return function(err, doc) {
        if (!doc) {
            t.endTrace(tr);
        }
        return callback.call(this, err, doc);
    }
}

function cursorEachWrapper(t, tr) {
    return function cursorEach(func, name) {
        var cbName = name + '.callback';
        return function (callback) {
            var ret, error;
            
            LOG.debug("Wrapped call: %s", name);
            
            try {
                ret = func.call(this, cursorEachCallback(callback, cbName, t, tr));
            } catch(e) { 
                if (t)
                    t.addException(e);
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
    obj_patch.add(mongodb.Collection.prototype,
        'mongodb.Collection.prototype', 'update', crud);
    obj_patch.add(mongodb.Collection.prototype,
        'mongodb.Collection.prototype', 'remove', crud);
    obj_patch.add(mongodb.Collection.prototype,
        'mongodb.Collection.prototype', 'count', crud);
}

module.exports.patch = patch
