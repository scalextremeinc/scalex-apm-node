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
        var t = COLLECTOR.getTransaction();
        
        var ret;
        if (t) {
            LOG.debug("Wrapped call: %s", name);
            var tr, error;
            
            tr = t.beginTrace(name);
            try {
                ret = func.apply(this, arguments);
            } catch(e) { 
                t.addException(msg);
                error = e;
            } finally {
                t.endTrace(tr);
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
