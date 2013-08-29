var path = require('path');
var lib_dir = path.join(__dirname, 'lib');

var logging = require(path.join(lib_dir, 'logging'));
var obj_patch = require(path.join(lib_dir, 'obj_patch'));
var wrapper = require(path.join(lib_dir, 'wrapper'));
var wrapper_module = require(path.join(lib_dir, 'wrapper', 'module'));
var wrapper_http = require(path.join(lib_dir, 'wrapper', 'http'));

var LOG = new logging.Logger(path.basename(module.filename));
//logging.CONFIG.level = logging.INFO;

LOG.info("Initializing Scalextreme APM plugin...");

obj_patch.add(require('http'), 'http', 'request', wrapper_http.request);
obj_patch.add(require('http'), 'http', 'createServer', wrapper_http.createServer);


obj_patch.add(require('module'), 'module', '_load', wrapper_module._load);
