var path = require('path');
var lib_dir = path.join(__dirname, '..');

var logging = require(path.join(lib_dir, 'logging'));
var obj_patch = require(path.join(lib_dir, 'obj_patch'));
var wrapper = require(path.join(lib_dir, 'wrapper'));
var collector = require(path.join(lib_dir, 'collector'));

var LOG = new logging.Logger(path.basename(module.filename));
var COLLECTOR = collector.getCollector();


function compile(func, name) {
    return function () {
        var transaction = COLLECTOR.getTransaction();
        
        var ret;
        if (transaction) {
            LOG.debug("Wrapped call: %s", name);
            var trace, error;
            
            trace = transaction.beginTrace(name);
            trace.setArgs(arguments);
            try {
                ret = func.apply(this, arguments);
            } catch(e) { 
                transaction.addException(msg);
                error = e;
            } finally {
                transaction.endTrace(trace);
            }
            if (error)
                throw error;
        } else {
            ret = func.apply(this, arguments);
        }
        
        return wrapper.callWrapper(ret, name + '.render');
    };
}

function patch(ejs) {
    obj_patch.add(ejs, 'ejs', 'compile', compile);
}

module.exports.patch = patch
