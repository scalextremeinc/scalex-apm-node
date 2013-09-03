var path = require('path');
var lib_dir = path.join(__dirname, 'lib');

var logging = require(path.join(lib_dir, 'logging'));
//logging.CONFIG.level = logging.INFO;
var LOG = new logging.Logger(path.basename(module.filename));

LOG.info("Initializing Scalextreme APM plugin...");

// IoC
var uploader = require(path.join(lib_dir, 'uploader'));
var collector = require(path.join(lib_dir, 'collector'));
var c = new collector.Collector();
var u = new uploader.Uploader(c);
u.start();

// initialize module patching
var obj_patch = require(path.join(lib_dir, 'obj_patch'));
var wrapper = require(path.join(lib_dir, 'wrapper', 'module'));
var module = require('module');
obj_patch.add(module, 'module', '_load', wrapper._load);
module._scalex_patched = true;
