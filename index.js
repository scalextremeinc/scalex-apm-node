var path = require('path');
var lib_dir = path.join(__dirname, 'lib');

var logging = require(path.join(lib_dir, 'logging'));
var obj_patch = require(path.join(lib_dir, 'obj_patch'));
var wrapper_module = require(path.join(lib_dir, 'wrapper', 'module'));

//logging.CONFIG.level = logging.INFO;
var LOG = new logging.Logger(path.basename(module.filename));

LOG.info("Initializing Scalextreme APM plugin...");

var module = require('module');
obj_patch.add(module, 'module', '_load', wrapper_module._load);
module._scalex_patched = true;
