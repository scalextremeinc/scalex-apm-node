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
        
        obj_patch.add(conn, 'connection', 'connect', wrapper.callWrapper);
        //obj_patch.add(conn, 'connection', 'end', wrapper.callWrapper);
        obj_patch.add(conn, 'connection', 'query', query);
            
        return conn;
    }, name);
}

// Connection.query
function query(func, name) {
    var cbName = name + '.callback';
    return function (sql, values, callback) {
        var t, tr, ret, error;
        
        var sqlQuery, callback;
        if (typeof sql === 'object') {
          // function (options, callback)
          sqlQuery = sql.sql;
        } else
          // function (sql, callback)
          // function (sql, values, callback)
          sqlQuery = sql;
        
        LOG.debug("Wrapped mysql query: %s", sqlQuery);
        
        t = COLLECTOR.getTransaction();
        tr = COLLECTOR.beginTrace(name);
        tr.setAsync(true);
        tr.sql = sqlQuery;
        
        if (typeof sql === 'object' || typeof values === 'function')
            values = wrapper.callbackWrapper(values, cbName, t, tr);
        else
            callback = wrapper.callbackWrapper(callback, cbName, t, tr);
    
        try {
            ret = func.call(this, sql, values, callback);
        } catch(e) { 
            if (tr) tr.addException(e);
            error = e;
        } finally {
            if (tr) {
                COLLECTOR.exitTrace(tr);
                //COLLECTOR.exitTransaction(t);
            }
        }
        if (error) throw error;
        
        return ret;
    };
}

function patch(mysql) {
    obj_patch.add(mysql, 'mysql', 'createConnection', createConnection);
}

module.exports.patch = patch
