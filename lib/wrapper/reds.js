var path = require('path');
var lib_dir = path.join(__dirname, '..');

var logging = require(path.join(lib_dir, 'logging'));
var obj_patch = require(path.join(lib_dir, 'obj_patch'));
var wrapper = require(path.join(lib_dir, 'wrapper'));
var collector = require(path.join(lib_dir, 'collector'));

var LOG = new logging.Logger(path.basename(module.filename));
var COLLECTOR = collector.getCollector();


function patch(reds) {
    obj_patch.add(reds && reds.Search && reds.Search.prototype,
        'reds.Search.prototype', 'index', wrapper.callWithCallbackWrapper);
    obj_patch.add(reds && reds.Search && reds.Search.prototype,
        'reds.Search.prototype', 'remove', wrapper.callWithCallbackWrapper);
    obj_patch.add(reds && reds.Query && reds.Query.prototype,
        'reds.Query.prototype', 'end', wrapper.callWithCallbackWrapper);
}

module.exports.patch = patch
