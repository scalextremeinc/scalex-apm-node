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
                    var transaction = COLLECTOR.getTransaction();
                    if (transaction)
                        transaction.addException(e);
                }
                return next(e);
            }
        });
        
        return func.apply(this, arguments);
    };
}

function patch(connect) {
    var version = connect && connect.version && connect.version[0];
    switch (version) {
        case '1':
            obj_patch.add(connect && connect.HTTPServer && connect.HTTPServer.prototype,
                'connect.HTTPServer.prototype', 'use', use);
            break;
        case '2':
            obj_patch.add(connect && connect.proto, 'connect.proto', 'use', use);
            break;
        default:
            LOG.error("Unsupported connect version: %s", version);
    }
}

module.exports.patch = patch
