var path = require('path');
var lib_dir = path.join(__dirname, '..');

var logging = require(path.join(lib_dir, 'logging'));
var obj_patch = require(path.join(lib_dir, 'obj_patch'));
var wrapper = require(path.join(lib_dir, 'wrapper'));
var collector = require(path.join(lib_dir, 'collector'));

var LOG = new logging.Logger(path.basename(module.filename));
var COLLECTOR = collector.getCollector();


function createConnection(func, name) {
    return wrapper.callWrapper(function (config) {
        var conn = func.apply(this, arguments);
        
        obj_patch.add(conn, 'mysql.connection', 'connect', wrapper.callWrapper);
        obj_patch.add(conn, 'mysql.connection', 'end', wrapper.callWrapper);
        obj_patch.add(conn, 'mysql.connection', 'query', query);
            
        return conn;
    }, name);
}

// Connection.query
function query(func, name) {
    return function (sql, values, callback) {
        var transaction = COLLECTOR.getTransaction();
        if (!transaction)
            return func.apply(this, arguments);
        
        var trace, ret, error;
        LOG.debug("Wrapped mysql query: %s", sqlQuery);
        
        var sqlQuery, callback;
        if (typeof sql === 'object')
            // function (options, callback)
            sqlQuery = sql.sql;
        else
            // function (sql, callback)
            // function (sql, values, callback)
            sqlQuery = sql;
        
        trace = transaction.beginTrace(name);
        trace.setAsync(true);
        trace.sql = sqlQuery;
        trace.setArgs(arguments);
        
        if (typeof sql === 'object' || typeof values === 'function') {
            values = wrapper.callbackWrapper(values, name, transaction, trace);
        } else {
            callback = wrapper.callbackWrapper(callback, name, transaction, trace);
        }
    
        try {
            ret = func.call(this, sql, values, callback);
        } catch(e) { 
            transaction.addException(msg);
            error = e;
        } finally {
            transaction.exitTrace(trace);
        }
        if (error) throw error;
        
        return ret;
    };
}

function patch(mysql) {
    obj_patch.add(mysql, 'mysql', 'createConnection', createConnection);
}

module.exports.patch = patch
