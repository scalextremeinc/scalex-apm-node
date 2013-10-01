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
            t.web = {};
            t.web.url = request.url;
            
            response.once('finish', function () {
                LOG.debug("Http transaction finish, handler: %s, code: %s",
                    handlerName, response.statusCode);
                
                t.web.code = response.statusCode;
                t.web.headers = {};
                t.web.headers['Content-Type'] = response.getHeader('Content-Type');
                t.web.headers['Content-Length'] = response.getHeader('Content-Length');
                t.web.headers['Content-Location'] = response.getHeader('Content-Location');
                if (300 <= response.statusCode && response.statusCode < 400)
                    t.web.headers['Location'] = response.getHeader('Location');
                
                t.end();
            });
            
            try {
                ret = handler.apply(this, arguments);
            } catch(e) {
                var msg = e.stack || e;
                LOG.error("Transaction execution failed: %s", msg);
                t.addException(msg);
                t.end();
                error = e;
            } finally {
                COLLECTOR.exitTransaction(t);
            }
            if (error)
                throw error;
            
            return ret;
        });
    };
}

function request(func, name) {
    return function (options, callback) {
        var t = COLLECTOR.getTransaction();
        if (!t)
            return func.call(this, options, callback);
        
        var tr, ret, error;
        LOG.debug("Wrapped http request: %s, options: %s", name, options);
        
        tr = t.beginTrace(name);
        tr.setAsync(true);
        
        if (this.once) {
            this.once('error', function (e) {
                LOG.debug("Http error: %s", e);
                var msg = e.stack || e;
                t.addException(msg);
                t.finishTrace(tr);
            });
        }
        
        try {
            ret = func.call(this, options, wrapper.callbackWrapper(callback, name, t, tr));
        } catch(e) { 
            tr.addException(e);
            error = e;
        } finally {
            t.exitTrace(tr);
        }
        if (error) throw error;
        
        if (ret.once)
            ret.once('error', function (e) {
                t.addException(e.stack || e);
                t.endTrace(tr);
            });
        
        return ret;
    }
}

function patch(http) {
    obj_patch.add(http, 'http', 'request', request);
    obj_patch.add(http, 'http', 'createServer', createServer);
}

module.exports.patch = patch
