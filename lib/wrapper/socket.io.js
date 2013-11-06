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
    return function () {
        var transaction, ret, error;
    
        LOG.debug("New socket.io transaction: %s", handlerName);

        transaction = COLLECTOR.beginTransaction('socket.io', handlerName);
        transaction.trace.setArgs(arguments);
        
        try {
            ret = func.apply(this, arguments);
        } catch(e) {
            var msg = e.stack || e;
            LOG.error("Transaction execution failed: %s", msg);
            transaction.addException(msg);
            transaction.end();
            error = e;
        } finally {
            transaction.end();
        }
        if (error)
            throw error;
        
        return ret;
    };
}

function scocketListenerWrapper(func, name) {
    return function (type, listener) {
        if (typeof listener === 'function') {
            var wrapped = handlerWrapper(listener, name + "/" + type);
            return func.call(this, type, wrapped);
        } else {
            return func.apply(this, arguments);
        }
    };
}

function connectionHandlerWrapper(func, name) {
    return function (server) {
        LOG.debug("Wrapped call: %s", name);
        obj_patch.add(server, 'socket.io.Manager.server', 'on', scocketListenerWrapper);
        obj_patch.add(server, 'socket.io.Manager.server', 'addListener', scocketListenerWrapper);
        return func.apply(this, arguments);
    };
}

function managerListenerWrapper(func, name) {
    return function (type, listener) {
        if (type === 'connection' && typeof listener === 'function') {
            var wrapped = connectionHandlerWrapper(listener, name);
            return func.call(this, type, wrapped);
        } else {
            return func.apply(this, arguments);
        }
    };
}

function listenWrapper(func, name) {
    return function () {
        var manager = func.apply(this, arguments);
        
        obj_patch.add(manager.sockets,
            'socket.io.Manager.sockets', 'on', managerListenerWrapper);
        obj_patch.add(manager.sockets,
            'socket.io.Manager.sockets', 'addListener', managerListenerWrapper);
        
        return manager;
    };
}

function patch(socketio) {
    obj_patch.add(socketio && socketio.Manager && socketio.Manager.prototype,
        'socket.io.Manager.prototype', 'on', managerListenerWrapper);
    obj_patch.add(socketio && socketio.Manager && socketio.Manager.prototype,
        'socket.io.Manager.prototype', 'addListener', managerListenerWrapper);
    obj_patch.add(socketio, 'socket.io', 'listen', listenWrapper);
}

module.exports.patch = patch
