var path = require('path');
var lib_dir = path.join(__dirname, '..');

var logging = require(path.join(lib_dir, 'logging'));
var obj_patch = require(path.join(lib_dir, 'obj_patch'));
var wrapper = require(path.join(lib_dir, 'wrapper'));
var collector = require(path.join(lib_dir, 'collector'));

var LOG = new logging.Logger(path.basename(module.filename));
var COLLECTOR = collector.getCollector();

function createServer(func, name) {
    var handlerName = name + '.handler';
    return function (handler) {
        return func(function (request, response) {
            var t, ret, error;
        
            LOG.debug("New web transaction: %s", handlerName);

            t = COLLECTOR.beginTransaction('HTTP', handlerName);
            t.url = request.url;
            
            response.once('finish', function () {
                LOG.debug("Http transaction finish: %s", handlerName);
                if (t.trace) {
                    COLLECTOR.enterTransaction(t);
                    COLLECTOR.endTransaction(t);
                }
            });
            
            try {
                ret = handler.apply(this, arguments);
            } catch(e) { 
                if (t.trace) t.trace.addException(e);
                error = e;
            } finally {
                if (t) COLLECTOR.exitTransaction(t);
            }
            if (error) throw error;
            
            return ret;
        });
    };
}

function request(func, name) {
    var cbName = name + '.callback';
    return function (options, callback) {
        var t, tr, ret, error;
        
        LOG.debug("Wrapped http request: %s, options: %s", name, options);
        
        t = COLLECTOR.getTransaction();
        tr = COLLECTOR.beginTrace(name);
        tr.setAsync(true);
        try {
            ret = func.call(this, options, wrapper.callbackWrapper(callback, cbName, t, tr));
        } catch(e) { 
            if (tr) tr.addException(e);
            error = e;
        } finally {
            if (tr) COLLECTOR.exitTrace(tr);
        }
        if (error) throw error;
        
        return ret;
    }
}

function patch(http) {
    obj_patch.add(http, 'http', 'request', request);
    obj_patch.add(http, 'http', 'createServer', createServer);
}

module.exports.patch = patch
