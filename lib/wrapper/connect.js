var path = require('path');
var lib_dir = path.join(__dirname, '..');

var logging = require(path.join(lib_dir, 'logging'));
var obj_patch = require(path.join(lib_dir, 'obj_patch'));
var wrapper = require(path.join(lib_dir, 'wrapper'));
var collector = require(path.join(lib_dir, 'collector'));

var LOG = new logging.Logger(path.basename(module.filename));
var COLLECTOR = collector.getCollector();


function use(func, name) {
    return function () {
        this.stack.push({
            route : '',
            handle : function (e, req, res, next) {
                if (e) {
                    LOG.debug('Connect exception: %s', e);
                    var t = COLLECTOR.getTransaction();
                    if (t) {
                        var msg = e.stack || e;
                        var tr = t.currentTrace();
                        if (tr)
                            tr.addException(msg);
                        else
                            t.addException(msg);
                    }
                }
                return next(e);
            }
        });
        
        return func.apply(this, arguments);
    };
}

function patch(connect) {
    obj_patch.add(connect.proto, 'connect.proto', 'use', use);
}

module.exports.patch = patch
