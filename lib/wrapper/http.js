var path = require('path');
var lib_dir = path.join(__dirname, '..');

var logging = require(path.join(lib_dir, 'logging'));
var obj_patch = require(path.join(lib_dir, 'obj_patch'));
var wrapper = require(path.join(lib_dir, 'wrapper'));
var collector = require(path.join(lib_dir, 'collector'));

var LOG = new logging.Logger(path.basename(module.filename));
var COLLECTOR = collector.getCollector();

function handlerWrapper(func, name) {
    var handlerName = name + '.handler';
    return function (request, response) {
        var transaction, ret, error;

        transaction = COLLECTOR.beginTransaction('http', handlerName);
        transaction.web = {};
        transaction.web.url = request.url;
        transaction.trace.setArgs(arguments);

        LOG.debug("Http transaction started, id: %s, data: %s", transaction._id, handlerName);
        
        response.once('finish', function () {
            LOG.debug("Http transaction finished, id: %s,  handler: %s, code: %s",
                transaction._id, handlerName, response.statusCode);
            
            transaction.web.code = response.statusCode;
            transaction.web.headers = {};
            transaction.web.headers['Content-Type'] = response.getHeader('Content-Type');
            transaction.web.headers['Content-Length'] = response.getHeader('Content-Length');
            transaction.web.headers['Content-Location'] = response.getHeader('Content-Location');
            if (300 <= response.statusCode && response.statusCode < 400)
                transaction.web.headers['Location'] = response.getHeader('Location');
            
            transaction.end();
        });
        
        try {
            ret = func.apply(this, arguments);
        } catch(e) {
            var msg = e.stack || e;
            LOG.error("Transaction execution failed: %s", msg);
            transaction.addException(msg);
            transaction.end();
            error = e;
        } finally {
            COLLECTOR.exitTransaction(transaction);
        }
        if (error)
            throw error;
        
        return ret;
    };
}

function addListenerWrapper(func, name) {
    return function (type, listener) {
        if (type === 'request' && typeof listener === 'function') {
            var wrapped = handlerWrapper(listener, name);
            return func.call(this, type, wrapped);
        } else {
            return func.apply(this, arguments);
        }
    };
}

function request(func, name) {
    return function (options, callback) {
        var transaction = COLLECTOR.getTransaction();
        if (!transaction)
            return func.call(this, options, callback);
        
        var trace, ret, error;
        LOG.debug("Wrapped http request: %s, options: %s", name, options);
        
        trace = transaction.beginTrace(name);
        trace.setAsync(true);
        trace.setArgs(arguments);
        
        if (this.once) {
            this.once('error', function (e) {
                LOG.debug("Http error: %s", e);
                var msg = e.stack || e;
                transaction.addException(msg);
                transaction.finishTrace(tr);
            });
        }
        
        try {
            ret = func.call(this, options,
                wrapper.callbackWrapper(callback, name, transaction, trace));
        } catch(e) { 
            trace.addException(e);
            error = e;
        } finally {
            transaction.exitTrace(trace);
        }
        if (error) throw error;
        
        if (ret.once)
            ret.once('error', function (e) {
                transaction.addException(e.stack || e);
                transaction.endTrace(tr);
            });
        
        return ret;
    }
}

function patch(http) {
    obj_patch.add(http, 'http', 'request', request);
    obj_patch.add(http && http.Server && http.Server.prototype,
                     'http.Server.prototype', 'addListener', addListenerWrapper);
}

module.exports.patch = patch
