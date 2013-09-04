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
        var t, tr, ret, error;
        
        LOG.debug("Wrapped mongo connect: %s", url);
        
        t = COLLECTOR.getTransaction();
        tr = COLLECTOR.beginTrace(name);
        tr.setAsync(true);
        try {
            ret = func.call(this, url, options, wrapper.callbackWrapper(callback, cbName, t, tr));
        } catch(e) { 
            if (tr) tr.addException(e);
            error = e;
        } finally {
            if (tr) COLLECTOR.exitTrace(tr);
        }
        if (error) throw error;
        
        return ret;
    };
}

function crud(func, name) {
    return function () {
        var t, tr, ret, error;
        var args = Array.prototype.slice.call(arguments, 0);
        var hasCallback = typeof args[args.length - 1] === 'function';
        
        LOG.debug("Wrapped mongo call: %s", name);
        
        t = COLLECTOR.getTransaction();
        tr = COLLECTOR.beginTrace(name);
        tr.setAsync(true);
        
        if (hasCallback) {
            var callback = arguments[arguments.length - 1];
            args[args.length - 1] = wrapper.callbackWrapper(callback, name + '.callback', t, tr)
        }
        
        try {
            ret = func.apply(this, args);
        } catch(e) { 
            if (tr) tr.addException(e);
            error = e;
        } finally {
            if (!hasCallback)
                COLLECTOR.endTrace(tr);
            else
                COLLECTOR.exitTrace(tr);
        }
        if (error) throw error;
        
        // wrapp cursor in case callback is not given
        /*
        if (!isCallback) {
            obj_patch.add(ret, 'mongodb.cursor', 'each', cursorEach);
        }
        */
        
        return ret;
    };
}

// TODO
function cursorEach(func, name) {
    var cbName = name + '.callback';
    return function (callback) {
        var t, tr, ret, error;
        
        LOG.debug("Wrapped mogo cursor each: %s", name);
        
        t = COLLECTOR.getTransaction();
        tr = COLLECTOR.beginTrace(name);
        tr.setAsync(true);
        try {
            ret = func.call(this, wrapper.callbackWrapper(callback, cbName, t, tr));
        } catch(e) { 
            if (tr) tr.addException(e);
            error = e;
        } finally {
            if (tr) COLLECTOR.exitTrace(tr);
        }
        if (error) throw error;
        
        return ret;
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
